'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { COLORS, FONT_COND, FONT_MONO, RADIUS } from '../../lib/theme'
import { Spinner } from '../dashboard/ui'

export default function ResetPassword() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Ground<span style={styles.accent}>Work</span></h1>

        {success ? (
          <>
            <h2 style={styles.heading}>Password updated</h2>
            <p style={styles.sub}>Redirecting you to your dashboard...</p>
          </>
        ) : !ready ? (
          <>
            <h2 style={styles.heading}>Reset your password</h2>
            <p style={styles.sub}>
              Open this page from the password reset link in your email to continue.
            </p>
          </>
        ) : (
          <>
            <h2 style={styles.heading}>Choose a new password</h2>
            <p style={styles.sub}>Enter and confirm your new password below.</p>

            <form onSubmit={handleSubmit}>
              <div style={styles.group}>
                <label style={styles.label}>New password</label>
                <input
                  className="field"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>Confirm password</label>
                <input
                  className="field"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button className="btn btn-primary" style={styles.fullWidthBtn} type="submit" disabled={loading}>
                {loading && <Spinner />}
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </>
        )}

        <p style={styles.footer}>
          <a href="/login" style={styles.link}>Back to sign in</a>
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
  link: { color: COLORS.primary, textDecoration: 'none' },
}
