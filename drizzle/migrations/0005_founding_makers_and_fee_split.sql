CREATE TABLE public.founding_makers (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  number integer NOT NULL UNIQUE CHECK (number BETWEEN 1 AND 50),
  fee_free_hires_used integer NOT NULL DEFAULT 0 CHECK (fee_free_hires_used BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.founding_makers TO authenticated;
GRANT ALL ON public.founding_makers TO service_role;
ALTER TABLE public.founding_makers ENABLE ROW LEVEL SECURITY;
CREATE POLICY founding_own_read ON public.founding_makers FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.founding_spots_left() RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT greatest(0, 50 - count(*))::int FROM public.founding_makers $$;
GRANT EXECUTE ON FUNCTION public.founding_spots_left() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.founding_numbers(ids uuid[]) RETURNS TABLE(user_id uuid, number integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.user_id, f.number FROM public.founding_makers f WHERE f.user_id = ANY(ids) $$;
GRANT EXECUTE ON FUNCTION public.founding_numbers(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_founding_spot() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('founding_makers'));
  IF EXISTS (SELECT 1 FROM public.founding_makers WHERE user_id = NEW.maker_id) THEN RETURN NEW; END IF;
  SELECT count(*) INTO n FROM public.founding_makers;
  IF n < 50 THEN INSERT INTO public.founding_makers(user_id, number) VALUES (NEW.maker_id, n + 1); END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_founding_spot() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bids_claim_founding AFTER INSERT ON public.bids FOR EACH ROW EXECUTE FUNCTION public.claim_founding_spot();

ALTER TABLE public.hire_charges
  ADD COLUMN customer_fee_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN customer_payment_intent_id text,
  ADD COLUMN fee_free boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.hire_charges.amount_cents IS 'Maker fee charged, in cents (0 when fee_free)';

CREATE OR REPLACE FUNCTION public.award_job(target_bid uuid, use_fee_free boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bids; j public.jobs;
BEGIN
  SELECT * INTO b FROM public.bids WHERE id = target_bid;
  SELECT * INTO j FROM public.jobs WHERE id = b.job_id FOR UPDATE;
  IF j.status <> 'open' THEN RAISE EXCEPTION 'Job is not open'; END IF;
  IF use_fee_free THEN
    UPDATE public.founding_makers SET fee_free_hires_used = fee_free_hires_used + 1 WHERE user_id = b.maker_id AND fee_free_hires_used < 5;
    IF NOT FOUND THEN RAISE EXCEPTION 'No fee-free hires left'; END IF;
  END IF;
  UPDATE public.jobs SET status = 'awarded', awarded_maker = b.maker_id WHERE id = j.id;
END $$;
REVOKE EXECUTE ON FUNCTION public.award_job(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_job(uuid, boolean) TO service_role;