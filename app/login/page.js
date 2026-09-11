'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          No account yet? <a href="/signup" style={styles.link}>Create one</a>
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