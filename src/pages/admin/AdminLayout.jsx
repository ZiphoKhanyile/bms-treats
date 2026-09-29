import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardList, Package, MapPin, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminLayout() {
  const { isAdmin, loading, profile, signOut } = useAuth()
  const navigate = useNavigate()

  if (loading) return null
  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand-mark" style={{ color: '#fff' }}>BMS Admin</div>
          {profile?.full_name && <div className="admin-user">Signed in as {profile.full_name}</div>}
        </div>

        <nav>
          <NavLink to="/admin" end>
            <ClipboardList size={17} /> Orders
          </NavLink>
          <NavLink to="/admin/products">
            <Package size={17} /> Products &amp; Stock
          </NavLink>
          <NavLink to="/admin/residences">
            <MapPin size={17} /> Residences
          </NavLink>
          <NavLink to="/admin/settings">
            <Settings size={17} /> Site Settings
          </NavLink>
        </nav>

        <ConfirmDialog
          title="Log out of admin?"
          message="You'll need to log in again to manage orders, products, and residences."
          confirmLabel="Log out"
          danger
          onConfirm={async () => {
            await signOut()
            navigate('/')
          }}
          trigger={(open) => (
            <button className="admin-logout" onClick={open}>
              <LogOut size={17} /> Log out
            </button>
          )}
        />
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}