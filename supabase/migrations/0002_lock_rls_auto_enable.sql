-- 0002: Supabase's rls_auto_enable() event trigger function was callable over the API by anon and
-- authenticated (security advisor warning). It only needs to run as an event trigger.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
