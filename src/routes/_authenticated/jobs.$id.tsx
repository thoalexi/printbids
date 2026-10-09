import { createFileRoute } from '@tanstack/react-router';
import { JobDetail } from '@/components/job-detail';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/_authenticated/jobs/$id')({head:()=>meta('Print job details','Review printing specifications, place a sealed bid, or hire your maker on PrintBids.'),component:()=>{const {id}=Route.useParams();const {user}=Route.useRouteContext();return <JobDetail id={id} userId={user.id}/>;}});
