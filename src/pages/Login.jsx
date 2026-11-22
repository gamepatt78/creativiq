import { useState } from 'react'
import { BrainCircuit, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import signinBackground from '../assets/signin-background.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <main className="auth-page" style={{ '--auth-background': `url("${signinBackground}")` }}>
        <section className="auth-card auth-config-card" aria-live="polite">
          <div className="auth-logo" aria-hidden="true"><BrainCircuit size={22}/></div>
          <p className="auth-kicker">CreativIQ</p>
          <p className="auth-tagline">AI-Powered Creative Intelligence</p>
          <h1>Dashboard configuration required</h1>
          <p className="auth-subtitle">
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>
            {' '}in <code>.env.local</code>, then restart Vite.
          </p>
        </section>
      </main>
    )
  }

  async function signIn(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) setError(authError.message)
    setBusy(false)
  }

  return (
    <main className="auth-page" style={{ '--auth-background': `url("${signinBackground}")` }}>
      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-header">
          <div className="auth-logo" aria-hidden="true"><BrainCircuit size={22}/></div>
          <p className="auth-kicker">CreativIQ</p>
          <p className="auth-tagline">AI-Powered Creative Intelligence</p>
          <h1 id="login-title">Sign in to your workspace</h1>
          <p className="auth-subtitle">
            <ShieldCheck size={14} aria-hidden="true" />
            Secure access to AI creative analysis
          </p>
        </header>

        <form className="auth-form" onSubmit={signIn}>
          <label htmlFor="email">Email address</label>
          <div className="auth-input">
            <Mail size={17} aria-hidden="true" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="name@company.com"
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="auth-input">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter password"
            />
            <button
              className="password-toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? <span className="auth-spinner" aria-hidden="true" /> : null}
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
