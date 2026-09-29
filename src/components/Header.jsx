import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Package, User, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import ConfirmDialog from './ConfirmDialog'

export default function Header() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')

  const activeCategory = params.get('category') || 'all'

  const handleSearch = (e) => {
    e.preventDefault()
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    if (activeCategory !== 'all') next.set('category', activeCategory)
    navigate(`/?${next.toString()}`)
  }

  const categoryLink = (value, label) => {
    const next = new URLSearchParams()
    if (value !== 'all') next.set('category', value)
    if (query) next.set('q', query)
    return (
      <Link to={`/?${next.toString()}`} className={activeCategory === value ? 'active' : ''}>
        {label}
      </Link>
    )
  }

  return (
    <header className="site-header">
      <div className="container header-top">
        <Link to="/" className="brand">
          <span className="brand-mark">BMS Treats</span>
          <span className="brand-tagline">Small Cups. Big Happiness.</span>
        </Link>

        <form className="header-search" onSubmit={handleSearch}>
          <Search size={17} />
          <input placeholder="Search flavours..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>

        <div className="header-icons">
          {user && (
            <Link to="/track-order-lookup" className="icon-btn" title="My orders" aria-label="My orders">
              <Package size={20} />
            </Link>
          )}
          {user && <NotificationBell />}
          {isAdmin && (
            <Link to="/admin" className="icon-btn" title="Admin" aria-label="Admin">
              <Shield size={20} />
            </Link>
          )}
          {user ? (
            <ConfirmDialog
              title="Log out?"
              message="You'll need to log in again to place or track orders."
              confirmLabel="Log out"
              danger
              onConfirm={async () => {
                await signOut()
                navigate('/')
              }}
              trigger={(open) => (
                <button className="btn btn-outline" onClick={open}>
                  <LogOut size={15} style={{ marginRight: 6 }} />
                  Log out
                </button>
              )}
            />
          ) : (
            <Link to="/login" className="icon-btn" title="Log in" aria-label="Log in">
              <User size={20} />
            </Link>
          )}
        </div>
      </div>

      <div className="container category-row">
        {categoryLink('all', 'All Treats')}
        {categoryLink('tray', 'Dessert Trays')}
        {categoryLink('cup', 'Dessert Cups')}
      </div>
    </header>
  )
}