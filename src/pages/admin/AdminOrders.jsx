import { useEffect, useState } from 'react'
import { Truck, CheckCircle2, Bell } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminOrders() {
  const [tab, setTab] = useState('active') // 'active' | 'history'
  const [orders, setOrders] = useState([])
  const [busyResidence, setBusyResidence] = useState(null)
  const [busyOrder, setBusyOrder] = useState(null)

  const loadOrders = () => {
    const statuses = tab === 'active' ? ['pending', 'out_for_delivery'] : ['delivered', 'cancelled']
    supabase
      .from('orders')
      .select('*, residences(name), residence_buildings(name), profiles(full_name, phone)')
      .in('status', statuses)
      .order('created_at', { ascending: tab === 'active' })
      .then(({ data }) => setOrders(data || []))
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const grouped = orders.reduce((acc, o) => {
    const key = o.residence_id
    acc[key] = acc[key] || { name: o.residences?.name || 'Unknown residence', orders: [] }
    acc[key].orders.push(o)
    return acc
  }, {})

  const notifyResidence = async (residenceId) => {
    setBusyResidence(residenceId)
    const pendingIds = grouped[residenceId].orders.filter((o) => o.status === 'pending').map((o) => o.id)

    await supabase.from('delivery_notifications').insert({
      scope: 'residence_bulk',
      residence_id: residenceId,
      message: 'BMS Treats is on the way to your residence!',
    })

    if (pendingIds.length) {
      await supabase.from('orders').update({ status: 'out_for_delivery' }).in('id', pendingIds)
    }

    setBusyResidence(null)
    loadOrders()
  }

  const notifySingle = async (order) => {
    setBusyOrder(order.id)
    await supabase.from('delivery_notifications').insert({
      scope: 'single',
      order_id: order.id,
      message: 'Your BMS Treats order is on the way!',
    })
    await supabase.from('orders').update({ status: 'out_for_delivery' }).eq('id', order.id)
    setBusyOrder(null)
    loadOrders()
  }

  const markDelivered = async (orderId) => {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId)
    loadOrders()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Orders</h1>
        <div className="tab-switch">
          <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
            Active
          </button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            History
          </button>
        </div>
      </div>

      {orders.length === 0 && (
        <p>{tab === 'active' ? 'No pending or out-for-delivery orders right now.' : 'No delivered or cancelled orders yet.'}</p>
      )}

      {Object.entries(grouped).map(([residenceId, group]) => (
        <div className="res-group" key={residenceId}>
          <div className="res-group-header">
            <h3 style={{ margin: 0 }}>{group.name} · {group.orders.length} order(s)</h3>
            {tab === 'active' && (
              <ConfirmDialog
                title="Notify everyone at this residence?"
                message={`This alerts every pending buyer at ${group.name} and marks their orders Out for Delivery.`}
                confirmLabel="Notify all"
                onConfirm={() => notifyResidence(residenceId)}
                trigger={(open) => (
                  <button className="btn btn-primary" onClick={open} disabled={busyResidence === residenceId}>
                    <Bell size={15} style={{ marginRight: 6 }} />
                    {busyResidence === residenceId ? 'Notifying…' : "Notify all — I'm on my way"}
                  </button>
                )}
              />
            )}
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Building / Room</th>
                <th>Status</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {group.orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    {o.profiles?.full_name}
                    <br />
                    <span style={{ color: 'var(--cocoa-500)', fontSize: '0.8rem' }}>{o.profiles?.phone}</span>
                  </td>
                  <td>{o.residence_buildings?.name}, Room {o.room_number}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>R{o.total_amount}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {o.status === 'pending' && (
                      <button className="btn btn-outline" onClick={() => notifySingle(o)} disabled={busyOrder === o.id}>
                        <Bell size={14} style={{ marginRight: 6 }} />
                        Notify
                      </button>
                    )}
                    {o.status === 'out_for_delivery' && (
                      <button className="btn btn-outline" onClick={() => markDelivered(o.id)}>
                        <CheckCircle2 size={14} style={{ marginRight: 6 }} />
                        Mark delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}