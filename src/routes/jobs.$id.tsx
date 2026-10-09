import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobDetail, JobSpecs } from '@/components/job-detail';
import { JobImage } from '@/components/browse-jobs';
import { previewQuery } from '@/lib/jobs.functions';
import { useAuth } from '@/lib/auth';
import { firstName, meta } from '@/lib/printbids';

export const Route = createFileRoute('/jobs/$id')({
  validateSearch: (s: Record<string, unknown>): { card_session?: string | undefined } => ({ card_session: typeof s['card_session'] === 'string' && /^cs_[A-Za-z0-9_]+$/.test(s['card_session']) ? s['card_session'] : undefined }),
  loader: async ({ context, params }) => { try { return await context.queryClient.ensureQueryData(previewQuery(params.id)); } catch { return null; } },
  head: ({ loaderData }) => loaderData ? meta(loaderData.title, `${loaderData.category} print job in ${loaderData.region}. Sealed bids from local makers on PrintBids.`) : meta('Print job', 'Review a custom 3D printing request and place a sealed bid on PrintBids.'),
  component: JobPage,
});

function JobPage() {
  const { id } = Route.useParams();
  const { card_session } = Route.useSearch();
  const { user, ready } = useAuth();
  const { data: job } = useQuery({ ...previewQuery(id), initialData: Route.useLoaderData() ?? undefined });
  if (ready && user) return <JobDetail id={id} userId={user.id} cardSession={card_session} />;
  if (!job) return <main className="max-w-4xl mx-auto px-6 py-14"><h1 className="text-2xl">Job unavailable</h1><p className="text-muted-foreground mt-3">This job is private, already hired, or no longer available.</p><div className="flex gap-3 mt-6"><Button asChild><Link to="/">Browse jobs</Link></Button>{ready && <Button asChild variant="outline"><Link to="/auth" search={{ redirect: `/jobs/${id}` }}>Sign in</Link></Button>}</div></main>;
  return <main className="max-w-3xl mx-auto px-6 py-10">
    <Link to="/browse" className="text-muted-foreground text-xs flex gap-2 items-center mb-7"><ArrowLeft className="size-3" />Back to print jobs</Link>
    <div className="text-xs text-primary mb-4">{job.category} · {job.material}</div>
    <h1 className="text-3xl font-semibold leading-tight">{job.title}</h1>
    <p className="text-sm text-muted-foreground mt-3">Posted by {firstName(job.owner_name)}</p>
    <JobImage job={job} className="h-64 rounded-md mt-7" />
    <p className="text-muted-foreground text-sm leading-7 mt-6">{job.summary}</p>
    <div className="border border-border bg-card rounded-md p-6 mt-7"><JobSpecs job={job} /><div className="border-t border-border mt-6 pt-5 text-primary text-sm flex gap-2 items-center"><LockKeyhole className="size-4" />{job.bid_count} of 5 bids placed</div></div>
    <div className="border border-border rounded-md p-6 mt-6"><h2 className="font-semibold">See the full brief and files</h2><p className="text-sm text-muted-foreground mt-2">Sign in to view the files, read the customer's questions and place a sealed bid.</p><Button asChild className="mt-5"><Link to="/auth" search={{ redirect: `/jobs/${id}` }}>Sign in to bid <ArrowRight /></Link></Button></div>
  </main>;
}
