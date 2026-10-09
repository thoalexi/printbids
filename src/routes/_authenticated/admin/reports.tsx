import { createFileRoute } from '@tanstack/react-router';
import { AdminReports } from '@/components/verification';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/_authenticated/admin/reports')({head:()=>meta('Reported jobs','Admin review of reported PrintBids job listings.'),component:AdminReports});
