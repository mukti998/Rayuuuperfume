import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { Product, ProductImage } from '../../types/database';
import { ProductCard } from '../../components/ProductCard';

export function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [images, setImages] = useState<Record<string, ProductImage>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .eq('featured', true)
        .order('sort_order', { ascending: true })
        .limit(4);

      setFeatured((products as Product[]) || []);

      if (products && products.length > 0) {
        const ids = products.map((p) => p.id);
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

  return (
    <div>
      <section className="hero">
        <h1>Luxury, worn quietly.</h1>
        <p>Fragrances built to hold their shape through a long day.</p>
        <Link to="/products" className="btn-gold">View the collection</Link>
      </section>

      <section className="featured">
        <h2>Featured</h2>
        {loading ? (
          <p>Loading…</p>
        ) : featured.length === 0 ? (
          <p className="empty-state">No featured products yet — check back soon.</p>
        ) : (
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} image={images[p.id]} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
