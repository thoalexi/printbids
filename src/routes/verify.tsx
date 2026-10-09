import { createFileRoute } from '@tanstack/react-router';
import { Verification } from '@/components/verification';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/verify')({head:()=>meta('Verified Maker application','Apply for maker verification with printer farm specs, supported materials, and your print portfolio.'),component:Verification});
