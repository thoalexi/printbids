import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useSuspenseQuery, useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, ArrowUpRight, Box, Clock3, MapPin, LockKeyhole, X, ChevronDown,  BadgeCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jobsQuery, foundingSpotsQuery, type PublicJob } from '@/lib/jobs.functions';
import { allCategories, services, LEGACY_SERVICE, serviceLabel, isDesignOnly, launchAreas, materialChoices, deliveries, neededBy, timeline, firstName } from '@/lib/printbids';
import { useAuth } from '@/lib/auth';
import prints from '@/assets/prints.jpg';

type O<T> = T | undefined;
export type BrowseSearch = { q?: O<string>; category?: O<string>; location?: O<string>; material?: O<string>; file?: O<string>; service?: O<string>; delivery?: O<string>; needed?: O<string>; vcust?: O<boolean>; vmaker?: O<boolean>; sort?: O<string> };
const str = (v: unknown) => (typeof v === 'string' && v.length <= 2000 ? v : undefined);
export const validateBrowseSearch = (s: Record<string, unknown>): BrowseSearch => ({
  q: str(s['q']), category: str(s['category']), location: str(s['location']), material: str(s['material']), file: str(s['file']), service: str(s['service']),
  delivery: str(s['delivery']), needed: str(s['needed']), vcust: s['vcust'] === true || s['vcust'] === 'true' ? true : undefined,
  vmaker: s['vmaker'] === true || s['vmaker'] === 'true' ? true : undefined, sort: s['sort'] === 'deadline' ? 'deadline' : undefined,
});
type GroupKey = 'service' | 'category' | 'location' | 'material' | 'file' | 'delivery' | 'needed';
const groups: { key: GroupKey; label: string; values: string[] }[] = [
  { key: 'service', label: 'Service needed', values: [...services, LEGACY_SERVICE] },
  { key: 'category', label: 'Category', values: allCategories },
  { key: 'location', label: 'Location', values: launchAreas },
  { key: 'material', label: 'Material', values: materialChoices },
  { key: 'file', label: '3D file', values: ['Has a 3D file', 'Needs design'] },
  { key: 'delivery', label: 'Delivery', values: deliveries },
  { key: 'needed', label: 'Needed by', values: neededBy },
];
const split = (v?: string) => (v ? v.split('|').filter(Boolean) : []);
function matches(job: PublicJob, key: GroupKey, values: string[]) {
  if (!values.length) return true;
  switch (key) {
    case 'service': return values.includes(serviceLabel(job.service));
    case 'category': return values.includes(job.category);
    case 'location': return values.includes(job.region);
    case 'material': return !isDesignOnly(job) && values.includes(job.material);
    case 'file': return values.includes(job.file_status === 'Yes' ? 'Has a 3D file' : 'Needs design');
    case 'delivery': return !isDesignOnly(job) && (job.delivery === 'Either' || values.includes(job.delivery));
    case 'needed': return values.includes(timeline(job));
  }
}

export function JobImage({ job, className = '' }: { job: { image_key: number; title: string }; className?: string }) {
  return <div className={`print-crop crop-${job.image_key} ${className}`}><img src={prints} alt={job.title} loading="lazy" width={1536} height={1024} /></div>;
}

export function BrowseJobs() {
  const { data: jobs } = useSuspenseQuery(jobsQuery);
  const { user } = useAuth();
  const { data: spots } = useQuery(foundingSpotsQuery);
  const search = useSearch({ from: '/browse' });
  const navigate = useNavigate({ from: '/browse' });
  const [active, setActive] = useState<GroupKey | null>(null);
  const set = (patch: Partial<BrowseSearch>) => void navigate({ search: prev => ({ ...prev, ...patch }), replace: true, resetScroll: false });
  const toggle = (key: GroupKey, value: string, on: boolean) => { const cur = split(search[key]); const next = on ? [...cur, value] : cur.filter(v => v !== value); set({ [key]: next.length ? next.join('|') : undefined }); };
  const visible = jobs.filter(j => !user || j.owner_id !== user.id);
  const q = (search.q ?? '').toLowerCase();
  const filtered = visible
    .filter(j => `${j.title} ${j.summary} ${j.material} ${j.category}`.toLowerCase().includes(q))
    .filter(j => groups.every(g => matches(j, g.key, split(search[g.key]))))
    .filter(j => !search.vcust || j.verified_customer)
    .filter(j => !search.vmaker || j.verified_only)
    .sort((a, b) => (search.sort === 'deadline' ? a.deadline.localeCompare(b.deadline) : b.created_at.localeCompare(a.created_at)));
  const count = groups.reduce((n, g) => n + split(search[g.key]).length, 0) + (search.vcust ? 1 : 0) + (search.vmaker ? 1 : 0);
  const clear = () => { setActive(null); void navigate({ search: {}, replace: true, resetScroll: false }); };
  return <main>
    <section className="max-w-7xl mx-auto px-6 pt-9">
      <div className="flex justify-between items-start mb-6"><div><h1 className="text-3xl font-semibold">Browse print jobs</h1><p className="text-muted-foreground text-sm mt-2">A new challenge. A perfect fit for your printer.</p>{!!spots && spots > 0 && <p className="text-xs text-primary mt-2">Founding Maker spots left: {spots} of 50</p>}</div><span className="text-xs text-muted-foreground mt-2 flex items-center gap-2 shrink-0"><span className="size-1.5 rounded-full bg-success" />{visible.length} open jobs</span></div>
      <div className="flex gap-3 flex-wrap pb-5 border-b border-border">
        <div className="relative flex-1 min-w-52 [&_input]:pl-10"><Search className="size-4 absolute left-3 top-3.5 text-muted-foreground" /><input className="field pl-10 h-11 text-sm" placeholder="Search jobs, materials, or keywords…" aria-label="Search jobs" defaultValue={search.q ?? ''} onChange={e => set({ q: e.target.value || undefined })} /></div>
        {groups.map(g => { const sel = split(search[g.key]); return <div className="relative" key={g.key}><Button variant="outline" className="h-11 text-xs bg-card" aria-expanded={active === g.key} onClick={() => setActive(active === g.key ? null : g.key)}><span>{g.label}{sel.length ? ` (${sel.length})` : ''}</span><ChevronDown className="size-3" /></Button>{active === g.key && <div className="absolute left-0 top-12 z-20 w-60 bg-popover border border-border p-3 rounded-md shadow-lg"><div className="max-h-72 overflow-auto">{g.values.map(value => <label key={value} className="flex gap-3 py-2 items-center text-xs cursor-pointer font-normal"><input type="checkbox" checked={sel.includes(value)} onChange={e => toggle(g.key, value, e.target.checked)} />{value}</label>)}</div><Button variant="ghost" size="sm" onClick={() => setActive(null)}>Done</Button></div>}</div>; })}
        <Button variant={search.vcust ? 'default' : 'outline'} className={`h-11 text-xs ${search.vcust ? '' : 'bg-card'}`} aria-pressed={!!search.vcust} onClick={() => set({ vcust: search.vcust ? undefined : true })}>Verified Customers</Button>
        <Button variant={search.vmaker ? 'default' : 'outline'} className={`h-11 text-xs ${search.vmaker ? '' : 'bg-card'}`} aria-pressed={!!search.vmaker} onClick={() => set({ vmaker: search.vmaker ? undefined : true })}>Verified Makers only</Button>
        <Button variant="outline" size="icon" className="h-11 w-11" title="Clear filters" onClick={clear}><SlidersHorizontal /></Button>
      </div>
      <div className="flex justify-between items-center py-5"><div className="text-xs text-muted-foreground">Showing <span className="text-foreground">{filtered.length} jobs</span>{count > 0 && <Button variant="ghost" size="sm" onClick={clear}><X />Clear filters</Button>}</div><select aria-label="Sort jobs" className="bg-background text-muted-foreground text-xs outline-none" value={search.sort ?? 'newest'} onChange={e => set({ sort: e.target.value === 'deadline' ? 'deadline' : undefined })}><option value="newest">Newest first</option><option value="deadline">Deadline soonest</option></select></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map(job => <JobCard key={job.id} job={job} />)}</div>
      {!filtered.length && <div className="py-20 text-center text-muted-foreground">No jobs match these filters.<Button variant="link" onClick={clear}>Reset filters</Button></div>}
      <p className="text-center text-xs text-muted-foreground mt-7">Launch listings are illustrative print requests.</p>
    </section>
  </main>;
}

export function JobCard({ job }: { job: PublicJob }) {
  return <Link to="/jobs/$id" params={{ id: job.id }} className="job-card rounded-lg overflow-hidden border border-border bg-card hover:border-primary/50"><div className="relative"><JobImage job={job} className="h-48" /><span className="absolute left-3 top-3 bg-background/85 backdrop-blur px-2.5 py-1.5 rounded text-[10px] text-success flex items-center gap-1.5"><span className="size-1 rounded-full bg-success" />OPEN FOR BIDS</span><span className="absolute right-3 top-3 bg-background/85 p-2 rounded"><ArrowUpRight className="size-3.5" /></span></div><div className="p-5"><div className="flex gap-2 mb-3 flex-wrap"><span className="text-[10px] text-primary bg-primary/10 rounded px-2 py-1">{job.category}</span><span className="text-[10px] text-foreground bg-muted rounded px-2 py-1">{serviceLabel(job.service)}</span>{!isDesignOnly(job) && <span className="text-[10px] text-sky bg-sky/10 rounded px-2 py-1">{job.material}</span>}{job.verified_only && <span className="text-[10px] text-success bg-success/10 rounded px-2 py-1">Verified Makers only</span>}</div><h3 className="text-base font-semibold leading-6">{job.title}</h3><p className="text-xs text-muted-foreground leading-5 mt-2 min-h-10 line-clamp-2">{job.summary}</p><div className="grid grid-cols-2 gap-3 mt-5 text-[11px] text-muted-foreground"><span className="flex gap-2 items-center"><Box className="size-3.5" />{isDesignOnly(job) ? 'Digital file' : `${job.quantity} ${job.quantity === 1 ? 'piece' : 'pieces'}`}</span><span className="flex gap-2 items-center"><Clock3 className="size-3.5" />{timeline(job)}</span><span className="flex gap-2 items-center col-span-2"><MapPin className="size-3.5" />{isDesignOnly(job) ? job.region : `${job.delivery} · ${job.region}`}</span><span className="flex gap-2 items-center col-span-2"><User className="size-3.5" />{firstName(job.owner_name)}{job.verified_customer && <span className="text-success flex items-center gap-1"><BadgeCheck className="size-3" />Verified Customer</span>}</span></div><div className="flex justify-between items-center border-t border-border pt-4 mt-4"><span className="flex gap-2 text-[11px] text-muted-foreground items-center"><LockKeyhole className="size-3" />Sealed bidding</span><span className="text-xs"><span className="text-primary">{job.bid_count}</span><span className="text-muted-foreground"> / 5 bids placed</span></span></div></div></Link>;
}
