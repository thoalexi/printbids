import { createFileRoute } from '@tanstack/react-router';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') return Response.json({ received: true, ignored: 'invalid env' });
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          const obj = event.data.object;
          if ((event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') && obj?.metadata?.kind === 'verification_fee' && obj.payment_status !== 'unpaid' && typeof obj.metadata.userId === 'string') {
            const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
            await supabaseAdmin.from('verifications').update({ fee_paid: true }).eq('user_id', obj.metadata.userId);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
