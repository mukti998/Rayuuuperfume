import { supabase } from '../lib/supabaseClient';

const BUCKET = 'product-images';

/**
 * Uploads a product image to Supabase Storage under a unique path.
 */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const uniquePath = `${productId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(uniquePath, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;
  return uniquePath;
}

export function getProductImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deleteProductImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw error;
}

/**
 * Replace flow: upload the new file first, then return the new path.
 * The OLD file is NOT deleted here — the caller must update the DB
 * record to point to the new path first, and only THEN call
 * deleteProductImage with the old path.  This prevents a broken
 * state where the old file is gone but the DB still references it.
 */
export async function replaceProductImage(
  productId: string,
  file: File,
  _oldStoragePath: string | null
): Promise<string> {
  // Upload the new file only — do NOT delete the old one here.
  const newPath = await uploadProductImage(productId, file);
  return newPath;
}

/**
 * Fetches all storage paths for a product and removes them from the bucket.
 * Used before deleting a product to ensure no orphaned files remain.
 */
export async function deleteAllProductImages(productId: string): Promise<void> {
  const { data: images } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', productId);

  if (images && images.length > 0) {
    const paths = images.map((img: { storage_path: string }) => img.storage_path);
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    // Non-fatal: if some files are already gone, that's OK.
    if (error) console.warn('Some storage files could not be removed:', error.message);
  }
}
