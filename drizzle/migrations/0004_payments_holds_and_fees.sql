CREATE TABLE public.bid_cards (
  bid_id uuid PRIMARY KEY REFERENCES public.bids(id) ON DELETE CASCADE,
  maker_id uuid NOT NULL,
  job_id uuid NOT NULL,
  environment text NOT NULL CHECK (environment IN ('sandbox','live')),
  customer_id text NOT NULL,
  payment_method_id text NOT NULL,
  status text NOT NULL DEFAULT 'saved' CHECK (status IN ('saved','released','charged')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bid_cards TO service_role;
ALTER TABLE public.bid_cards ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.hire_charges (
  job_id uuid PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
  bid_id uuid NOT NULL,
  maker_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  payment_intent_id text,
  environment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.hire_charges TO service_role;
ALTER TABLE public.hire_charges ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.award_job(target_bid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE b public.bids; j public.jobs;
BEGIN
  SELECT * INTO b FROM public.bids WHERE id = target_bid;
  SELECT * INTO j FROM public.jobs WHERE id = b.job_id FOR UPDATE;
  IF j.status <> 'open' THEN RAISE EXCEPTION 'Job is not open'; END IF;
  UPDATE public.jobs SET status = 'awarded', awarded_maker = b.maker_id WHERE id = j.id;
END $$;
REVOKE EXECUTE ON FUNCTION public.award_job(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_job(uuid) TO service_role;

COMMENT ON FUNCTION public.hire_bid(uuid) IS 'DEPRECATED: hiring now runs through the fee-charging server function and award_job';
REVOKE EXECUTE ON FUNCTION public.hire_bid(uuid) FROM public, anon, authenticated;

REVOKE INSERT ON public.bids FROM authenticated;
GRANT SELECT, INSERT ON public.bids TO service_role;