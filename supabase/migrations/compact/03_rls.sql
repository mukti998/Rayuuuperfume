-- Profiles: users read their own; admins read all
alter table public.profiles enable row level security;
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Categories: public read, admin write
alter table public.categories enable row level security;
drop policy if exists categories_public_select on public.categories;
create policy categories_public_select on public.categories
  for select using (true);
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- Products: published + admin read, admin write
alter table public.products enable row level security;
drop policy if exists products_public_select on public.products;
create policy products_public_select on public.products
  for select using (status = 'published' or public.is_admin());
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Product images: public reads published-product images; admin full
alter table public.product_images enable row level security;
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

-- Contact methods: public reads enabled; admin full
alter table public.contact_methods enable row level security;
drop policy if exists contact_methods_public_select on public.contact_methods;
create policy contact_methods_public_select on public.contact_methods
  for select using (enabled = true or public.is_admin());
drop policy if exists contact_methods_admin_write on public.contact_methods;
create policy contact_methods_admin_write on public.contact_methods
  for all using (public.is_admin()) with check (public.is_admin());

-- Inquiries: public can insert only; admin read + update
alter table public.inquiries enable row level security;
drop policy if exists inquiries_public_insert on public.inquiries;
create policy inquiries_public_insert on public.inquiries
  for insert with check (true);
drop policy if exists inquiries_admin_select on public.inquiries;
create policy inquiries_admin_select on public.inquiries
  for select using (public.is_admin());
drop policy if exists inquiries_admin_update on public.inquiries;
create policy inquiries_admin_update on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- Workflows: admin only
alter table public.workflows enable row level security;
drop policy if exists workflows_admin_all on public.workflows;
create policy workflows_admin_all on public.workflows
  for all using (public.is_admin()) with check (public.is_admin());

-- Workflow executions: admin only
alter table public.workflow_executions enable row level security;
drop policy if exists workflow_executions_admin_all on public.workflow_executions;
create policy workflow_executions_admin_all on public.workflow_executions
  for all using (public.is_admin()) with check (public.is_admin());

-- Audit logs: admin read only (writes come from security-definer trigger)
alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select using (public.is_admin());

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
