import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function Signup() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const full_name = `${firstName} ${lastName}`.trim()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, phone } },
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // profiles row is created automatically by a DB trigger on auth.users insert
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-topbar">BMS TREATS</div>
      <div className="auth-body">
        <div className="auth-mark">
          <span className="brand-mark">BMS Treats</span>
        </div>

        <div className="auth-split">
          <div className="auth-panel">
            <h2>Create account</h2>

            {sent ? (
              <p>
                We've sent a verification link to <strong>{email}</strong>. Confirm it before
                logging in to order.
              </p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="firstName">First Name*</label>
                  <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="lastName">Last Name*</label>
                  <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="email">Email*</label>
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="phone">Contact Number*</label>
                  <input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0XX XXX XXXX" />
                </div>
                <div className="field password-field">
                  <label htmlFor="password">Password*</label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <p style={{ color: 'var(--berry-600)', fontSize: '0.9rem' }}>{error}</p>}
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Creating account…' : 'Register'}
                </button>
                <Link to="#" className="auth-help">Help</Link>
              </form>
            )}
          </div>

          <div className="auth-divider" />

          <div className="auth-panel">
            <h2>Login</h2>
            <p>If you already have an account with us you'll need to login to complete checkout.</p>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </div>

        <div className="auth-secure">🔒 100% Secure. Your details are safe with us.</div>
      </div>
    </div>
  )
}
