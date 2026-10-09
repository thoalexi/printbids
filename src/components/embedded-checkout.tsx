import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';

export function EmbeddedPayment({ fetchClientSecret }: { fetchClientSecret: () => Promise<string> }) {
  return <div className="rounded-md overflow-hidden border border-border bg-card"><EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider></div>;
}

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
export function PaymentTestModeBanner() {
  if (!clientToken) return <div className="w-full bg-destructive/15 border-b border-destructive/40 px-4 py-2 text-center text-xs text-destructive">Live payments aren't set up yet.</div>;
  if (clientToken.startsWith('pk_test_')) return <div className="w-full bg-primary/10 border-b border-primary/30 px-4 py-2 text-center text-xs text-primary">Payments in the preview are in test mode. <a href="https://docs.lovable.dev/features/payments#test-and-live-environments" target="_blank" rel="noopener noreferrer" className="underline">Read more</a></div>;
  return null;
}
