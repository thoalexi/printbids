import { createFileRoute } from '@tanstack/react-router';
import { Landing } from '@/components/landing';
import { jobsQuery } from '@/lib/jobs.functions';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/')({head:()=>meta('Custom 3D printing in Atlanta','Post your 3D printing job and get up to five sealed bids from local Atlanta makers. Makers only pay when hired.'),loader:({context})=>context.queryClient.ensureQueryData(jobsQuery),component:Landing});
