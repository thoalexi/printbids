CREATE OR REPLACE FUNCTION public.maker_services(ids uuid[])
 RETURNS TABLE(user_id uuid, services text[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT v.user_id, v.services FROM public.verifications v WHERE v.status='approved' AND v.user_id = ANY(ids) AND cardinality(v.services)>0 $$;
REVOKE ALL ON FUNCTION public.maker_services(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.maker_services(uuid[]) TO authenticated;