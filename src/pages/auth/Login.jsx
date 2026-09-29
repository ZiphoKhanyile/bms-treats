import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate(params.get('next') || '/')
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above first, then click "I forgot my password."')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) setError(error.message)
    else setResetSent(true)
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
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email*</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field password-field">
                <label htmlFor="password">Password*</label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button type="button" onClick={handleForgotPassword} className="auth-help" style={{ display: 'block', marginBottom: 16 }}>
                I forgot my password
              </button>
              {resetSent && <p style={{ color: 'var(--success-600)', fontSize: '0.85rem' }}>Password reset email sent.</p>}
              {error && <p style={{ color: 'var(--berry-600)', fontSize: '0.9rem' }}>{error}</p>}

              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Logging in…' : 'Login'}
              </button>
              <a href="#" className="auth-help">Help</a>
            </form>
          </div>

          <div className="auth-divider" />

          <div className="auth-panel">
            <h2>Create account</h2>
            <p>You'll need an account to checkout.</p>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigate('/signup')}>
              Create account
            </button>
          </div>
        </div>

        <div className="auth-secure">🔒 100% Secure. Your details are safe with us.</div>
      </div>
    </div>
  )
}
