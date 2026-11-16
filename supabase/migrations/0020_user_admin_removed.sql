-- 0020_user_admin_removed: lets Users and access record a removed login.
--
-- APPLIED to Lexta Gh on 16 November 2026 (Desmond approved). The admin-users Edge Function was redeployed first.
--
-- What it changes: public.user_admin_audit accepts one more action, 'removed', written by the admin-users Edge
-- Function after it deletes a login. The row keeps the email (target_email) and the old id (details.user_id); its
-- target_id is blank because the profile is gone. Nothing else changes: no new table, policy, grant or function.
-- The Users and access list shows these rows under Removed logins.

alter table public.user_admin_audit drop constraint if exists user_admin_audit_action_check;
alter table public.user_admin_audit add constraint user_admin_audit_action_check check (action in (
  'invited', 'invite_resent', 'password_reset_sent', 'role_changed', 'brands_changed', 'details_changed',
  'deactivated', 'reactivated', 'distributor_linked', 'distributor_unlinked', 'removed'
));
