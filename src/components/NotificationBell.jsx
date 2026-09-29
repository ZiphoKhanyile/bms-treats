import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Package, Truck, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const ICONS = {
  order_placed: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    if (!user) return

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications(data || []))

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications((prev) => [payload.new, ...prev])
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const markAllRead = async () => {
    if (!user) return
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  }

  if (!user) return null

  return (
    <div className="notif-wrap">
      <button
        className="icon-btn"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) markAllRead()
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Notifications</div>
          {notifications.length === 0 && <div className="notif-empty">Nothing yet — order updates show up here.</div>}
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || Bell
            return (
              <Link key={n.id} to={`/track-order/${n.order_id}`} className="notif-item" onClick={() => setOpen(false)}>
                <Icon size={16} />
                <div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}