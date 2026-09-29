import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProduct(data || null)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="container" style={{ padding: 40 }}>Loading…</div>
  if (!product) return <div className="container" style={{ padding: 40 }}>Product not found.</div>

  const handleOrder = () => {
    const draft = { productId: product.id, name: product.flavour, price: product.price, qty }
    sessionStorage.setItem('bms_order_draft', JSON.stringify(draft))
    if (!user) {
      navigate('/login?next=/checkout/address')
    } else {
      navigate('/checkout/address')
    }
  }

  return (
    <div className="container" style={{ padding: '48px 24px' }}>
      <div
        className="product-thumb"
        style={{ height: 260, borderRadius: 'var(--radius-cup)', marginBottom: 24 }}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={`${product.flavour} ${product.type}`} />
        ) : (
          `${product.flavour} ${product.type}`
        )}
      </div>
      <h1>{product.name} — {product.flavour}</h1>
      <p style={{ color: 'var(--cocoa-700)', fontSize: '1.1rem' }}>R{product.price}</p>

      <div className="field" style={{ maxWidth: 160 }}>
        <label htmlFor="qty">Quantity</label>
        <input
          id="qty"
          type="number"
          min="1"
          max={product.stock_qty}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
      </div>

      <button
        className="btn btn-primary"
        disabled={product.stock_qty === 0}
        onClick={handleOrder}
      >
        {product.stock_qty === 0 ? 'Out of stock' : 'Order to my res'}
      </button>
    </div>
  )
}
