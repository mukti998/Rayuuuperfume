import { Link } from 'react-router-dom';
import type { Product, ProductImage } from '../types/database';
import { getProductImageUrl } from '../utils/storage';
import { formatPrice } from '../utils/format';
import { useCart } from '../context/CartContext';

export function ProductCard({ product, image }: { product: Product; image?: ProductImage }) {
  const { addItem } = useCart();

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addItem(product, image);
  }

  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className="product-card-image">
        {image ? (
          <img src={getProductImageUrl(image.storage_path)} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-card-placeholder" aria-hidden="true" />
        )}
      </div>
      <h3>{product.name}</h3>
      <p className="price">{formatPrice(product.price)}</p>
      <button className="btn-gold card-add-btn" onClick={handleAdd}>Add to cart</button>
    </Link>
  );
}
