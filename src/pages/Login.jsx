import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/ongoing')
  }

  return (
    <div className="form-wrap narrow">
      <p className="eyebrow">Restricted</p>
      <h1 className="page-title">Staff Login</h1>
      <p className="hero-sub small">
        For the maintenance secretary, warden and caretaker.
        Everyone else can add and view problems without logging in.
      </p>

      <div className="form">
        <label>Email
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@iitd.ac.in" />
        </label>
        <label>Password
          <input type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn-primary" disabled={loading} onClick={handleLogin}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}
