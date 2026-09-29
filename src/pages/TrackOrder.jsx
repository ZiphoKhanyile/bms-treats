import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'

export default function TrackOrder() {
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [onTheWay, setOnTheWay] = useState(false)

  useEffect(() => {
    if (!orderId || !user) return

    supabase
      .from('orders')
      .select('*, order_items(quantity, unit_price, products(flavour, name))')
      .eq('id', orderId)
      .single()
      .then(({ data }) => setOrder(data))

    // Live update on status change (covers the bulk "notify all" flip to out_for_delivery)
    const orderChannel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => ({ ...prev, ...payload.new }))
          if (payload.new.status === 'out_for_delivery') setOnTheWay(true)
        }
      )
      .subscribe()

    // Live banner from a direct "on the way" notification (single or bulk)
    const notifyChannel = supabase
      .channel(`notify-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'delivery_notifications' },
        (payload) => {
          if (payload.new.order_id === orderId || payload.new.residence_id === order?.residence_id) {
            setOnTheWay(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(orderChannel)
      supabase.removeChannel(notifyChannel)
    }
  }, [orderId, user, order?.residence_id])

  if (!order) return <div className="container" style={{ padding: 40 }}>Loading your order…</div>

  return (
    <div className="container" style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px' }}>
      {params.get('placed') && (
        <div className="live-banner" style={{ background: 'var(--success-600)' }}>
          Order placed! A branded receipt has been emailed to you.
        </div>
      )}

      {onTheWay && (
        <div className="live-banner">
          <span className="live-dot" />
          BMS Treats is on the way to your residence!
        </div>
      )}

      <div className="card" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: '1.3rem' }}>Order #{order.id.slice(0, 8)}</h1>
          <StatusBadge status={order.status} />
        </div>
        {order.order_items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: 6 }}>
            <span>{item.products?.flavour} × {item.quantity}</span>
            <span>R{item.unit_price * item.quantity}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--cream-200)', marginTop: 12, paddingTop: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          <span>Total (cash on delivery)</span>
          <span>R{order.total_amount}</span>
        </div>
      </div>
    </div>
  )
}
