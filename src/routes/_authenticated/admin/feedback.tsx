import { createFileRoute } from '@tanstack/react-router';
import { AdminFeedback } from '@/components/verification';
import { meta } from '@/lib/printbids';
export const Route=createFileRoute('/_authenticated/admin/feedback')({head:()=>meta('Feedback queue','Admin review of feedback sent to PrintBids.'),component:AdminFeedback});
