import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { sendOrderReceiptEmail } from '../../lib/emailReceipt'

export default function PaymentStep() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [draft, setDraft] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('bms_order_draft')
    if (!raw) {
      navigate('/')
      return
    }
    const parsed = JSON.parse(raw)
    if (!parsed.residenceId) {
      navigate('/checkout/address')
      return
    }
    setDraft(parsed)
  }, [navigate])

  if (!draft) return null

  const total = draft.price * draft.qty

  const handleCardClick = () => {
    window.alert('Card payments are still under maintenance — please choose Cash on Delivery for now.')
  }

  const handlePlaceOrder = async () => {
    setPlacing(true)
    setError('')
    try {
      const { data: order, error: rpcError } = await supabase.rpc('place_order', {
        p_residence_id: draft.residenceId,
        p_building_id: draft.buildingId,
        p_room_number: draft.room,
        p_product_id: draft.productId,
        p_quantity: draft.qty,
      })
      if (rpcError) throw rpcError

      // Best-effort — a failed email should never block the order flow
      sendOrderReceiptEmail({
        to_email: user?.email,
        to_name: draft.name,
        order_id: order.id.slice(0, 8),
        items_summary: `${draft.name} × ${draft.qty}`,
        total_amount: total,
        residence_name: draft.residenceName,
        building_name: draft.buildingName || '',
        room_number: draft.room,
        track_url: `${window.location.origin}/track-order/${order.id}`,
      })

      sessionStorage.removeItem('bms_order_draft')
      navigate(`/track-order/${order.id}?placed=1`)
    } catch (e) {
      setError(e.message || 'Something went wrong placing your order — please try again.')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px' }}>
      <div className="checkout-steps">
        <span>1. Delivery address</span>
        <span>›</span>
        <span className="active">2. Payment</span>
      </div>

      <h1 style={{ fontSize: '1.6rem' }}>How would you like to pay?</h1>

      <div className="card" style={{ margin: '20px 0', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>{draft.name} × {draft.qty}</span>
          <span>R{total}</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--cocoa-500)' }}>
          Delivering to {draft.residenceName}, {draft.buildingName}, room {draft.room}
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', marginBottom: 12 }}
        onClick={handlePlaceOrder}
        disabled={placing}
      >
        {placing ? 'Placing order…' : `Pay R${total} on delivery`}
      </button>

      <button className="btn btn-outline" style={{ width: '100%' }} onClick={handleCardClick}>
        Pay by card
      </button>

      {error && <p style={{ color: 'var(--berry-600)', marginTop: 12 }}>{error}</p>}
    </div>
  )
}