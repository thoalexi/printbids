import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const env = z.enum(['sandbox', 'live']);
const HIRE_FAIL = "We couldn't complete the hire. Please try again.";
const sameOriginReturn = (url: string) => { const u = new URL(url); if (u.protocol !== 'https:' && u.hostname !== 'localhost') throw new Error('Invalid return URL'); return u.toString(); };

/** Starts an embedded card-saving session for a maker's bid. Nothing is charged. */
export const startBidCard = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ jobId: z.string().uuid(), returnUrl: z.string().url().max(2000), environment: env }).parse(v))
  .handler(async ({ data, context }) => {
    const { createStripeClient, getStripeErrorMessage, resolveOrCreateCustomer } = await import('./stripe.server');
    try {
      const stripe = createStripeClient(data.environment);
      const { data: u } = await context.supabase.auth.getUser();
      const customer = await resolveOrCreateCustomer(stripe, { email: u.user?.email, userId: context.userId });
      const session = await stripe.checkout.sessions.create({ mode: 'setup', currency: 'usd', ui_mode: 'embedded_page', customer, return_url: sameOriginReturn(data.returnUrl), metadata: { userId: context.userId, jobId: data.jobId, kind: 'bid_card' }, setup_intent_data: { metadata: { userId: context.userId, jobId: data.jobId } } });
      return { clientSecret: session.client_secret ?? '' };
    } catch (e) { return { error: getStripeErrorMessage(e) }; }
  });

const bidInput = z.object({
  jobId: z.string().uuid(), sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/), environment: env,
  itemized: z.boolean(), total: z.number().min(0).max(1e7), materials: z.number().min(0).max(1e7), printing: z.number().min(0).max(1e7), post_processing: z.number().min(0).max(1e7), design: z.number().min(0).max(1e7), shipping: z.number().min(0).max(1e7),
  lead_days: z.number().int().min(1).max(3650), technology: z.string().max(40), material: z.string().max(80), offers: z.enum(['Pickup', 'Delivery', 'Pickup or delivery']),
  links: z.array(z.string().url().max(500)).max(10), photos: z.array(z.string().max(500)).max(6), notes: z.string().max(3000), answers: z.array(z.string().max(500)).max(5),
});
/** Places a sealed bid after the maker's card was saved. */
export const placeBid = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => bidInput.parse(v))
  .handler(async ({ data, context }) => {
    const { createStripeClient, getStripeErrorMessage } = await import('./stripe.server');
    let pm = '', customer = '';
    try {
      const stripe = createStripeClient(data.environment);
      const s = await stripe.checkout.sessions.retrieve(data.sessionId, { expand: ['setup_intent'] });
      const si = s.setup_intent && typeof s.setup_intent === 'object' ? s.setup_intent : null;
      if (s.status !== 'complete' || s.metadata?.['userId'] !== context.userId || s.metadata?.['jobId'] !== data.jobId || !si?.payment_method) return { error: 'Please save your card to place this bid.' };
      pm = typeof si.payment_method === 'string' ? si.payment_method : si.payment_method.id;
      customer = typeof s.customer === 'string' ? s.customer : s.customer?.id ?? '';
    } catch (e) { return { error: getStripeErrorMessage(e) }; }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { sessionId: _s, environment, jobId, ...bid } = data;
    const r = await supabaseAdmin.from('bids').insert({ ...bid, job_id: jobId, maker_id: context.userId }).select('id').single();
    if (r.error) return { error: r.error.message };
    await supabaseAdmin.from('bid_cards').insert({ bid_id: r.data.id, maker_id: context.userId, job_id: jobId, environment, customer_id: customer, payment_method_id: pm });
    // Opportunistically release cards on jobs whose needed-by date has passed.
    const { releaseCards } = await import('./stripe.server');
    const expired = await supabaseAdmin.from('jobs').select('id').lt('deadline', new Date().toISOString().slice(0, 10)).limit(200);
    const ids = (expired.data ?? []).map(j => j.id);
    if (ids.length) { const old = await supabaseAdmin.from('bid_cards').select('bid_id,payment_method_id,environment').eq('status', 'saved').in('job_id', ids); await releaseCards(old.data ?? []); }
    return { ok: true as const };
  });

async function loadHire(supabase: any, userId: string, bidId: string) {
  const bid = await supabase.from('bids').select('id,job_id,maker_id,total').eq('id', bidId).single();
  if (bid.error) return null;
  const job = await supabase.from('jobs').select('id,owner_id,status').eq('id', bid.data.job_id).single();
  if (job.error || job.data.owner_id !== userId || job.data.status !== 'open') return null;
  return { bid: bid.data as { id: string; job_id: string; maker_id: string; total: number }, job: job.data as { id: string } };
}

/** Hire step 1: customer pays their 5% service fee (min $1) in embedded checkout. */
export const startHire = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ bidId: z.string().uuid(), returnUrl: z.string().url().max(2000), environment: env }).parse(v))
  .handler(async ({ data, context }) => {
    const h = await loadHire(context.supabase, context.userId, data.bidId);
    if (!h) return { error: HIRE_FAIL };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const card = await supabaseAdmin.from('bid_cards').select('bid_id').eq('bid_id', data.bidId).eq('status', 'saved').maybeSingle();
    if (!card.data) return { error: HIRE_FAIL };
    const { feeCents } = await import('./printbids');
    const { createStripeClient, getStripeErrorMessage, resolveOrCreateCustomer } = await import('./stripe.server');
    try {
      const stripe = createStripeClient(data.environment);
      const { data: u } = await context.supabase.auth.getUser();
      const customer = await resolveOrCreateCustomer(stripe, { email: u.user?.email, userId: context.userId });
      const session = await stripe.checkout.sessions.create({ mode: 'payment', ui_mode: 'embedded_page', customer, return_url: sameOriginReturn(data.returnUrl),
        line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: feeCents(Number(h.bid.total)), product_data: { name: 'PrintBids service fee (5%)' } } }],
        payment_intent_data: { description: 'PrintBids service fee (5%)', metadata: { jobId: h.job.id, bidId: data.bidId, userId: context.userId } },
        metadata: { userId: context.userId, jobId: h.job.id, bidId: data.bidId, kind: 'hire_fee' } });
      return { clientSecret: session.client_secret ?? '' };
    } catch (e) { return { error: getStripeErrorMessage(e) }; }
  });

/** Hire step 2: after the customer fee is paid, charge the maker fee (unless fee-free), then award. */
export const completeHire = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/), environment: env }).parse(v))
  .handler(async ({ data, context }) => {
    const { createStripeClient, getStripeErrorMessage, releaseCards } = await import('./stripe.server');
    const stripe = createStripeClient(data.environment);
    let session;
    try { session = await stripe.checkout.sessions.retrieve(data.sessionId); } catch (e) { console.error(getStripeErrorMessage(e)); return { error: HIRE_FAIL }; }
    const bidId = session.metadata?.['bidId'] ?? '';
    if (session.metadata?.['kind'] !== 'hire_fee' || session.metadata?.['userId'] !== context.userId || session.payment_status !== 'paid') return { error: HIRE_FAIL };
    const customerPi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
    const customerFee = session.amount_total ?? 0;
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const done = await supabaseAdmin.from('hire_charges').select('customer_fee_cents').eq('bid_id', bidId).maybeSingle();
    if (done.data) return { ok: true as const, customerFeeCents: done.data.customer_fee_cents };
    const refund = async () => { if (customerPi) try { await stripe.refunds.create({ payment_intent: customerPi }, { idempotencyKey: `refund-${data.sessionId}` }); } catch (e) { console.error('refund failed', getStripeErrorMessage(e)); } };
    const h = await loadHire(context.supabase, context.userId, bidId);
    if (!h) { await refund(); return { error: HIRE_FAIL }; }
    const card = await supabaseAdmin.from('bid_cards').select('*').eq('bid_id', bidId).eq('status', 'saved').maybeSingle();
    if (!card.data) { await refund(); return { error: HIRE_FAIL }; }
    const fm = await supabaseAdmin.from('founding_makers').select('fee_free_hires_used').eq('user_id', h.bid.maker_id).maybeSingle();
    const feeFree = !!fm.data && fm.data.fee_free_hires_used < 5;
    const { feeCents } = await import('./printbids');
    const makerFee = feeFree ? 0 : feeCents(Number(h.bid.total));
    let makerPi: string | null = null;
    if (makerFee > 0) {
      try {
        const pi = await stripe.paymentIntents.create({ amount: makerFee, currency: 'usd', customer: card.data.customer_id, payment_method: card.data.payment_method_id, off_session: true, confirm: true, description: 'PrintBids maker fee (5%)', metadata: { jobId: h.job.id, bidId, userId: h.bid.maker_id } }, { idempotencyKey: `hire-maker-${bidId}` });
        if (pi.status !== 'succeeded') { await refund(); return { error: HIRE_FAIL }; }
        makerPi = pi.id;
      } catch (e) { console.error('maker charge failed', getStripeErrorMessage(e)); await refund(); return { error: HIRE_FAIL }; }
    }
    const award = await supabaseAdmin.rpc('award_job', { target_bid: bidId, use_fee_free: feeFree });
    if (award.error) {
      console.error('award failed', award.error.message);
      if (makerPi) try { await stripe.refunds.create({ payment_intent: makerPi }); } catch { /* logged above */ }
      await refund(); return { error: HIRE_FAIL };
    }
    await supabaseAdmin.from('hire_charges').insert({ job_id: h.job.id, bid_id: bidId, maker_id: h.bid.maker_id, amount_cents: makerFee, payment_intent_id: makerPi, customer_fee_cents: customerFee, customer_payment_intent_id: customerPi, fee_free: feeFree, environment: data.environment });
    await supabaseAdmin.from('bid_cards').update({ status: feeFree ? 'released' : 'charged' }).eq('bid_id', bidId);
    const others = await supabaseAdmin.from('bid_cards').select('bid_id,payment_method_id,environment').eq('job_id', h.job.id).eq('status', 'saved');
    await releaseCards(others.data ?? []);
    return { ok: true as const, customerFeeCents: customerFee };
  });

/** Founding Maker status for the signed-in user plus remaining public spots. */
export const foundingStatus = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [mine, spots] = await Promise.all([
      context.supabase.from('founding_makers').select('number,fee_free_hires_used').eq('user_id', context.userId).maybeSingle(),
      context.supabase.rpc('founding_spots_left'),
    ]);
    return { number: mine.data?.number ?? null, feeFreeLeft: mine.data ? 5 - mine.data.fee_free_hires_used : 0, spotsLeft: spots.data ?? 0 };
  });

/** $5 Verified Maker application fee checkout. */
export const startVerificationFee = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ returnUrl: z.string().url().max(2000), environment: env }).parse(v))
  .handler(async ({ data, context }) => {
    const { createStripeClient, getStripeErrorMessage, resolveOrCreateCustomer } = await import('./stripe.server');
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: ['verified_maker_fee'] });
      const price = prices.data[0]; if (!price) throw new Error('Price not found');
      const { data: u } = await context.supabase.auth.getUser();
      const customer = await resolveOrCreateCustomer(stripe, { email: u.user?.email, userId: context.userId });
      const session = await stripe.checkout.sessions.create({ mode: 'payment', ui_mode: 'embedded_page', line_items: [{ price: price.id, quantity: 1 }], customer, return_url: sameOriginReturn(data.returnUrl), payment_intent_data: { description: 'Verified Maker application' }, metadata: { userId: context.userId, kind: 'verification_fee' } });
      return { clientSecret: session.client_secret ?? '' };
    } catch (e) { return { error: getStripeErrorMessage(e) }; }
  });

export const confirmVerificationFee = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/), environment: env }).parse(v))
  .handler(async ({ data, context }) => {
    const { createStripeClient, getStripeErrorMessage } = await import('./stripe.server');
    try {
      const s = await createStripeClient(data.environment).checkout.sessions.retrieve(data.sessionId);
      if (s.metadata?.['userId'] !== context.userId || s.metadata?.['kind'] !== 'verification_fee' || s.payment_status === 'unpaid') return { paid: false };
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      await supabaseAdmin.from('verifications').update({ fee_paid: true }).eq('user_id', context.userId);
      return { paid: true };
    } catch (e) { return { error: getStripeErrorMessage(e) }; }
  });
