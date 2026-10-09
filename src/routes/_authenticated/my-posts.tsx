import { createFileRoute } from '@tanstack/react-router';
import { MyJobs } from '@/components/my-jobs';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/_authenticated/my-posts')({head:()=>meta('My print jobs','Manage your drafts, open printing requests, and awarded jobs.'),component:()=>{const {user}=Route.useRouteContext();return <MyJobs userId={user.id}/>;}});
