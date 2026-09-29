import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'

export default function TrackOrderLookup() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*, residences(name), residence_buildings(name)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || [])
        setLoading(false)
      })
  }, [user])

  if (!user) return <div className="container" style={{ padding: 40 }}>Log in to see your orders.</div>
  if (loading) return <div className="container" style={{ padding: 40 }}>Loading your orders…</div>

  return (
    <div className="container" style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 24 }}>Your orders</h1>
      {orders.length === 0 && <p>No orders yet — browse the menu to place your first one.</p>}
      {orders.map((o) => (
        <Link
          key={o.id}
          to={`/track-order/${o.id}`}
          className="card"
          style={{ display: 'block', margin: '0 0 16px', textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Order #{o.id.slice(0, 8)}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--cocoa-500)' }}>
                {o.residences?.name}, {o.residence_buildings?.name} · R{o.total_amount}
              </div>
            </div>
            <StatusBadge status={o.status} />
          </div>
        </Link>
      ))}
    </div>
  )
}
