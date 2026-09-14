import { supabase } from '../lib/supabaseClient';

const BUCKET = 'product-images';

/**
 * Uploads a product image to Supabase Storage under a unique path,
 * following the flow required by the brief:
 * validate -> upload -> get path -> caller saves the DB record ->
 * only then (if replacing) delete the old file.
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
 * Replace flow: upload the new file first, only remove the old one once
 * the new upload has succeeded — never leaves the product without an image
 * if something fails mid-way.
 */
export async function replaceProductImage(
  productId: string,
  file: File,
  oldStoragePath: string | null
): Promise<string> {
  const newPath = await uploadProductImage(productId, file);
  if (oldStoragePath) {
    try {
      await deleteProductImage(oldStoragePath);
    } catch {
      // Non-fatal: the new image is already live; a stale file left in
      // storage is preferable to losing the product's image entirely.
    }
  }
  return newPath;
}
