import { createFileRoute } from '@tanstack/react-router';
import { Verification } from '@/components/verification';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/verify')({head:()=>meta('Verified Maker application','Apply for maker verification with printer farm specs, supported materials, and your print portfolio.'),validateSearch:(s:Record<string,unknown>):{session_id?:string|undefined}=>({session_id:typeof s['session_id']==='string'&&/^cs_[A-Za-z0-9_]+$/.test(s['session_id'])?s['session_id']:undefined}),component:()=>{const {session_id}=Route.useSearch();return <Verification sessionId={session_id}/>;}});
