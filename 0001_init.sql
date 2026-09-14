-- ============================================================
-- Reis Perfumes — initial schema, RLS, storage, audit triggers
-- Run this in the Supabase SQL editor, or via `supabase db push`
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PROFILES  (extends auth.users with a role)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auto-create a profile row whenever a new auth user is created
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

-- helper: is the current auth user an admin?
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

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_category_idx on public.products(category_id);

-- ------------------------------------------------------------
-- PRODUCT IMAGES  (pointers into Supabase Storage — never base64 in the db)
-- ------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id);

-- ------------------------------------------------------------
-- CONTACT METHODS  (admin-configurable order/contact channels)
-- ------------------------------------------------------------
create table if not exists public.contact_methods (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('whatsapp', 'telegram', 'phone', 'email', 'other')),
  label text not null,
  value text not null,
  enabled boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INQUIRIES  (public order/contact submissions)
-- ------------------------------------------------------------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  phone text,
  email text,
  message text,
  channel text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);
create index if not exists inquiries_status_idx on public.inquiries(status);

-- ------------------------------------------------------------
-- WORKFLOWS  (simple n8n-style trigger -> nodes definition)
-- ------------------------------------------------------------
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  trigger_event text not null,
  enabled boolean not null default true,
  nodes jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- WORKFLOW EXECUTIONS
-- ------------------------------------------------------------
create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','running','success','failed','cancelled')),
  current_node int not null default 0,
  input jsonb,
  output jsonb,
  error text,
  retry_count int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists workflow_executions_workflow_idx on public.workflow_executions(workflow_id);

-- ------------------------------------------------------------
-- AUDIT LOGS
-- ------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_table text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- generic audit trigger function
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

-- updated_at bump helper
create or replace function public.bump_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.contact_methods enable row level security;
alter table public.inquiries enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_executions enable row level security;
alter table public.audit_logs enable row level security;

-- PROFILES: a user can read their own profile; admins can read all
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- CATEGORIES: public read, admin write
drop policy if exists categories_public_select on public.categories;
create policy categories_public_select on public.categories
  for select using (true);
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- PRODUCTS: public can read only published; admin full access
drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products
  for select using (status = 'published' or public.is_admin());
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- PRODUCT IMAGES: public can read images of published products; admin full access
drop policy if exists product_images_public_select on public.product_images;
create policy product_images_public_select on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'published'
    )
  );
drop policy if exists product_images_admin_write on public.product_images;
create policy product_images_admin_write on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- CONTACT METHODS: public reads only enabled ones; admin full access
drop policy if exists contact_methods_public_select on public.contact_methods;
create policy contact_methods_public_select on public.contact_methods
  for select using (enabled = true or public.is_admin());
drop policy if exists contact_methods_admin_write on public.contact_methods;
create policy contact_methods_admin_write on public.contact_methods
  for all using (public.is_admin()) with check (public.is_admin());

-- INQUIRIES: public can INSERT only (no read); admin can read/update
drop policy if exists inquiries_public_insert on public.inquiries;
create policy inquiries_public_insert on public.inquiries
  for insert with check (true);
drop policy if exists inquiries_admin_select on public.inquiries;
create policy inquiries_admin_select on public.inquiries
  for select using (public.is_admin());
drop policy if exists inquiries_admin_update on public.inquiries;
create policy inquiries_admin_update on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- WORKFLOWS / EXECUTIONS / AUDIT LOGS: admin only, no public access at all
drop policy if exists workflows_admin_all on public.workflows;
create policy workflows_admin_all on public.workflows
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists workflow_executions_admin_all on public.workflow_executions;
create policy workflow_executions_admin_all on public.workflow_executions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select using (public.is_admin());
-- no insert/update/delete policy for audit_logs from the client — only the
-- security-definer trigger function writes to it.

-- revoke broad grants, rely on RLS + explicit policies
revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
