import { Link } from 'react-router-dom';
import type { Product, ProductImage } from '../types/database';
import { getProductImageUrl } from '../utils/storage';

export function ProductCard({ product, image }: { product: Product; image?: ProductImage }) {
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
      <p className="price">₦{product.price.toLocaleString()}</p>
    </Link>
  );
}
