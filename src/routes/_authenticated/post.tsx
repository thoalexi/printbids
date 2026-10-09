import { createFileRoute } from '@tanstack/react-router';
import { PostJob } from '@/components/post-job';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/_authenticated/post')({head:()=>meta('Post a print job','Create a 3D printing brief, upload models, and invite up to five private maker bids.'),component:()=>{const {user}=Route.useRouteContext();return <PostJob userId={user.id}/>;}});
