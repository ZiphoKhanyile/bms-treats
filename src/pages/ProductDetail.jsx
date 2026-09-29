import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'

const QUICK_QTYS = [1, 2, 3, 4]

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [customQty, setCustomQty] = useState(false)

  const [tab, setTab] = useState('details')
  const [reviews, setReviews] = useState([])
  const [myReview, setMyReview] = useState(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [savingReview, setSavingReview] = useState(false)

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

    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadReviews = () => {
    supabase
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews(data || []))
  }

  useEffect(() => {
    if (!user) {
      setMyReview(null)
      return
    }
    const existing = reviews.find((r) => r.user_id === user.id)
    if (existing) {
      setMyReview(existing)
      setReviewRating(existing.rating)
      setReviewComment(existing.comment || '')
    }
  }, [reviews, user])

  if (loading) return <div className="container" style={{ padding: 40 }}>Loading…</div>
  if (!product) return <div className="container" style={{ padding: 40 }}>Product not found.</div>

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0
  const outOfStock = product.stock_qty === 0
  const lowStock = product.stock_qty > 0 && product.stock_qty <= 5

  const handleOrder = () => {
    const draft = { productId: product.id, name: product.flavour, price: product.price, qty }
    sessionStorage.setItem('bms_order_draft', JSON.stringify(draft))
    navigate(user ? '/checkout/address' : '/login?next=/checkout/address')
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate(`/login?next=/product/${id}`)
      return
    }
    setSavingReview(true)
    await supabase.from('reviews').upsert(
      { product_id: id, user_id: user.id, rating: reviewRating, comment: reviewComment },
      { onConflict: 'product_id,user_id' }
    )
    setSavingReview(false)
    loadReviews()
  }

  return (
    <div className="container pd-page">
      <div className="pd-grid">
        <div className="pd-image">
          {product.image_url ? (
            <img src={product.image_url} alt={`${product.flavour} ${product.type}`} />
          ) : (
            <div className="pd-image-fallback">{product.flavour} · {product.type}</div>
          )}
        </div>

        <div className="pd-info">
          <h1>{product.flavour}</h1>
          <div style={{ color: 'var(--cocoa-500)', marginBottom: 8 }}>
            {product.type === 'tray' ? 'Dessert Tray' : 'Dessert Cup'}
          </div>

          <StarRating value={avgRating} count={reviews.length} />

          <div className="pd-tags">
            <span className="tag">{product.type === 'tray' ? 'Tray' : 'Cup'}</span>
            <span className="tag">Contains Dairy &amp; Gluten</span>
            {outOfStock && <span className="tag tag-berry">Out of Stock</span>}
            {lowStock && <span className="tag tag-berry">Only {product.stock_qty} left</span>}
            {!outOfStock && !lowStock && <span className="tag tag-success">In Stock</span>}
          </div>

          <div className="pd-price">R{product.price}</div>

          <div className="pd-qty-label">Quantity</div>
          <div className="pd-qty-pills">
            {QUICK_QTYS.map((n) => (
              <button
                key={n}
                className={`qty-pill ${!customQty && qty === n ? 'active' : ''}`}
                onClick={() => {
                  setQty(n)
                  setCustomQty(false)
                }}
              >
                {n}
              </button>
            ))}
            <button
              className={`qty-pill ${customQty ? 'active' : ''}`}
              onClick={() => {
                setCustomQty(true)
                setQty(5)
              }}
            >
              5+
            </button>
            {customQty && (
              <input
                type="number"
                min="5"
                max={product.stock_qty}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                style={{ width: 64, marginLeft: 4 }}
              />
            )}
          </div>

          <button className="btn btn-primary pd-cta" disabled={outOfStock} onClick={handleOrder}>
            {outOfStock ? 'Out of stock' : 'Order to my res'}
          </button>
        </div>
      </div>

      <div className="pd-tabs">
        <button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>
          Details
        </button>
        <button className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>
          Customer Reviews ({reviews.length})
        </button>
      </div>

      {tab === 'details' && (
        <div className="pd-tab-panel">
          <p style={{ color: 'var(--cocoa-700)', lineHeight: 1.7, maxWidth: '65ch' }}>
            {product.description || 'Freshly made layered cake, cream, and toppings — no description added yet.'}
          </p>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="pd-tab-panel">
          <form onSubmit={submitReview} className="card" style={{ margin: '0 0 28px', maxWidth: 480 }}>
            <h3 style={{ marginTop: 0 }}>{myReview ? 'Update your review' : 'Leave a review'}</h3>
            <div style={{ marginBottom: 14 }}>
              <StarRating value={reviewRating} interactive onChange={setReviewRating} size={22} />
            </div>
            <div className="field">
              <label htmlFor="review-comment">Comment (optional)</label>
              <textarea
                id="review-comment"
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: '1.5px solid var(--line)',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                }}
              />
            </div>
            <button className="btn btn-primary" disabled={savingReview}>
              {savingReview ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
            </button>
            {!user && <p className="field-hint" style={{ marginTop: 10 }}>You'll be asked to log in first.</p>}
          </form>

          {reviews.length === 0 && <p>No reviews yet — be the first!</p>}

          <div className="review-grid">
            {reviews.map((r) => (
              <div key={r.id} className="review-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong>{r.profiles?.full_name || 'BMS Treats customer'}</strong>
                  <StarRating value={r.rating} size={14} />
                </div>
                {r.comment && <p style={{ margin: 0, color: 'var(--cocoa-700)', fontSize: '0.92rem' }}>{r.comment}</p>}
                <div style={{ fontSize: '0.76rem', color: 'var(--cocoa-500)', marginTop: 8 }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}