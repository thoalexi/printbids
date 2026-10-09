import { createFileRoute } from '@tanstack/react-router';
import { MyJobs } from '@/components/my-jobs';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/_authenticated/my-bids')({head:()=>meta('My sealed bids','Track your private maker bids and awarded PrintBids jobs.'),component:()=>{const {user}=Route.useRouteContext();return <MyJobs userId={user.id} bids/>;}});
