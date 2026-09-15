-- Creates a profile row for each new Supabase Auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'staff');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Returns true if the current auth user has role = 'admin'
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Writes a row to audit_logs on every INSERT/UPDATE/DELETE
create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  action_name text;
begin
  action_name := TG_OP || '_' || TG_TABLE_NAME;
  insert into public.audit_logs (actor_id, action, target_table, target_id, details)
  values (
    auth.uid(),
    action_name,
    TG_TABLE_NAME,
    coalesce(new.id, old.id)::text,
    case when TG_OP = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

-- Bumps updated_at on every UPDATE
create or replace function public.bump_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Audit triggers
drop trigger if exists audit_products on public.products;
create trigger audit_products
  after insert or update or delete on public.products
  for each row execute function public.write_audit_log();

drop trigger if exists audit_product_images on public.product_images;
create trigger audit_product_images
  after insert or update or delete on public.product_images
  for each row execute function public.write_audit_log();

drop trigger if exists audit_contact_methods on public.contact_methods;
create trigger audit_contact_methods
  after insert or update or delete on public.contact_methods
  for each row execute function public.write_audit_log();

drop trigger if exists audit_workflows on public.workflows;
create trigger audit_workflows
  after insert or update or delete on public.workflows
  for each row execute function public.write_audit_log();

drop trigger if exists audit_categories on public.categories;
create trigger audit_categories
  after insert or update or delete on public.categories
  for each row execute function public.write_audit_log();

drop trigger if exists audit_inquiries on public.inquiries;
create trigger audit_inquiries
  after insert or update or delete on public.inquiries
  for each row execute function public.write_audit_log();

-- updated_at bump triggers
drop trigger if exists bump_products_updated on public.products;
create trigger bump_products_updated before update on public.products
  for each row execute function public.bump_updated_at();

drop trigger if exists bump_categories_updated on public.categories;
create trigger bump_categories_updated before update on public.categories
  for each row execute function public.bump_updated_at();

drop trigger if exists bump_contact_methods_updated on public.contact_methods;
create trigger bump_contact_methods_updated before update on public.contact_methods
  for each row execute function public.bump_updated_at();

drop trigger if exists bump_workflows_updated on public.workflows;
create trigger bump_workflows_updated before update on public.workflows
  for each row execute function public.bump_updated_at();

drop trigger if exists bump_profiles_updated on public.profiles;
create trigger bump_profiles_updated before update on public.profiles
  for each row execute function public.bump_updated_at();
