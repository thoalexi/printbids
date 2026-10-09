import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, Printer, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { printMaterials, launchAreas } from '@/lib/printbids';
import { useAuth } from '@/lib/auth';

export function AdminNav() {
  const cls = 'px-3 py-2 rounded-md text-sm text-muted-foreground';
  return <nav className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
    <Link to="/admin/verifications" className={cls} activeProps={{ className: 'bg-muted text-foreground' }}>Verifications</Link>
    <Link to="/admin/feedback" className={cls} activeProps={{ className: 'bg-muted text-foreground' }}>Feedback</Link>
    <Link to="/admin/reports" className={cls} activeProps={{ className: 'bg-muted text-foreground' }}>Reported jobs</Link>
  </nav>;
}

export function Verification() {
  const { user, ready } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const { data: application, refetch } = useQuery({ queryKey: ['verification', user?.id], enabled: !!user, queryFn: async () => { const r = await supabase.from('verifications').select('*').eq('user_id', user?.id ?? '').maybeSingle(); if (r.error) throw r.error; return r.data; } });
  return <main className="max-w-3xl mx-auto px-6 py-12">
    <BadgeCheck className="size-10 text-primary mb-5" />
    <h1 className="text-3xl font-semibold">Become a Verified Maker</h1>
    <p className="text-sm text-muted-foreground mt-4 mb-7 leading-7">For makers serving Atlanta and the surrounding communities.<br />Show customers they're in good hands. The application fee is $5.</p>
    <div className="flex flex-wrap gap-6 text-xs text-muted-foreground mb-10"><span className="flex items-center gap-2"><Printer className="size-4 text-primary" />Printer review</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" />Portfolio check</span><span className="flex items-center gap-2"><BadgeCheck className="size-4 text-primary" />Badge on your bids</span></div>
    {!ready ? <p>Loading…</p> : !user ? <Button asChild><Link to="/auth" search={{ redirect: '/verify' }}>Sign in to apply <ArrowRight /></Link></Button> : application ? <div className="border border-border bg-card rounded-md p-6"><h2 className="font-semibold capitalize text-primary">Application {application.status}</h2><p className="mt-3 text-sm text-muted-foreground">{application.status === 'pending' ? 'Your application is awaiting admin review.' : application.status === 'approved' ? 'You’re a Verified Maker. Your badge now appears on your bids.' : application.review_notes || 'Your application was not approved.'}</p>{application.shop_name && <p className="mt-5 text-sm font-medium">{application.shop_name}</p>}<p className="mt-2 text-sm whitespace-pre-wrap">{application.printer_specs}</p></div> :
      <form className="space-y-6" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setError('');
        const f = new FormData(e.currentTarget);
        try {
          const links = String(f.get('links')).split('\n').map(v => v.trim()).filter(Boolean);
          if (links.some(v => { try { return new URL(v).protocol !== 'https:'; } catch { return true; } })) throw new Error('Links must be full https:// addresses.');
          if (files.length < 3 || files.length > 10) throw new Error('Add 3 to 10 photos of finished prints.');
          const supported = f.getAll('materials').map(String);
          if (!supported.length) throw new Error('Select at least one material you offer.');
          const paths: string[] = [];
          for (const file of files) { if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) throw new Error('Photos must be images under 10 MB.'); const path = `${user.id}/portfolio/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; const r = await supabase.storage.from('print-files').upload(path, file); if (r.error) throw r.error; paths.push(path); }
          const r = await supabase.from('verifications').insert({ user_id: user.id, shop_name: String(f.get('shop') ?? '').trim().slice(0, 120), printer_specs: String(f.get('specs')), materials: supported, photos: paths, links, service_area: String(f.get('area')) });
          if (r.error) throw r.error;
          await supabase.from('profiles').update({ printer_specs: String(f.get('specs')), materials: supported, links }).eq('id', user.id);
          await refetch();
        } catch (err) { setError(err instanceof Error ? err.message : 'Unable to send application'); } finally { setBusy(false); }
      }}>
        <label>Business or shop name · optional<input className="field" name="shop" maxLength={120} /></label>
        <label>Atlanta-area service location<select name="area" className="field">{launchAreas.map(area => <option key={area}>{area}</option>)}</select></label>
        <label>Printers and technologies you own<textarea className="field min-h-32" name="specs" required minLength={20} maxLength={5000} placeholder="e.g. 2× Bambu X1C (FDM), 1× Elegoo Saturn (resin), build volumes, quality checks" /></label>
        <div><label className="mb-3">Materials you offer</label><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{printMaterials.map(m => <label key={m} className="flex gap-2 items-center font-normal"><input type="checkbox" name="materials" value={m} />{m}</label>)}</div></div>
        <label>Photos of finished prints · 3 to 10<input className="field" type="file" multiple accept="image/*" required onChange={e => setFiles(Array.from(e.target.files ?? []))} /></label>
        {files.length > 0 && <p className="text-xs text-muted-foreground -mt-4">{files.length} photo{files.length === 1 ? '' : 's'} selected</p>}
        <label>Shop and review links · one per line<textarea className="field min-h-28" name="links" maxLength={3000} placeholder={'https://your-store.etsy.com\nhttps://g.page/your-business'} /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button className="h-11" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}<ArrowRight /></Button>
      </form>}
  </main>;
}

export function AdminVerifications() {
  const [notice, setNotice] = useState('');
  const { data, error, refetch } = useQuery({ queryKey: ['admin-verifications'], queryFn: async () => { const a = await supabase.rpc('is_admin'); if (!a.data) throw new Error('Admin access required'); const r = await supabase.from('verifications').select('*').order('created_at', { ascending: false }); if (r.error) throw r.error; return r.data; } });
  return <main className="max-w-5xl mx-auto px-6 py-12"><h1 className="text-3xl mb-5 font-semibold">Admin</h1><AdminNav />
    {notice && <p role="status" className="text-sm text-primary mb-4">{notice}</p>}
    {error ? <p role="alert" className="text-muted-foreground">Admin access is required.</p> : !data ? <p>Loading…</p> : data.length === 0 ? <p className="text-muted-foreground">No maker applications to review.</p> : <div className="space-y-5">{data.map(a => <article key={a.id} className="border border-border bg-card rounded-md p-6"><div className="flex justify-between gap-3"><h2 className="font-semibold">{a.shop_name || 'Maker application'}</h2><span className="text-xs text-primary capitalize">{a.status}</span></div><p className="text-xs text-muted-foreground mt-1">{a.service_area} · {a.fee_paid ? 'Fee paid' : 'Fee not paid'}</p><p className="whitespace-pre-wrap text-sm mt-4">{a.printer_specs}</p><p className="text-muted-foreground text-xs mt-3">{a.materials.join(' · ')}</p><div className="flex flex-col gap-1 mt-4">{a.links.map(l => <a key={l} href={l} target="_blank" rel="noreferrer noopener" className="text-primary text-xs break-all">{l}</a>)}</div><div className="flex flex-wrap gap-3 mt-4">{a.photos.map((path, i) => <Button key={path} size="sm" variant="outline" onClick={async () => { const r = await supabase.storage.from('print-files').createSignedUrl(path, 60); if (r.data) window.open(r.data.signedUrl, '_blank', 'noopener,noreferrer'); }}>Photo {i + 1}</Button>)}</div>{a.status === 'pending' && <form className="mt-5 space-y-4" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null; const r = await supabase.from('verifications').update({ status: submitter?.value === 'approved' ? 'approved' : 'rejected', review_notes: String(f.get('notes')) }).eq('id', a.id); setNotice(r.error ? r.error.message : 'Review saved.'); await refetch(); }}><label>Review notes<textarea className="field" name="notes" maxLength={2000} /></label><div className="flex flex-wrap gap-3"><Button name="decision" value="approved"><BadgeCheck />Approve maker</Button><Button variant="outline" name="decision" value="rejected">Reject</Button></div></form>}</article>)}</div>}
  </main>;
}

export function AdminFeedback() {
  const { data, error } = useQuery({ queryKey: ['admin-feedback'], queryFn: async () => { const a = await supabase.rpc('is_admin'); if (!a.data) throw new Error('Admin access required'); const r = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(500); if (r.error) throw r.error; return r.data; } });
  return <main className="max-w-5xl mx-auto px-6 py-12"><h1 className="text-3xl mb-5 font-semibold">Admin</h1><AdminNav />
    {error ? <p role="alert" className="text-muted-foreground">Admin access is required.</p> : !data ? <p>Loading…</p> : !data.length ? <p className="text-muted-foreground">No feedback yet.</p> : <div className="space-y-4">{data.map(f => <article key={f.id} className="border border-border bg-card rounded-md p-5"><p className="text-sm whitespace-pre-wrap break-words">{f.message}</p><p className="text-xs text-muted-foreground mt-3 break-all">{new Date(f.created_at).toLocaleString()} · {f.email || 'No email'} · {f.page}</p></article>)}</div>}
  </main>;
}

export function AdminReports() {
  const [notice, setNotice] = useState('');
  const { data, error, refetch } = useQuery({ queryKey: ['admin-reports'], queryFn: async () => { const a = await supabase.rpc('is_admin'); if (!a.data) throw new Error('Admin access required'); const r = await supabase.from('job_reports').select('*, jobs(title,status)').order('created_at', { ascending: false }); if (r.error) throw r.error; return r.data; } });
  return <main className="max-w-5xl mx-auto px-6 py-12"><h1 className="text-3xl mb-5 font-semibold">Admin</h1><AdminNav />
    {notice && <p role="status" className="text-sm text-primary mb-4">{notice}</p>}
    {error ? <p role="alert" className="text-muted-foreground">Admin access is required.</p> : !data ? <p>Loading…</p> : !data.length ? <p className="text-muted-foreground">No reported jobs.</p> : <div className="space-y-4">{data.map(r => <article key={r.id} className="border border-border bg-card rounded-md p-5"><div className="flex justify-between gap-3"><Link to="/jobs/$id" params={{ id: r.job_id }} className="font-semibold text-primary">{r.jobs?.title ?? 'Job'}</Link><span className="text-xs capitalize text-muted-foreground">{r.status}</span></div><p className="text-sm mt-2">{r.reason}</p>{r.details && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{r.details}</p>}{r.status === 'open' && <div className="flex flex-wrap gap-3 mt-4"><Button size="sm" variant="destructive" onClick={async () => { const x = await supabase.rpc('remove_job', { target: r.job_id }); setNotice(x.error ? x.error.message : 'Job removed.'); await refetch(); }}>Remove job</Button><Button size="sm" variant="outline" onClick={async () => { const x = await supabase.from('job_reports').update({ status: 'dismissed' }).eq('id', r.id); setNotice(x.error ? x.error.message : 'Report dismissed.'); await refetch(); }}>Dismiss</Button></div>}</article>)}</div>}
  </main>;
}
