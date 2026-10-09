import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

// Daily: releases saved maker cards on jobs whose "needed by" date has passed.
export const Route = createFileRoute('/api/public/cron/release-cards')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { releaseCards } = await import('@/lib/stripe.server');
        const today = new Date().toISOString().slice(0, 10);
        const jobs = await supabaseAdmin.from('jobs').select('id').lt('deadline', today);
        const ids = (jobs.data ?? []).map(j => j.id);
        if (!ids.length) return Response.json({ released: 0 });
        const cards = await supabaseAdmin.from('bid_cards').select('bid_id,payment_method_id,environment').eq('status', 'saved').in('job_id', ids);
        await releaseCards(cards.data ?? []);
        return Response.json({ released: cards.data?.length ?? 0 });
      },
    },
  },
});
