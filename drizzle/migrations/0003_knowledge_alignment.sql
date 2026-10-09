ALTER TABLE public.jobs
  ADD COLUMN category text NOT NULL DEFAULT 'Prototypes',
  ADD COLUMN dimensions text NOT NULL DEFAULT '',
  ADD COLUMN file_status text NOT NULL DEFAULT 'Yes',
  ADD COLUMN purpose text NOT NULL DEFAULT 'Prototype',
  ADD COLUMN finish text NOT NULL DEFAULT 'As printed',
  ADD COLUMN color text NOT NULL DEFAULT 'Maker''s choice',
  ADD COLUMN delivery text NOT NULL DEFAULT 'Either',
  ADD COLUMN verified_only boolean NOT NULL DEFAULT false,
  ADD COLUMN rights_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN owner_name text NOT NULL DEFAULT '';
ALTER TABLE public.jobs ADD CONSTRAINT jobs_category_check CHECK (category = ANY (ARRAY['Prototypes','Replacement & functional parts','Miniatures & tabletop','Cosplay & props','Home & decor','3D design/modeling help']));
ALTER TABLE public.jobs ADD CONSTRAINT jobs_dimensions_check CHECK (length(dimensions) <= 200 AND length(color) <= 80);
ALTER TABLE public.jobs ADD CONSTRAINT jobs_file_status_check CHECK (file_status = ANY (ARRAY['Yes','No, I have photos or a sketch','No, I need it designed']));
ALTER TABLE public.jobs ADD CONSTRAINT jobs_purpose_check CHECK (purpose = ANY (ARRAY['Display/decorative','Functional part','Prototype','Wearable or cosplay']));
ALTER TABLE public.jobs ADD CONSTRAINT jobs_finish_check CHECK (finish = ANY (ARRAY['As printed','Supports removed and cleaned','Sanded','Primed','Painted']));
ALTER TABLE public.jobs ADD CONSTRAINT jobs_delivery_check CHECK (delivery = ANY (ARRAY['Local pickup','Maker delivers or ships','Either']));
ALTER TABLE public.jobs DROP CONSTRAINT jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK (status = ANY (ARRAY['draft','open','awarded','removed']));

ALTER TABLE public.bids
  ADD COLUMN post_processing numeric NOT NULL DEFAULT 0 CHECK (post_processing >= 0),
  ADD COLUMN design numeric NOT NULL DEFAULT 0 CHECK (design >= 0),
  ADD COLUMN itemized boolean NOT NULL DEFAULT true,
  ADD COLUMN total numeric NOT NULL DEFAULT 0,
  ADD COLUMN technology text NOT NULL DEFAULT '' CHECK (length(technology) <= 40),
  ADD COLUMN material text NOT NULL DEFAULT '' CHECK (length(material) <= 80),
  ADD COLUMN offers text NOT NULL DEFAULT 'Pickup or delivery' CHECK (offers = ANY (ARRAY['Pickup','Delivery','Pickup or delivery'])),
  ADD COLUMN links text[] NOT NULL DEFAULT '{}',
  ADD COLUMN photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN maker_name text NOT NULL DEFAULT '';
UPDATE public.bids b SET total = printing + materials + shipping, maker_name = coalesce((SELECT split_part(p.display_name,' ',1) FROM public.profiles p WHERE p.id = b.maker_id),'Maker');
ALTER TABLE public.bids DROP CONSTRAINT bids_printing_check;
ALTER TABLE public.bids ADD CONSTRAINT bids_printing_check CHECK (printing >= 0);

UPDATE public.jobs j SET owner_name = coalesce((SELECT split_part(p.display_name,' ',1) FROM public.profiles p WHERE p.id = j.owner_id),''), rights_confirmed = true;
UPDATE public.jobs j SET file_status = CASE WHEN d.needs_design THEN 'No, I need it designed' ELSE 'Yes' END FROM public.job_details d WHERE d.job_id = j.id;

ALTER TABLE public.verifications ADD COLUMN shop_name text NOT NULL DEFAULT '' CHECK (length(shop_name) <= 120), ADD COLUMN fee_paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.contact_cards ADD COLUMN pickup_details text NOT NULL DEFAULT '' CHECK (length(pickup_details) <= 1000), ADD COLUMN method text NOT NULL DEFAULT '' CHECK (method = ANY (ARRAY['','Pickup','Delivery']));

CREATE OR REPLACE FUNCTION public.prepare_job() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.owner_name := coalesce((SELECT split_part(display_name,' ',1) FROM public.profiles WHERE id = NEW.owner_id),'');
  IF NOT NEW.rights_confirmed THEN RAISE EXCEPTION 'Confirm you own or have the rights to these files'; END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.prepare_job() FROM public, anon, authenticated;
CREATE TRIGGER prepare_job BEFORE INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.prepare_job();

CREATE OR REPLACE FUNCTION public.guard_job() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF current_user IN ('postgres','supabase_admin') THEN RETURN NEW; END IF;
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.bid_count<>OLD.bid_count OR NEW.awarded_maker IS DISTINCT FROM OLD.awarded_maker OR NEW.owner_name IS DISTINCT FROM OLD.owner_name OR NOT NEW.rights_confirmed OR (OLD.bid_count>0 AND NEW IS DISTINCT FROM OLD) THEN RAISE EXCEPTION 'Job editing is locked after the first bid'; END IF;
  IF NEW.status IN ('awarded','removed') OR OLD.status='removed' THEN RAISE EXCEPTION 'This status change is not allowed'; END IF;
  IF NEW.status='open' AND OLD.status='draft' AND NOT EXISTS(SELECT 1 FROM public.job_details d WHERE d.job_id=OLD.id AND cardinality(d.technical_questions) BETWEEN 2 AND 3 AND cardinality(d.technical_answers)=cardinality(d.technical_questions) AND NOT EXISTS(SELECT 1 FROM unnest(d.technical_answers) a WHERE trim(a)='') AND (d.needs_design OR cardinality(d.files)>0)) THEN RAISE EXCEPTION 'Complete files and technical follow-up before publishing'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_bid() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE j public.jobs; required integer;
BEGIN
  SELECT * INTO j FROM public.jobs WHERE id=NEW.job_id FOR UPDATE;
  IF j.status<>'open' OR j.owner_id=NEW.maker_id OR j.bid_count>=5 THEN RAISE EXCEPTION 'This job is not accepting your bid'; END IF;
  IF j.verified_only AND NOT EXISTS(SELECT 1 FROM public.verifications v WHERE v.user_id=NEW.maker_id AND v.status='approved') THEN RAISE EXCEPTION 'Only Verified Makers can bid on this job'; END IF;
  SELECT cardinality(questions) INTO required FROM public.job_details WHERE job_id=j.id;
  IF cardinality(NEW.answers)<>coalesce(required,0) OR EXISTS(SELECT 1 FROM unnest(NEW.answers) a WHERE length(trim(a))=0 OR length(a)>500) THEN RAISE EXCEPTION 'Answer every poster question (500 characters max)'; END IF;
  IF cardinality(NEW.photos)>6 OR cardinality(NEW.links)>10 OR EXISTS(SELECT 1 FROM unnest(NEW.links) l WHERE l !~ '^https://' OR length(l)>500) THEN RAISE EXCEPTION 'Use up to 6 photos and valid https links'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(NEW.photos) p WHERE split_part(p,'/',1)<>NEW.maker_id::text) THEN RAISE EXCEPTION 'Invalid photo'; END IF;
  IF NEW.itemized THEN NEW.total := NEW.printing+NEW.materials+NEW.shipping+NEW.post_processing+NEW.design;
  ELSE NEW.printing:=0; NEW.materials:=0; NEW.shipping:=0; NEW.post_processing:=0; NEW.design:=0; END IF;
  IF NEW.total<=0 THEN RAISE EXCEPTION 'Enter a bid total'; END IF;
  NEW.maker_name := coalesce((SELECT split_part(display_name,' ',1) FROM public.profiles WHERE id=NEW.maker_id),'Maker');
  UPDATE public.jobs SET bid_count=bid_count+1 WHERE id=j.id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_details() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE j public.jobs;
BEGIN
  SELECT * INTO j FROM public.jobs WHERE id=NEW.job_id FOR UPDATE;
  IF j.bid_count>0 THEN RAISE EXCEPTION 'Job details are locked after the first bid'; END IF;
  IF TG_OP='UPDATE' AND NEW.job_id<>OLD.job_id THEN RAISE EXCEPTION 'Cannot move job details'; END IF;
  IF TG_OP='UPDATE' AND NEW.technical_questions IS DISTINCT FROM OLD.technical_questions AND cardinality(OLD.technical_questions)>0 THEN RAISE EXCEPTION 'Follow-up questions cannot be edited'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(NEW.questions) q WHERE length(q)>200) THEN RAISE EXCEPTION 'Questions are limited to 200 characters'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(NEW.files) f WHERE f !~* '\.(stl|step|stp|3mf|obj|zip|jpg|jpeg|png|webp|pdf|svg|dxf)$') THEN RAISE EXCEPTION 'Unsupported file format'; END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.guard_verification() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP='INSERT' AND (cardinality(NEW.photos) NOT BETWEEN 3 AND 10 OR NEW.fee_paid) THEN RAISE EXCEPTION 'Add 3 to 10 photos of finished prints'; END IF;
  IF TG_OP='UPDATE' AND NEW.fee_paid IS DISTINCT FROM OLD.fee_paid AND current_user NOT IN ('postgres','supabase_admin','service_role') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_verification BEFORE INSERT OR UPDATE ON public.verifications FOR EACH ROW EXECUTE FUNCTION public.guard_verification();

CREATE OR REPLACE FUNCTION public.verified_customers() RETURNS TABLE(user_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT owner_id FROM public.jobs WHERE status='awarded' GROUP BY owner_id HAVING count(*)>=2
$$;
GRANT EXECUTE ON FUNCTION public.verified_customers() TO anon, authenticated;

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  message text NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 2000),
  email text NOT NULL DEFAULT '' CHECK (length(email) <= 320),
  page text NOT NULL DEFAULT '' CHECK (length(page) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.feedback TO anon;
GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_submit ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY feedback_admin_read ON public.feedback FOR SELECT TO authenticated USING (public.is_admin());

CREATE TABLE public.job_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason = ANY (ARRAY['Weapon or firearm part','Copyright or trademark infringement','Other prohibited item'])),
  details text NOT NULL DEFAULT '' CHECK (length(details) <= 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status = ANY (ARRAY['open','dismissed','removed'])),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, reporter_id)
);
GRANT SELECT, INSERT, UPDATE ON public.job_reports TO authenticated;
GRANT ALL ON public.job_reports TO service_role;
ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_submit ON public.job_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'open');
CREATE POLICY reports_admin_read ON public.job_reports FOR SELECT TO authenticated USING (public.is_admin() OR reporter_id = auth.uid());
CREATE POLICY reports_admin_update ON public.job_reports FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.remove_job(target uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE public.jobs SET status='removed' WHERE id=target;
  UPDATE public.job_reports SET status='removed' WHERE job_id=target AND status='open';
END $$;
REVOKE EXECUTE ON FUNCTION public.remove_job(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.remove_job(uuid) TO authenticated;

DROP POLICY IF EXISTS files_read ON storage.objects;
CREATE POLICY files_read ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'print-files' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.job_details d JOIN public.jobs j ON j.id = d.job_id
      WHERE objects.name = ANY (d.files) AND (j.owner_id = auth.uid() OR j.awarded_maker = auth.uid()
        OR (j.status = 'open' AND (NOT j.verified_only OR EXISTS (SELECT 1 FROM public.verifications v WHERE v.user_id = auth.uid() AND v.status = 'approved')))))
    OR EXISTS (SELECT 1 FROM public.bids b JOIN public.jobs j ON j.id = b.job_id WHERE objects.name = ANY (b.photos) AND j.owner_id = auth.uid())
  )
);