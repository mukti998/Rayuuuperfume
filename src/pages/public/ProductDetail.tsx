import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { ContactMethod, Product, ProductImage } from '../../types/database';
import { getProductImageUrl } from '../../utils/storage';
import { formatPrice } from '../../utils/format';
import { useCart } from '../../context/CartContext';
import { ContactIcon } from '../../components/ContactIcon';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addedMsg, setAddedMsg] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    (async () => {
      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (!prod) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProduct(prod as Product);

      const { data: imgs } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', (prod as Product).id)
        .order('sort_order');
      setImages((imgs as ProductImage[]) || []);

      const { data: methods } = await supabase
        .from('contact_methods')
        .select('*')
        .eq('enabled', true)
        .order('sort_order');
      setContactMethods((methods as ContactMethod[]) || []);

      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <p>Loading…</p>;
  if (notFound || !product) {
    return (
      <div className="empty-state">
        <p>That product isn't available.</p>
        <Link to="/products">Back to the collection</Link>
      </div>
    );
  }

  const primaryImage = images.find((img) => img.is_primary) || images[0] || null;

  function handleAddToCart() {
    if (!product) return;
    addItem(product, primaryImage || undefined);
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 1500);
  }

  return (
    <div className="product-detail">
      <div className="product-detail-images">
        {images.length === 0 ? (
          <div className="product-card-placeholder" />
        ) : (
          images.map((img) => (
            <img key={img.id} src={getProductImageUrl(img.storage_path)} alt={product.name} />
          ))
        )}
      </div>
      <div className="product-detail-info">
        <h1>{product.name}</h1>
        <p className="price">{formatPrice(product.price)}</p>
        <p className="description">{product.description}</p>

        <button className="btn-gold" onClick={handleAddToCart} style={{ marginTop: 20 }}>
          {addedMsg ? 'Added!' : 'Add to cart'}
        </button>

        <h2>Order this scent</h2>
        <div className="contact-row">
          {contactMethods.length === 0 ? (
            <p className="empty-state">Contact options aren't configured yet.</p>
          ) : (
            contactMethods.map((m) => (
              <a
                key={m.id}
                className="contact-chip"
                href={contactHref(m)}
                target="_blank"
                rel="noreferrer"
              >
                <ContactIcon type={m.type} />
                {m.label}
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function contactHref(method: ContactMethod): string {
  switch (method.type) {
    case 'whatsapp':
      return `https://wa.me/${method.value.replace(/[^0-9]/g, '')}`;
    case 'telegram':
      return method.value.startsWith('http') ? method.value : `https://t.me/${method.value.replace('@', '')}`;
    case 'phone':
      return `tel:${method.value}`;
    case 'email':
      return `mailto:${method.value}`;
    default:
      return method.value;
  }
}
