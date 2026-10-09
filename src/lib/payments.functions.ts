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
    return { ok: true as const };
  });

/** Hire: charges the maker's 10% success fee, then awards the job. */
export const hireBid = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ bidId: z.string().uuid(), environment: env }).parse(v))
  .handler(async ({ data, context }) => {
    const bid = await context.supabase.from('bids').select('id,job_id,maker_id,total').eq('id', data.bidId).single();
    if (bid.error) return { error: HIRE_FAIL };
    const job = await context.supabase.from('jobs').select('id,owner_id,status').eq('id', bid.data.job_id).single();
    if (job.error || job.data.owner_id !== context.userId || job.data.status !== 'open') return { error: HIRE_FAIL };
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { createStripeClient, getStripeErrorMessage, releaseCards } = await import('./stripe.server');
    const card = await supabaseAdmin.from('bid_cards').select('*').eq('bid_id', data.bidId).eq('status', 'saved').maybeSingle();
    if (!card.data) return { error: HIRE_FAIL };
    const amount = Math.round(Number(bid.data.total) * 10); // 10% in cents
    let paymentIntentId: string | null = null;
    if (amount >= 50) {
      try {
        const pi = await createStripeClient(data.environment).paymentIntents.create({ amount, currency: 'usd', customer: card.data.customer_id, payment_method: card.data.payment_method_id, off_session: true, confirm: true, description: 'PrintBids success fee (10%)', metadata: { jobId: job.data.id, bidId: data.bidId, userId: bid.data.maker_id } }, { idempotencyKey: `hire-${data.bidId}` });
        if (pi.status !== 'succeeded') return { error: HIRE_FAIL };
        paymentIntentId = pi.id;
      } catch (e) { console.error('hire charge failed', getStripeErrorMessage(e)); return { error: HIRE_FAIL }; }
    }
    const award = await supabaseAdmin.rpc('award_job', { target_bid: data.bidId });
    if (award.error) { console.error('award failed after charge', award.error.message); return { error: HIRE_FAIL }; }
    await supabaseAdmin.from('hire_charges').insert({ job_id: job.data.id, bid_id: data.bidId, maker_id: bid.data.maker_id, amount_cents: amount, payment_intent_id: paymentIntentId, environment: data.environment });
    await supabaseAdmin.from('bid_cards').update({ status: 'charged' }).eq('bid_id', data.bidId);
    const others = await supabaseAdmin.from('bid_cards').select('bid_id,payment_method_id,environment').eq('job_id', job.data.id).eq('status', 'saved');
    await releaseCards(others.data ?? []);
    return { ok: true as const };
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
