'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { COLORS, FONT_COND, FONT_MONO, RADIUS } from '../../lib/theme'
import { Spinner } from '../dashboard/ui'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState(null)
  const [resetSent, setResetSent] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const openForgotPassword = () => {
    setResetEmail(formData.email)
    setResetError(null)
    setResetSent(false)
    setShowForgot(true)
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setResetLoading(false)
    if (error) {
      setResetError(error.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Ground<span style={styles.accent}>Work</span></h1>
        <h2 style={styles.heading}>Welcome back</h2>
        <p style={styles.sub}>Sign in to your account.</p>

        <form onSubmit={handleSubmit}>
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
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={openForgotPassword} style={styles.forgotLink}>
              Forgot password?
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button className="btn btn-primary" style={styles.fullWidthBtn} type="submit" disabled={loading}>
            {loading && <Spinner />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {showForgot && (
          <div style={styles.forgotPanel}>
            {resetSent ? (
              <p style={styles.resetSent}>
                If an account exists for <strong>{resetEmail}</strong>, we&apos;ve sent a password reset link to it.
              </p>
            ) : (
              <form onSubmit={handleResetSubmit}>
                <label style={styles.label}>Reset your password</label>
                <input
                  className="field"
                  type="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                {resetError && <div style={styles.error}>{resetError}</div>}
                <button className="btn btn-secondary" style={{ ...styles.fullWidthBtn, marginTop: '10px' }} type="submit" disabled={resetLoading}>
                  {resetLoading && <Spinner />}
                  {resetLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>
        )}

        <p style={styles.footer}>
          No account yet? <a href="/signup" style={styles.link}>Create one</a>
        </p>

        <p style={styles.legal}>
          <a href="/privacy" style={styles.link}>Privacy Policy</a>
          {' · '}
          <a href="/terms" style={styles.link}>Terms of Service</a>
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
  heading: { color: COLORS.textPrimary, fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' },
  sub: { color: COLORS.textSecondary, fontSize: '0.85rem', marginBottom: '1.75rem' },
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
  fullWidthBtn: { width: '100%' },
  footer: { color: COLORS.textMuted, fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem' },
  legal: { color: COLORS.textMuted, fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' },
  link: { color: COLORS.primary, textDecoration: 'none' },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: COLORS.textSecondary,
    fontSize: '0.78rem',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    padding: 0,
    marginTop: '0.5rem',
    textDecoration: 'underline',
  },
  forgotPanel: {
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS,
    padding: '1rem 1.1rem',
    marginTop: '1.25rem',
  },
  resetSent: { color: COLORS.textSecondary, fontSize: '0.85rem', lineHeight: 1.5, margin: 0 },
}
