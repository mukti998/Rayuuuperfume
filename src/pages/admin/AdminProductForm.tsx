import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { Category, Product, ProductImage } from '../../types/database';
import { isValidImageFile, isValidPrice, slugify } from '../../utils/validation';
import { getProductImageUrl, replaceProductImage, deleteProductImage } from '../../utils/storage';

export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [existingImage, setExistingImage] = useState<ProductImage | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) || []);
    });

    if (!isNew) {
      supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          const p = data as Product;
          setName(p.name);
          setPrice(String(p.price));
          setDescription(p.description || '');
          setCategoryId(p.category_id || '');
          setFeatured(p.featured);
          setStatus(p.status);
        });

      supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .eq('is_primary', true)
        .maybeSingle()
        .then(({ data }) => setExistingImage((data as ProductImage) || null));
    }
  }, [id, isNew]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = isValidImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid image.');
      return;
    }
    setError(null);
    setNewImageFile(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNumber = parseFloat(price);
    if (!name.trim()) return setError('Product name is required.');
    if (!isValidPrice(priceNumber)) return setError('Enter a valid price.');

    setSaving(true);
    try {
      // Ensure slug is unique by appending a short suffix if needed
      let slug = slugify(name);
      const { data: existingSlug } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (existingSlug && (!isNew || (existingSlug as Product).id !== id)) {
        slug = `${slug}-${crypto.randomUUID().slice(0, 6)}`;
      }

      const payload = {
        name: name.trim(),
        slug,
        price: priceNumber,
        description: description.trim() || null,
        category_id: categoryId || null,
        featured,
        status,
        ...(isNew ? { created_by: profile?.id ?? null } : {}),
      };

      let productId = id;
      if (isNew) {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        productId = (data as Product).id;
      } else {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', id);
        if (updateError) throw updateError;
      }

      if (newImageFile && productId) {
        // Step 1: Upload the new file (does NOT delete the old one)
        const newPath = await replaceProductImage(
          productId,
          newImageFile,
          existingImage?.storage_path || null
        );

        // Step 2: Update the DB record to point to the new file
        if (existingImage) {
          await supabase
            .from('product_images')
            .update({ storage_path: newPath })
            .eq('id', existingImage.id);
        } else {
          await supabase.from('product_images').insert({
            product_id: productId,
            storage_path: newPath,
            is_primary: true,
            sort_order: 0,
          });
        }

        // Step 3: Only NOW delete the old file (after DB is updated)
        if (existingImage?.storage_path) {
          try {
            await deleteProductImage(existingImage.storage_path);
          } catch {
            // Non-fatal: the new image is live and the DB is correct.
            // A stale file left in storage is acceptable.
          }
        }
      }

      navigate('..');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving this product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>{isNew ? 'Add product' : 'Edit product'}</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Price (Birr)
          <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </label>
        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured on homepage
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label>
          Product image
          {existingImage && (
            <img
              src={getProductImageUrl(existingImage.storage_path)}
              alt="Current"
              className="admin-image-preview"
            />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
        </label>

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-gold" disabled={saving}>
          {saving ? 'Saving…' : 'Save product'}
        </button>
      </form>
    </div>
  );
}
