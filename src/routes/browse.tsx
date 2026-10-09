import { createFileRoute } from '@tanstack/react-router';
import { BrowseJobs, validateBrowseSearch } from '@/components/browse-jobs';
import { jobsQuery } from '@/lib/jobs.functions';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/browse')({validateSearch:validateBrowseSearch,head:()=>meta('Browse print jobs','Filter open 3D printing jobs in Atlanta by category, location, material, delivery and deadline.','/browse'),loader:({context})=>context.queryClient.ensureQueryData(jobsQuery),component:BrowseJobs});
