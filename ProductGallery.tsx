import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Category, Product, ProductImage } from '../../types/database';
import { ProductCard } from '../../components/ProductCard';

export function ProductGallery() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<Record<string, ProductImage>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('sort_order');
      setCategories((cats as Category[]) || []);

      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .order('sort_order', { ascending: true });
      setProducts((prods as Product[]) || []);

      if (prods && prods.length > 0) {
        const ids = prods.map((p) => p.id);
        const { data: imgs } = await supabase
          .from('product_images')
          .select('*')
          .in('product_id', ids)
          .eq('is_primary', true);
        const map: Record<string, ProductImage> = {};
        (imgs as ProductImage[] || []).forEach((img) => {
          map[img.product_id] = img;
        });
        setImages(map);
      }
      setLoading(false);
    })();
  }, []);

  const visible = activeCategory ? products.filter((p) => p.category_id === activeCategory) : products;

  return (
    <div className="gallery-page">
      <h1>The Collection</h1>
      <div className="category-filter">
        <button className={!activeCategory ? 'active' : ''} onClick={() => setActiveCategory(null)}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={activeCategory === c.id ? 'active' : ''}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : visible.length === 0 ? (
        <p className="empty-state">No products in this category yet.</p>
      ) : (
        <div className="product-grid">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} image={images[p.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
