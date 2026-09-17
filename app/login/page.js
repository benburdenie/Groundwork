'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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
              style={styles.input}
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
              style={styles.input}
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

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
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
                  style={styles.input}
                  type="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                {resetError && <div style={styles.error}>{resetError}</div>}
                <button style={styles.resetButton} type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
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
  legal: { color: '#555', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.75rem' },
  link: { color: '#F5C800', textDecoration: 'none' },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '0.78rem',
    fontFamily: "'Barlow', sans-serif",
    cursor: 'pointer',
    padding: 0,
    marginTop: '0.5rem',
    textDecoration: 'underline',
  },
  forgotPanel: {
    background: '#111',
    border: '1px solid #2a2a2a',
    padding: '1rem 1.1rem',
    marginTop: '1.25rem',
  },
  resetSent: { color: '#bbb', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 },
  resetButton: {
    width: '100%',
    background: 'transparent',
    color: '#F5C800',
    border: '1px solid #F5C800',
    padding: '0.6rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: '0.75rem',
    fontFamily: 'monospace',
  },
}