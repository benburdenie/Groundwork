'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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
                <label style={styles.label}>New Password</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
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
    background: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Barlow', sans-serif",
    padding: '1rem',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderTop: '3px solid #F5C800',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px',
  },
  logo: {
    fontFamily: 'monospace',
    fontWeight: 900,
    fontSize: '1.8rem',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: '#fff',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  accent: { color: '#F5C800' },
  heading: { color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.35rem' },
  sub: { color: '#888', fontSize: '0.85rem', marginBottom: '1.75rem' },
  group: { marginBottom: '1rem' },
  label: {
    display: 'block',
    fontSize: '0.7rem',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: '0.4rem',
    fontFamily: 'monospace',
  },
  input: {
    width: '100%',
    background: '#111',
    border: '1px solid #333',
    color: '#fff',
    padding: '0.6rem 0.75rem',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    outline: 'none',
  },
  error: {
    background: '#2a0d0d',
    border: '1px solid #5a1a1a',
    color: '#e87070',
    padding: '0.6rem 0.75rem',
    fontSize: '0.82rem',
    marginBottom: '1rem',
    fontFamily: 'monospace',
  },
  button: {
    width: '100%',
    background: '#F5C800',
    color: '#111',
    border: 'none',
    padding: '0.75rem',
    fontSize: '0.85rem',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: '0.5rem',
    fontFamily: 'monospace',
  },
  footer: { color: '#555', fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem' },
  link: { color: '#F5C800', textDecoration: 'none' },
}
