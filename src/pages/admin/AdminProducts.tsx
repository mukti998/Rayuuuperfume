import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { deleteAllProductImages } from '../../utils/storage';
import type { Product } from '../../types/database';
import { formatPrice } from '../../utils/format';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('sort_order');
    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(product: Product) {
    const nextStatus = product.status === 'published' ? 'draft' : 'published';
    await supabase.from('products').update({ status: nextStatus }).eq('id', product.id);
    load();
  }

  async function remove(product: Product) {
    if (!confirm(`Delete "${product.name}"? This removes its images from both the database and storage.`)) return;

    // Clean up storage files BEFORE deleting the product (cascade only
    // removes DB rows, not the actual storage objects).
    await deleteAllProductImages(product.id);

    // Now delete the product — ON DELETE CASCADE handles product_images rows
    await supabase.from('products').delete().eq('id', product.id);
    load();
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1>Products</h1>
        <Link to="new" className="btn-gold">Add product</Link>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : products.length === 0 ? (
        <p className="empty-state">No products yet — add your first one.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th>Featured</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  <button className="status-pill" onClick={() => togglePublish(p)}>
                    {p.status}
                  </button>
                </td>
                <td>{p.featured ? 'Yes' : '—'}</td>
                <td className="admin-table-actions">
                  <Link to={`${p.id}/edit`}>Edit</Link>
                  <button onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
