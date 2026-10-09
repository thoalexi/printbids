import { createFileRoute } from '@tanstack/react-router';
import { BrowseJobs } from '@/components/browse-jobs';
import { jobsQuery } from '@/lib/jobs.functions';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/')({head:()=>meta('Browse 3D print jobs','Discover custom 3D printing requests, compare sealed bids, and work with verified makers.'),loader:({context})=>context.queryClient.ensureQueryData(jobsQuery),component:BrowseJobs});
