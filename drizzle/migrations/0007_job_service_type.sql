ALTER TABLE public.jobs ADD COLUMN service text CHECK (service IN ('3D Printing','3D Design','Design + Printing'));
UPDATE public.jobs SET service = '3D Printing' WHERE file_status = 'Yes';
ALTER TABLE public.verifications ADD COLUMN services text[] NOT NULL DEFAULT '{}' CHECK (services <@ ARRAY['3D Printing','3D Design']::text[]);
CREATE OR REPLACE FUNCTION public.guard_job()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres','supabase_admin') THEN RETURN NEW; END IF;
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.bid_count<>OLD.bid_count OR NEW.awarded_maker IS DISTINCT FROM OLD.awarded_maker OR NEW.owner_name IS DISTINCT FROM OLD.owner_name OR NOT NEW.rights_confirmed OR (OLD.bid_count>0 AND NEW IS DISTINCT FROM OLD) THEN RAISE EXCEPTION 'Job editing is locked after the first bid'; END IF;
  IF NEW.status IN ('awarded','removed') OR OLD.status='removed' THEN RAISE EXCEPTION 'This status change is not allowed'; END IF;
  IF NEW.status='open' AND OLD.status='draft' AND NOT EXISTS(SELECT 1 FROM public.job_details d WHERE d.job_id=OLD.id AND cardinality(d.technical_questions) BETWEEN 2 AND 3 AND cardinality(d.technical_answers)=cardinality(d.technical_questions) AND NOT EXISTS(SELECT 1 FROM unnest(d.technical_answers) a WHERE trim(a)='')) THEN RAISE EXCEPTION 'Complete the follow-up questions before publishing'; END IF;
  RETURN NEW;
END $function$;