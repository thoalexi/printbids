CREATE TABLE public.bid_contacts (
  bid_id uuid PRIMARY KEY REFERENCES public.bids(id) ON DELETE CASCADE,
  maker_id uuid NOT NULL,
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 320),
  phone text NOT NULL DEFAULT '' CHECK (length(phone) <= 50),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bid_contacts TO authenticated;
GRANT ALL ON public.bid_contacts TO service_role;
ALTER TABLE public.bid_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY bid_contacts_own_read ON public.bid_contacts FOR SELECT TO authenticated USING (maker_id = auth.uid());