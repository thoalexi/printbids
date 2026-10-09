import { createFileRoute } from '@tanstack/react-router';
import { BrowseJobs, validateBrowseSearch } from '@/components/browse-jobs';
import { jobsQuery } from '@/lib/jobs.functions';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/')({validateSearch:validateBrowseSearch,head:()=>meta('Atlanta 3D print jobs','Discover custom 3D printing requests and verified makers in Atlanta and surrounding communities.'),loader:({context})=>context.queryClient.ensureQueryData(jobsQuery),component:BrowseJobs});
