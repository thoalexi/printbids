import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, Upload, LockKeyhole, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jobsQuery } from '@/lib/jobs.functions';
import { useAuth } from '@/lib/auth';
import { JobCard } from './browse-jobs';
import hero from '@/assets/hero-print.jpg';

const steps = [
  { icon: Upload, title: 'Post your files', text: 'Share a model, sketch or photo — or ask for design help.' },
  { icon: LockKeyhole, title: 'Get up to 5 sealed bids', text: 'Local makers quote privately. Only you see every bid.' },
  { icon: Handshake, title: 'Pick your maker', text: 'Compare prices and turnaround, then hire in one click.' },
];

export function Landing() {
  const { data: jobs } = useSuspenseQuery(jobsQuery);
  const { user } = useAuth();
  const recent = jobs.filter(j => !user || j.owner_id !== user.id).slice(0, 6);
  return <main>
    <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-14 items-center">
      <div className="min-w-0">
        <p className="text-primary text-xs font-semibold uppercase tracking-[0.18em] mb-6">Atlanta’s 3D printing marketplace</p>
        <h1 className="text-5xl sm:text-6xl leading-[1.05] font-medium tracking-tight">Great ideas.<br />The right <span className="font-display italic text-primary">maker.</span></h1>
        <p className="text-muted-foreground text-base leading-7 max-w-md mt-7">From one-off prototypes to your next production run, made by makers in Atlanta and surrounding areas.</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-10">
          <Button asChild size="lg" className="h-12 px-6"><Link to="/post">Post a print job <ArrowRight /></Link></Button>
          <Link to="/browse" className="text-sm text-foreground/80 hover:text-primary inline-flex items-center gap-2">I’m a maker — browse jobs <ArrowRight className="size-4" /></Link>
        </div>
        <p className="text-xs text-muted-foreground mt-8">Sealed bids · Local Atlanta makers · Makers only pay when hired.</p>
      </div>
      <div className="min-w-0 overflow-hidden rounded-xl border border-border/60">
        <img src={hero} alt="A dark 3D-printed vase beside a small lime-green printed shape" width={1280} height={1024} className="w-full h-72 sm:h-96 lg:h-[30rem] object-cover" />
      </div>
    </section>

    <section className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="grid sm:grid-cols-3 gap-10 mt-10">
          {steps.map((s, i) => <li key={s.title} className="min-w-0">
            <div className="flex items-center gap-3"><span className="size-10 shrink-0 grid place-items-center rounded-full border border-border text-primary"><s.icon className="size-4" /></span><span className="text-xs text-muted-foreground">Step {i + 1}</span></div>
            <h3 className="font-medium mt-5">{s.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-6">{s.text}</p>
          </li>)}
        </ol>
      </div>
    </section>

    <section className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4 mb-8"><div className="min-w-0"><h2 className="text-2xl font-semibold">Recent print jobs</h2><p className="text-sm text-muted-foreground mt-2">Open now for sealed bids.</p></div><Link to="/browse" className="text-sm text-primary inline-flex items-center gap-2 shrink-0">Browse all jobs <ArrowRight className="size-4" /></Link></div>
        {recent.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{recent.map(job => <JobCard key={job.id} job={job} />)}</div> : <p className="text-sm text-muted-foreground">No open jobs right now.</p>}
      </div>
    </section>
  </main>;
}
