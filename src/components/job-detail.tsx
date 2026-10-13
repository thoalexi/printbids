import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, LockKeyhole, Download, BadgeCheck, Plus, Flag, Phone, MessageSquare, Mail, MapPin, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { JobImage } from './browse-jobs';
import { money, firstName, bidTechnologies, feeCents, serviceLabel, isDesignOnly, type Job } from '@/lib/printbids';
import { generateQuestions } from '@/lib/jobs.functions';
import { placeBid, startBidCard, startHire, completeHire, foundingStatus } from '@/lib/payments.functions';
import { useEffect, useRef } from 'react';
import { Award } from 'lucide-react';
import { getStripeEnvironment } from '@/lib/stripe';
import { EmbeddedPayment } from './embedded-checkout';

const errText = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : 'Something went wrong. Please try again.');
const fileLabel = (path: string) => path.split('/').pop()?.replace(/^[a-f0-9-]{36}-/, '') ?? 'File';

export const detailQuery = (id: string, userId: string) => ({
  queryKey: ['job-detail', id, userId],
  queryFn: async () => {
    const j = await supabase.from('jobs').select('*').eq('id', id).single(); if (j.error) throw j.error;
    const d = await supabase.from('job_details').select('*').eq('job_id', id).single(); if (d.error) throw d.error;
    const b = await supabase.from('bids').select('*').eq('job_id', id).order('created_at'); if (b.error) throw b.error;
    const vm = await supabase.rpc('verified_makers');
    const vc = await supabase.rpc('verified_customers');
    const mine = await supabase.from('verifications').select('*').eq('user_id', userId).maybeSingle();
    const fm = b.data.length ? await supabase.rpc('founding_numbers', { ids: b.data.map(x => x.maker_id) }) : { data: [] };
    const ms = b.data.length ? await supabase.rpc('maker_services', { ids: b.data.map(x => x.maker_id) }) : { data: [] };
    return { makerServices: new Map((ms.data ?? []).map(m => [m.user_id, m.services])), founding: new Map((fm.data ?? []).map(f => [f.user_id, f.number])), job: j.data, detail: d.data, bids: b.data, verified: new Set((vm.data ?? []).map(v => v.user_id)), verifiedCustomer: (vc.data ?? []).some(v => v.user_id === j.data.owner_id), myVerification: mine.data };
  },
});

function Spec({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>; }

export function JobSpecs({ job }: { job: Pick<Job, 'quantity' | 'deadline' | 'delivery' | 'region' | 'budget' | 'category' | 'dimensions' | 'file_status' | 'purpose' | 'finish' | 'color' | 'material' | 'technology' | 'service'> }) {
  const d = isDesignOnly(job);
  return <dl className="text-sm space-y-4 mt-5">{([['Service', serviceLabel(job.service)], ['Category', job.category], ['Quantity', `${job.quantity} ${job.quantity === 1 ? 'piece' : 'pieces'}`], ['Size', job.dimensions || 'Not given'], ['3D file', job.file_status], ["What it's for", job.purpose], ['Material', job.material], ['Technology', job.technology], ['Finish', job.finish], ['Color', job.color], ['Delivery', job.delivery], ['Location', job.region], ['Needed by', job.deadline], ['Budget', job.budget ? money(job.budget) : 'Open to bids']] as const).filter(([k]) => !d || !['Quantity', 'Material', 'Technology', 'Finish', 'Color', 'Delivery'].includes(k)).map(([k, v]) => <Spec key={k} k={k} v={v} />)}</dl>;
}

export function useFounding() {
  const fn = useServerFn(foundingStatus);
  return useQuery({ queryKey: ['founding-status'], queryFn: () => fn() });
}
export function FoundingBadge({ number }: { number: number }) {
  return <span className="text-primary text-xs flex gap-1 items-center"><Award className="size-3" />Founding Maker #{number}</span>;
}

export function JobDetail({ id, userId, cardSession, hireSession }: { id: string; userId: string; cardSession?: string | undefined; hireSession?: string | undefined }) {
  const { data, error, refetch } = useQuery(detailQuery(id, userId));
  const [hiring, setHiring] = useState<string | null>(null);
  const [hired, setHired] = useState<number | null>(null);
  const finish = useServerFn(completeHire);
  const begin = useServerFn(startHire);
  const ran = useRef(false);
  useEffect(() => {
    if (!hireSession || ran.current) return; ran.current = true;
    void (async () => { setBusy(true); try { const r = await finish({ data: { sessionId: hireSession, environment: getStripeEnvironment() } }); if ('error' in r) setNotice({ kind: 'error', text: "We couldn't complete the hire. Please try again.", where: 'hire' }); else setHired(r.customerFeeCents); await refetch(); window.scrollTo({ top: 0 }); } catch { setNotice({ kind: 'error', text: "We couldn't complete the hire. Please try again.", where: 'hire' }); } finally { setBusy(false); window.history.replaceState(null, '', `/jobs/${id}`); } })();
  }, [hireSession]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string; where: string } | null>(null);
  const generate = useServerFn(generateQuestions);
  if (error) return <main className="max-w-4xl mx-auto px-6 py-14"><h1 className="text-2xl">Job unavailable</h1><p className="text-muted-foreground mt-3">This job is private, awarded to another maker, or no longer available.</p><Button asChild className="mt-6"><Link to="/">Browse jobs</Link></Button></main>;
  if (!data) return <main className="p-16 text-center text-muted-foreground">Loading print job…</main>;
  const { job, detail, bids, verified, verifiedCustomer, myVerification, founding, makerServices } = data;
  const owner = job.owner_id === userId;
  const ownBid = bids.find(b => b.maker_id === userId);
  const iAmVerified = myVerification?.status === 'approved';
  const bidding = !owner && !ownBid && job.status === 'open' && job.bid_count < 5 && (!job.verified_only || iAmVerified);
  const canSeeFiles = owner || job.awarded_maker === userId || !job.verified_only || iAmVerified;
  const hiringBid = bids.find(b => b.id === hiring);
  const show = (where: string) => notice?.where === where && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${notice.kind === 'error' ? 'text-destructive' : 'text-primary'}`}>{notice.text}</p>;
  const run = async (where: string, fn: () => Promise<void>, ok?: string) => { setBusy(true); setNotice(null); try { await fn(); await refetch(); if (ok) setNotice({ kind: 'ok', text: ok, where }); } catch (e) { setNotice({ kind: 'error', text: errText(e), where }); } finally { setBusy(false); } };

  return <main className="max-w-6xl mx-auto px-6 py-10">
    <Link to="/browse" className="text-muted-foreground text-xs flex gap-2 items-center mb-7"><ArrowLeft className="size-3" />Back to print jobs</Link>
    {job.status === 'awarded' && (owner || job.awarded_maker === userId) && <div id="hire-next" className="mb-9">
      {hired !== null && <div role="status" className="border border-primary/50 bg-primary/10 rounded-md p-6 mb-2"><h2 className="text-xl font-semibold">You've hired your maker!</h2><p className="text-sm text-muted-foreground mt-2">Your {money(hired / 100)} service fee is confirmed. Next: add your pickup or delivery details below — your maker's contact details appear right next to them. You pay the maker for the print directly at pickup or delivery.</p></div>}
      <ContactCard job={job} userId={userId} />
    </div>}
    <div className="grid lg:grid-cols-[1fr_380px] gap-9">
      <div className={`min-w-0 ${bidding ? 'lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-3' : ''}`}>
        <div className="flex flex-wrap gap-2 mb-4 text-xs text-primary"><span>{serviceLabel(job.service)}</span>·<span>{job.category}</span>·{!isDesignOnly(job) && <><span>{job.material}</span>·</>}<span className="capitalize">{job.status === 'awarded' ? 'Hired' : job.status}</span>{job.verified_only && <span className="text-success">· Verified Makers only</span>}</div>
        <h1 className="text-3xl font-semibold leading-tight">{job.title}</h1>
        <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">Posted by {firstName(job.owner_name)}{verifiedCustomer && <span className="text-success flex items-center gap-1"><BadgeCheck className="size-3.5" />Verified Customer</span>}</p>
        <JobImage job={job} className="h-64 rounded-md mt-7" />
        <h2 className="text-lg mt-8 mb-3 font-semibold">The print brief</h2>
        <p className="text-muted-foreground leading-7 text-sm whitespace-pre-wrap">{detail.description}</p>
        <h2 className="text-lg mt-8 mb-3 font-semibold">Files</h2>
        {!detail.files.length ? <p className="text-sm text-muted-foreground">No files — this job needs design help.</p> : !canSeeFiles ? <p className="text-sm text-muted-foreground flex gap-2 items-center"><LockKeyhole className="size-4" />Files are shared with Verified Makers only. <Link to="/verify" className="text-primary">Get verified</Link></p> : <div className="flex gap-3 flex-wrap">{detail.files.map(path => <Button key={path} variant="outline" size="sm" onClick={async () => { const r = await supabase.storage.from('print-files').createSignedUrl(path, 60); if (r.error) { setNotice({ kind: 'error', text: 'That file is not available to you.', where: 'files' }); return; } window.open(r.data.signedUrl, '_blank', 'noopener,noreferrer'); }}><Download />{fileLabel(path)}</Button>)}</div>}
        {show('files')}
        {detail.technical_questions.length > 0 && job.status !== 'draft' && <div className="mt-8 border-t border-border pt-7"><h2 className="text-lg font-semibold mb-4">Technical details</h2>{detail.technical_questions.map((q, i) => <div className="mb-4" key={q}><p className="text-sm">{q}</p><p className="text-muted-foreground text-sm mt-1">{detail.technical_answers[i] ?? 'Not answered yet'}</p></div>)}</div>}

        {owner && job.status === 'draft' && <form className="space-y-5 border-t border-border pt-7 mt-7" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run('draft', async () => { const d = await supabase.from('job_details').update({ technical_answers: detail.technical_questions.map((_, i) => String(f.get(`a${i}`))) }).eq('job_id', id); if (d.error) throw d.error; const j = await supabase.from('jobs').update({ status: 'open' }).eq('id', id); if (j.error) throw j.error; }); }}>
          <h2 className="font-semibold">Finish your draft</h2>
          {!detail.technical_questions.length ? <Button type="button" disabled={busy} onClick={() => void run('draft', async () => { await generate({ data: { jobId: id } }); })}>Prepare technical follow-up</Button> : <>{detail.technical_questions.map((q, i) => <label key={q}>{q}<input className="field" name={`a${i}`} required maxLength={2000} defaultValue={detail.technical_answers[i]} /></label>)}<Button disabled={busy}>Publish job</Button></>}
          {show('draft')}
        </form>}

        {owner && job.status === 'open' && job.bid_count === 0 && <form className="mt-8 border-t border-border pt-7 space-y-4" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run('edit', async () => { const r = await supabase.from('jobs').update({ title: String(f.get('title')), quantity: Number(f.get('quantity')), deadline: String(f.get('deadline')), dimensions: String(f.get('dimensions')).slice(0, 200) }).eq('id', id); if (r.error) throw r.error; const d = await supabase.from('job_details').update({ description: String(f.get('description')), technical_answers: detail.technical_questions.map((_, i) => String(f.get(`a${i}`))) }).eq('job_id', id); if (d.error) throw d.error; }, 'Changes saved.'); }}>
          <h2 className="font-semibold">Edit your job</h2>
          <p className="text-xs text-muted-foreground">You can edit until the first bid arrives.</p>
          <label>Title<input className="field" name="title" defaultValue={job.title} minLength={3} maxLength={160} required /></label>
          <label>Description<textarea className="field" name="description" defaultValue={detail.description} required maxLength={10000} /></label>
          <label>Approximate dimensions<input className="field" name="dimensions" defaultValue={job.dimensions} maxLength={200} /></label>
          <div className="grid grid-cols-2 gap-4"><label>Quantity<input className="field" name="quantity" type="number" min={1} defaultValue={job.quantity} required /></label><label>Needed by<input className="field" name="deadline" type="date" defaultValue={job.deadline} required /></label></div>
          {detail.technical_questions.map((q, i) => <label key={q}>{q}<input className="field" name={`a${i}`} required maxLength={2000} defaultValue={detail.technical_answers[i]} /></label>)}
          <Button variant="outline" disabled={busy}>Save changes</Button>
          {show('edit')}
        </form>}

      </div>

      <aside className="min-w-0">
        <div className="border border-border bg-card rounded-md p-6"><h2 className="text-sm font-semibold">Job at a glance</h2><JobSpecs job={job} /><div className="border-t border-border mt-6 pt-5 text-primary text-sm flex gap-2 items-center"><LockKeyhole className="size-4" />{job.bid_count} of 5 bids placed</div></div>
        {owner && job.bid_count > 0 && job.status === 'open' && <p className="text-xs text-muted-foreground mt-4">Editing is locked because bidding has started.</p>}
        {!owner && !ownBid && job.status === 'open' && job.bid_count < 5 && (job.verified_only && !iAmVerified
          ? <div className="mt-6 border border-border rounded-md p-5 text-sm"><p>This job is open to Verified Makers only.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link to="/verify">Become a Verified Maker</Link></Button></div>
          : <BidForm job={job} detail={detail} jobId={id} userId={userId} cardSession={cardSession} questions={detail.questions} verification={iAmVerified ? myVerification : null} onDone={() => void refetch()} />)}
        {!owner && job.status === 'open' && <ReportJob jobId={id} userId={userId} />}
      </aside>
    </div>

    {(owner || ownBid) && <section className="border-t border-border mt-10 pt-8">
      <h2 className="text-xl font-semibold mb-5">{owner ? 'Maker bids' : 'Your sealed bid'}</h2>
      {owner && !bids.length && <p className="text-sm text-muted-foreground">No bids yet. Your job is ready for makers.</p>}
      {show('hire')}
      <Dialog open={!!hiring} onOpenChange={o => { if (!o) setHiring(null); }}><DialogContent className="max-h-[100dvh] overflow-y-auto sm:max-w-xl">{hiringBid && <HireSteps bid={hiringBid} />}{hiring && <EmbeddedPayment key={hiring} fetchClientSecret={async () => { const r = await begin({ data: { bidId: hiring, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/jobs/${id}?hire_session={CHECKOUT_SESSION_ID}` } }); if ('error' in r) { setHiring(null); setNotice({ kind: 'error', text: "We couldn't complete the hire. Please try again.", where: 'hire' }); throw new Error(r.error); } return r.clientSecret; }} />}</DialogContent></Dialog>
      <div className="grid md:grid-cols-2 gap-5 mt-3">{bids.filter(b => owner || b.maker_id === userId).map(b => <BidCard key={b.id} bid={b} owner={owner} founding={founding.get(b.maker_id) ?? null} services={makerServices.get(b.maker_id) ?? []} questions={detail.questions} verified={verified.has(b.maker_id)} canHire={owner && job.status === 'open' && !hiring} busy={busy} onHire={() => { setNotice(null); setHiring(b.id); }} />)}</div>
    </section>}
  </main>;
}

type Bid = { id: string; maker_id: string; maker_name: string; itemized: boolean; total: number; printing: number; materials: number; shipping: number; post_processing: number; design: number; lead_days: number; notes: string; answers: string[]; technology: string; material: string; offers: string; links: string[]; photos: string[] };
function BidCard({ bid: b, owner, founding, services, questions, verified, canHire, busy, onHire }: { bid: Bid; owner: boolean; founding: number | null; services: string[]; questions: string[]; verified: boolean; canHire: boolean; busy: boolean; onHire: () => void }) {
  const fee = feeCents(Number(b.total)) / 100;
  const line = (label: string, v: number) => <span key={label}>{label} {b.itemized ? money(v) : '–'}</span>;
  return <article className="bg-card border border-border rounded-md p-6 min-w-0">
    <div className="flex justify-between gap-3"><div><h3 className="font-semibold">{firstName(b.maker_name || 'Maker')}</h3><div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">{verified && <span className="text-success text-xs flex gap-1 items-center"><BadgeCheck className="size-3" />Verified Maker</span>}{founding && <FoundingBadge number={founding} />}</div>{services.length > 0 && <p className="text-xs text-muted-foreground mt-1">Offers: {services.join(', ')}</p>}</div><span className="text-xl text-primary">{money(Number(b.total))}</span></div>
    {owner && <p className="text-xs text-muted-foreground mt-3">{money(Number(b.total))} bid + {money(fee)} service fee = <span className="text-foreground">{money(Number(b.total) + fee)} total</span></p>}
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground mt-5">{line('Materials', b.materials)}{line('Print time', b.printing)}{line('Post-processing', b.post_processing)}{line('Design', b.design)}{line('Delivery', b.shipping)}</div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs mt-3"><span>{b.lead_days} day turnaround</span>{b.technology && <span>{b.technology}</span>}{b.material && <span>{b.material}</span>}<span>{b.offers}</span></div>
    {b.notes && <p className="text-sm mt-4 whitespace-pre-wrap">{b.notes}</p>}
    {questions.map((q, i) => <p key={q} className="text-xs text-muted-foreground mt-3">{q}<br /><span className="text-foreground whitespace-pre-wrap">{b.answers[i]}</span></p>)}
    {b.links.length > 0 && <div className="flex flex-col gap-1 mt-4">{b.links.map(l => <a key={l} href={l} target="_blank" rel="noreferrer noopener" className="text-primary text-xs break-all">{l}</a>)}</div>}
    {b.photos.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{b.photos.map((p, i) => <Button key={p} size="sm" variant="outline" onClick={async () => { const r = await supabase.storage.from('print-files').createSignedUrl(p, 60); if (r.data) window.open(r.data.signedUrl, '_blank', 'noopener,noreferrer'); }}>Past print {i + 1}</Button>)}</div>}
    {canHire && <Button className="mt-5" disabled={busy} onClick={onHire}>Hire</Button>}
  </article>;
}

type Verification = { materials: string[]; links: string[]; photos: string[] } | null;
const draftKey = (jobId: string) => `printbids-bid-${jobId}`;
function BidForm({ job, detail, jobId, userId, questions, verification, onDone, cardSession }: { job: Job; detail: { description: string; technical_questions: string[]; technical_answers: string[] }; jobId: string; userId: string; questions: string[]; verification: Verification; onDone: () => void; cardSession?: string | undefined }) {
  const place = useServerFn(placeBid);
  const startCard = useServerFn(startBidCard);
  const [checkout, setCheckout] = useState(false);
  const saved: Record<string, string> = (() => { try { return JSON.parse(localStorage.getItem(draftKey(jobId)) ?? '{}'); } catch { return {}; } })();
  const [itemized, setItemized] = useState(saved['mode'] !== 'total');
  const [amounts, setAmounts] = useState<Record<string, string>>(saved);
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const auto = useRef(false);
  useEffect(() => { if (cardSession && !auto.current && formRef.current) { auto.current = true; formRef.current.requestSubmit(); } }, [cardSession]);
  const sum = ['materials', 'printing', 'post_processing', 'design', 'shipping'].reduce((n, k) => n + (Number(amounts[k]) || 0), 0);
  const val = (k: string, fallback = '') => saved[k] ?? fallback;
  const bidTotal = itemized ? sum : Number(amounts['total']) || 0;
  if (placed) return <div role="status" className="mt-6 border border-primary/50 bg-primary/10 rounded-md p-6"><h2 className="text-lg font-semibold">Your bid is in!</h2><p className="text-sm text-muted-foreground mt-2">Your card is saved and nothing has been charged. We'll only charge the maker fee if the customer hires you.</p></div>;
  return <form ref={formRef} className="mt-6 space-y-4" onChange={e => { const f = new FormData(e.currentTarget); const o: Record<string, string> = { mode: itemized ? 'items' : 'total' }; f.forEach((v, k) => { if (typeof v === 'string') o[k] = v; }); setAmounts(o); localStorage.setItem(draftKey(jobId), JSON.stringify(o)); }} onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    try {
      const links = String(f.get('links') ?? '').split('\n').map(v => v.trim()).filter(Boolean);
      if (links.some(v => { try { return new URL(v).protocol !== 'https:'; } catch { return true; } })) throw new Error('Links must be full https:// addresses.');
      if (photos.length > 6) throw new Error('Add up to 6 photos.');
      const photoKey = `${draftKey(jobId)}-photos`;
      let paths: string[] = JSON.parse(localStorage.getItem(photoKey) ?? '[]');
      if (photos.length) { paths = []; for (const file of photos) { if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) throw new Error('Photos must be images under 10 MB.'); const path = `${userId}/bids/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const up = await supabase.storage.from('print-files').upload(path, file); if (up.error) throw up.error; paths.push(path); } localStorage.setItem(photoKey, JSON.stringify(paths)); }
      const environment = getStripeEnvironment();
      if (!cardSession) { setCheckout(true); return; }
      const n = (k: string) => Number(f.get(k)) || 0;
      const r = await place({ data: { jobId, sessionId: cardSession, environment, itemized, total: itemized ? 0 : n('total'), materials: itemized ? n('materials') : 0, printing: itemized ? n('printing') : 0, post_processing: itemized ? n('post_processing') : 0, design: itemized ? n('design') : 0, shipping: itemized ? n('shipping') : 0, lead_days: n('lead_days'), technology: String(f.get('technology')), material: String(f.get('material') ?? '').slice(0, 80), offers: String(f.get('offers')) as 'Pickup' | 'Delivery' | 'Pickup or delivery', links, photos: paths.length ? paths : (verification?.photos ?? []).slice(0, 6), notes: String(f.get('notes') ?? ''), answers: questions.map((_, i) => String(f.get(`q${i}`))), contact_email: String(f.get('contact_email') ?? '').trim(), contact_phone: String(f.get('contact_phone') ?? '').trim() } });
      if ('error' in r) throw new Error(r.error);
      localStorage.removeItem(draftKey(jobId)); localStorage.removeItem(photoKey);
      setPlaced(true); window.history.replaceState(null, '', `/jobs/${jobId}`); onDone();
    } catch (err) { setError(errText(err)); } finally { setBusy(false); }
  }}>
    <details className="lg:hidden border border-border rounded-md bg-card"><summary className="cursor-pointer p-4 text-sm font-semibold">Project details</summary><div className="px-4 pb-4 text-sm"><p className="font-medium">{job.title}</p><p className="text-muted-foreground whitespace-pre-wrap mt-2">{detail.description}</p><JobSpecs job={job} />{detail.technical_questions.map((q, i) => <p key={q} className="text-xs text-muted-foreground mt-3">{q}<br /><span className="text-foreground">{detail.technical_answers[i]}</span></p>)}</div></details>
    <h2 className="text-lg font-semibold">Place your sealed bid</h2>
    <p className="text-sm border-l-2 border-primary pl-3">{job.service === '3D Design' ? "You're bidding to create a digital 3D model — no printing." : job.service === 'Design + Printing' ? 'Your bid should cover both the design and the print.' : job.service === '3D Printing' ? "You're bidding to print this item." : 'Check the brief to see whether design, printing or both are needed.'}</p>
    <p className="text-xs text-muted-foreground">Only you and the customer can see your bid. Bid for free — you only pay a 5% fee (min $1) if you're hired.</p>
    <FoundingNote />
    <div className="flex gap-2"><Button type="button" size="sm" variant={itemized ? 'default' : 'outline'} onClick={() => setItemized(true)}>Itemize</Button><Button type="button" size="sm" variant={itemized ? 'outline' : 'default'} onClick={() => setItemized(false)}>Total only</Button></div>
    {itemized ? <>{([['materials', 'Material cost'], ['printing', 'Print / machine time'], ['post_processing', 'Post-processing'], ['design', 'Design / modeling'], ['shipping', 'Delivery']] as const).map(([name, label]) => <label key={name}>{label} · optional (USD)<input className="field" name={name} type="number" min={0} step="0.01" defaultValue={val(name)} /></label>)}<p className="text-sm flex justify-between border-t border-border pt-3"><span>Total</span><span className="text-primary">{money(sum)}</span></p></>
      : <label>Bid total (USD)<input className="field" name="total" type="number" min={1} step="0.01" required defaultValue={val('total')} /></label>}
    <label>Turnaround (days)<input className="field" name="lead_days" type="number" min={1} step={1} required defaultValue={val('lead_days')} /></label>
    <label>Printer technology<select className="field" name="technology" defaultValue={val('technology', 'FDM')}>{bidTechnologies.map(t => <option key={t}>{t}</option>)}</select></label>
    <label>Material you'll use<input className="field" name="material" maxLength={80} defaultValue={val('material', verification?.materials[0] ?? '')} /></label>
    <label>You offer<select className="field" name="offers" defaultValue={val('offers', 'Pickup or delivery')}><option>Pickup</option><option>Delivery</option><option>Pickup or delivery</option></select></label>
    <label>Website and shop/review links · one per line<textarea className="field" name="links" maxLength={3000} placeholder={'https://your-shop.etsy.com\nhttps://g.page/your-business'} defaultValue={val('links', verification?.links.join('\n') ?? '')} /></label>
    <label>Photos of past prints · up to 6<input className="field" type="file" multiple accept="image/*" onChange={e => setPhotos(Array.from(e.target.files ?? []).slice(0, 6))} /></label>
    {!photos.length && verification?.photos.length ? <p className="text-xs text-muted-foreground -mt-2">Your verified portfolio photos will be included.</p> : null}
    {questions.map((q, i) => <label key={q}>{q}<textarea className="field" name={`q${i}`} required maxLength={500} defaultValue={val(`q${i}`)} /></label>)}
    <label>Notes for the customer · optional<textarea className="field" name="notes" maxLength={3000} defaultValue={val('notes')} /></label>
    <label>Business email for the customer<input className="field" name="contact_email" type="email" required maxLength={320} defaultValue={val('contact_email')} /></label>
    <label>Phone · optional<input className="field" name="contact_phone" type="tel" maxLength={50} defaultValue={val('contact_phone')} /></label>
    <p className="text-xs text-muted-foreground -mt-2">Visible to the customer only after they hire you and the hire is confirmed.</p>
    <div className="border border-border rounded-md p-4 text-xs text-muted-foreground space-y-1.5"><p className="text-foreground text-sm font-medium">About the fee</p><p>No charge now — you'll save a card with our payment partner.</p><p>If you're hired, we charge 5% of your bid (min $1){bidTotal > 0 ? <> — <span className="text-foreground">{money(feeCents(bidTotal) / 100)}</span> on this bid</> : null}. Founding Makers pay nothing on their first 5 hires.</p><p>If that charge fails, the hire doesn't go through. If you aren't hired, your card is released.</p></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {cardSession && busy && <p role="status" className="text-xs text-primary">Card saved — placing your bid…</p>}
    {checkout && !cardSession ? <div className="space-y-3"><p className="text-sm">Enter your card to finish. Your bid is placed automatically once the card is saved.</p><EmbeddedPayment fetchClientSecret={async () => { const r = await startCard({ data: { jobId, environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/jobs/${jobId}?card_session={CHECKOUT_SESSION_ID}` } }); if ('error' in r) throw new Error(r.error); return r.clientSecret; }} /></div>
      : <Button className="w-full" disabled={busy}>{busy ? 'Placing bid…' : cardSession ? 'Place my bid' : 'Save card & place bid'}<Plus /></Button>}
    {cardSession && error && <button type="button" className="text-xs text-primary underline" onClick={() => { window.location.href = `/jobs/${jobId}`; }}>Use a different card</button>}
  </form>;
}

function ReportJob({ jobId, userId }: { jobId: string; userId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  return <><Button variant="ghost" size="sm" className="mt-5 text-muted-foreground" onClick={() => setOpen(true)}><Flag />Report this job</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Report this job</DialogTitle><DialogDescription>Tell us if this listing breaks the PrintBids rules.</DialogDescription></DialogHeader>
      {state === 'sent' ? <p className="text-sm text-primary" role="status">Thanks — an admin will review this job.</p> : <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setState('busy'); const f = new FormData(e.currentTarget); const r = await supabase.from('job_reports').insert({ job_id: jobId, reporter_id: userId, reason: String(f.get('reason')), details: String(f.get('details') ?? '') }); setState(r.error && r.error.code !== '23505' ? 'error' : 'sent'); }}>
        <label>Reason<select className="field" name="reason"><option>Weapon or firearm part</option><option>Copyright or trademark infringement</option><option>Other prohibited item</option></select></label>
        <label>Details · optional<textarea className="field" name="details" maxLength={1000} /></label>
        {state === 'error' && <p role="alert" className="text-sm text-destructive">We couldn't send your report. Please try again.</p>}
        <Button className="w-full" disabled={state === 'busy'}>Send report</Button>
      </form>}
    </DialogContent></Dialog></>;
}

function ContactCard({ job, userId }: { job: Job; userId: string }) {
  const side = job.owner_id === userId ? 'client' : 'maker';
  const { data: cards, refetch } = useQuery({ queryKey: ['contacts', job.id], queryFn: async () => { const r = await supabase.from('contact_cards').select('*').eq('job_id', job.id); if (r.error) throw r.error; return r.data; } });
  const own = cards?.find(c => c.side === side);
  const other = cards?.find(c => c.side !== side);
  const client = cards?.find(c => c.side === 'client');
  const methods = job.delivery === 'Local pickup' ? ['Pickup'] : job.delivery === 'Maker delivers or ships' ? ['Delivery'] : ['Pickup', 'Delivery'];
  const [picked, setMethod] = useState<string | null>(null);
  const method = picked ?? (own?.method || methods[0] || 'Pickup');
  const [status, setStatus] = useState('');
  const mapsTarget = other?.side === 'client' ? other.address : other?.pickup_details;
  return <section className="border-t border-border mt-8 pt-7">
    <h2 className="text-xl font-semibold">Your contact card</h2>
    <p className="text-sm text-muted-foreground mt-2 mb-6">Shared only between the customer and the hired maker.</p>
    <form key={own?.user_id ?? 'new'} className="space-y-4" onSubmit={async e => { e.preventDefault(); setStatus(''); const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? ''); const row = side === 'client' ? { method, address: method === 'Delivery' ? g('address') : '', notes: g('notes') } : { phone: g('phone'), email: g('email'), pickup_details: g('pickup_details'), tracking: g('tracking'), notes: g('notes') }; const r = await supabase.from('contact_cards').upsert({ job_id: job.id, user_id: userId, side, ...row }, { onConflict: 'job_id,side' }); if (r.error) { setStatus("We couldn't save your details. Please try again."); return; } setStatus('Saved.'); await refetch(); }}>
      {side === 'client' ? <>
        {methods.length > 1 ? <label>Pickup or delivery?<select className="field" value={method} onChange={e => setMethod(e.target.value)}>{methods.map(m => <option key={m}>{m}</option>)}</select></label> : <p className="text-sm">{methods[0] === 'Pickup' ? 'You will pick up your print.' : 'Your maker will deliver or ship your print.'}</p>}
        {method === 'Delivery' && <label>Delivery address<textarea className="field" name="address" defaultValue={own?.address} required maxLength={1000} /></label>}
        <label>{method === 'Delivery' ? 'Delivery notes' : 'Pickup notes'} · optional<textarea className="field" name="notes" defaultValue={own?.notes} maxLength={2000} /></label>
      </> : <>
        <label>Phone<input className="field" name="phone" type="tel" defaultValue={own?.phone} required maxLength={50} /></label>
        <label>Email<input className="field" name="email" type="email" defaultValue={own?.email} required maxLength={320} /></label>
        {(client?.method ?? 'Pickup') !== 'Delivery' && <label>Pickup location and hours<textarea className="field" name="pickup_details" defaultValue={own?.pickup_details} maxLength={1000} placeholder="e.g. 123 Main St, Decatur · weekdays 5–8pm" /></label>}
        <label>Tracking number · if shipped<input className="field" name="tracking" defaultValue={own?.tracking} maxLength={200} /></label>
        <label>Notes · optional<textarea className="field" name="notes" defaultValue={own?.notes} maxLength={2000} /></label>
      </>}
      <Button>Save my details</Button>
      {status && <p role="status" className="text-sm text-primary">{status}</p>}
    </form>
    <div className="bg-muted rounded-md p-5 mt-6">
      <h3 className="font-semibold text-sm">{side === 'client' ? 'Your maker' : 'Your customer'}</h3>
      {other ? <>
        <div className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap space-y-2">{other.method && <p>{other.method}</p>}{[other.address, other.pickup_details, other.phone, other.email, other.tracking && `Tracking: ${other.tracking}`, other.notes].filter(Boolean).map((v, i) => <p key={i}>{v}</p>)}</div>
        <div className="flex flex-wrap gap-2 mt-4">
          {other.phone && <><Button asChild size="sm" variant="outline"><a href={`tel:${other.phone}`}><Phone />Call</a></Button><Button asChild size="sm" variant="outline"><a href={`sms:${other.phone}`}><MessageSquare />Text</a></Button></>}
          {other.email && <Button asChild size="sm" variant="outline"><a href={`mailto:${other.email}`}><Mail />Email</a></Button>}
          {mapsTarget && <Button asChild size="sm" variant="outline"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsTarget)}`} target="_blank" rel="noreferrer noopener"><MapPin />Open in Maps</a></Button>}
          {other.tracking && <Button asChild size="sm" variant="outline"><a href={`https://www.google.com/search?q=${encodeURIComponent(`track package ${other.tracking}`)}`} target="_blank" rel="noreferrer noopener"><Package />Track package</a></Button>}
        </div>
      </> : <p className="text-sm text-muted-foreground mt-3">They haven't shared their details yet.</p>}
    </div>
  </section>;
}

function FoundingNote() {
  const { data } = useFounding();
  if (!data) return null;
  if (data.number) return <p className="text-xs text-primary">Founding Maker #{data.number} · {data.feeFreeLeft} of 5 fee-free hires left</p>;
  if (data.spotsLeft > 0) return <p className="text-xs text-primary">Founding Maker spots left: {data.spotsLeft} of 50</p>;
  return null;
}

function HireSteps({ bid }: { bid: Bid }) {
  const total = Number(bid.total); const fee = feeCents(total) / 100;
  return <><DialogHeader><DialogTitle>Hire {firstName(bid.maker_name || 'Maker')}</DialogTitle><DialogDescription>Review, then pay your service fee to confirm.</DialogDescription></DialogHeader>
    <ol className="space-y-4 text-sm">
      <li><p className="text-xs text-primary">1 · Your maker</p><p className="mt-1">{firstName(bid.maker_name || 'Maker')} · {bid.lead_days} day turnaround · {bid.offers}</p></li>
      <li><p className="text-xs text-primary">2 · What you pay</p><dl className="mt-2 space-y-1.5"><div className="flex justify-between gap-4"><dt>Due today to PrintBids (5% service fee)</dt><dd className="font-semibold">{money(fee)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Paid directly to your maker at pickup or delivery</dt><dd>{money(total)}</dd></div><div className="flex justify-between gap-4 border-t border-border pt-1.5"><dt>Total project cost</dt><dd>{money(total + fee)}</dd></div></dl><p className="text-xs text-muted-foreground mt-2">PrintBids only charges the service fee. You pay your maker for the print directly when you pick it up or it's delivered.</p></li>
      <li><p className="text-xs text-primary">3 · Pay your service fee</p><p className="text-xs text-muted-foreground mt-1">Once it's confirmed, you'll see your maker's contact details right away.</p></li>
    </ol></>;
}
