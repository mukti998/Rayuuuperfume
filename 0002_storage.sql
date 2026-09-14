-- ============================================================
-- Storage: product-images bucket + policies
-- Run after 0001_init.sql
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public can read (view) images in the bucket
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only admins can upload
drop policy if exists "product-images admin insert" on storage.objects;
create policy "product-images admin insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

-- Only admins can update (replace) files
drop policy if exists "product-images admin update" on storage.objects;
create policy "product-images admin update"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- Only admins can delete files
drop policy if exists "product-images admin delete" on storage.objects;
create policy "product-images admin delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
