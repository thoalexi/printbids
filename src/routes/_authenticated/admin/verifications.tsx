import { createFileRoute } from '@tanstack/react-router';
import { AdminVerifications } from '@/components/verification';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/_authenticated/admin/verifications')({head:()=>meta('Review maker applications','Admin review of PrintBids maker equipment, portfolios, and verification status.'),component:AdminVerifications});
