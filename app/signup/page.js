'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { COLORS, FONT_COND, FONT_MONO, RADIUS } from '../../lib/theme'
import { Spinner } from '../dashboard/ui'

export default function SignUp() {
  const [formData, setFormData] = useState({
    companyName: '',
    yourName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })
    if (authError) throw authError

    // 2. Create company + company_user via server API (bypasses RLS)
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        companyName: formData.companyName,
        yourName: formData.yourName,
        email: formData.email,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)

    setSuccess(true)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.logo}>Ground<span style={styles.accent}>Work</span></h1>
          <h2 style={styles.heading}>Account created</h2>
          <p style={styles.sub}>Your account is ready. Sign in to get started.</p>
          <a href="/login" className="btn btn-accent" style={styles.fullWidthLink}>Sign in</a>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Ground<span style={styles.accent}>Work</span></h1>
        <h2 style={styles.heading}>Create your account</h2>
        <p style={styles.sub}>Set up your company in 30 seconds.</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Company name</label>
            <input
              className="field"
              name="companyName"
              placeholder="e.g. Smith Landscaping"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Your name</label>
            <input
              className="field"
              name="yourName"
              placeholder="Your full name"
              value={formData.yourName}
              onChange={handleChange}
              required
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input
              className="field"
              name="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input
              className="field"
              name="password"
              type="password"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button className="btn btn-accent" style={styles.fullWidthBtn} type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p style={styles.legal}>
            By creating an account you agree to our{' '}
            <a href="/terms" style={styles.link}>Terms of Service</a> and{' '}
            <a href="/privacy" style={styles.link}>Privacy Policy</a>.
          </p>
        </form>

        <p style={styles.footer}>
          Already have an account? <a href="/login" style={styles.link}>Log in</a>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: COLORS.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
    padding: '1rem',
  },
  card: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderTop: `3px solid ${COLORS.yellow}`,
    borderRadius: RADIUS,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px',
  },
  logo: {
    fontFamily: FONT_COND,
    fontWeight: 800,
    fontSize: '1.8rem',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: COLORS.textPrimary,
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  accent: { color: COLORS.yellow },
  heading: {
    color: COLORS.textPrimary,
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: '0.35rem',
  },
  sub: {
    color: COLORS.textSecondary,
    fontSize: '0.85rem',
    marginBottom: '1.75rem',
  },
  group: { marginBottom: '16px' },
  label: {
    display: 'block',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginBottom: '6px',
    fontWeight: 500,
  },
  error: {
    background: COLORS.dangerSubtle,
    border: `1px solid ${COLORS.danger}40`,
    color: COLORS.danger,
    padding: '10px 14px',
    fontSize: '0.82rem',
    marginBottom: '16px',
    borderRadius: '6px',
    fontFamily: FONT_MONO,
  },
  fullWidthBtn: { width: '100%', marginTop: '4px' },
  fullWidthLink: { width: '100%', textDecoration: 'none', boxSizing: 'border-box' },
  footer: { color: COLORS.textMuted, fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem' },
  legal: {
    color: COLORS.textMuted,
    fontSize: '0.75rem',
    textAlign: 'center',
    lineHeight: 1.5,
    marginTop: '0.9rem',
    marginBottom: 0,
  },
  link: { color: COLORS.primary, textDecoration: 'none' },
}
