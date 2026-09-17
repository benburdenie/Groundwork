'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

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
          <h2 style={styles.heading}>Check your email</h2>
          <p style={styles.sub}>We sent a confirmation link to <strong>{formData.email}</strong>. Click it to activate your account.</p>
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
            <label style={styles.label}>Company Name</label>
            <input
              style={styles.input}
              name="companyName"
              placeholder="e.g. Smith Landscaping"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Your Name</label>
            <input
              style={styles.input}
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
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
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
  heading: {
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: '0.35rem',
  },
  sub: {
    color: '#888',
    fontSize: '0.85rem',
    marginBottom: '1.75rem',
  },
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
  footer: {
    color: '#555',
    fontSize: '0.8rem',
    textAlign: 'center',
    marginTop: '1.5rem',
  },
  legal: {
    color: '#555',
    fontSize: '0.75rem',
    textAlign: 'center',
    lineHeight: 1.5,
    marginTop: '0.9rem',
    marginBottom: 0,
  },
  link: { color: '#F5C800', textDecoration: 'none' },
}
