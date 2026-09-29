import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  const lowStock = product.stock_qty > 0 && product.stock_qty <= 5
  const outOfStock = product.stock_qty === 0

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-thumb">
        {product.image_url ? (
          <img src={product.image_url} alt={`${product.flavour} ${product.type}`} />
        ) : (
          `${product.flavour} · ${product.type}`
        )}
      </div>
      <div className="product-name">{product.flavour}</div>
      <div className="product-meta">
        <span className="price">R{product.price}</span>
        <span>{product.type === 'tray' ? 'Tray' : 'Cup'}</span>
      </div>
      {outOfStock && <span className="stock-low">Out of stock</span>}
      {lowStock && <span className="stock-low">Only {product.stock_qty} left</span>}
    </Link>
  )
}
