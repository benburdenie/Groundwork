'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { apiGet } from '../../lib/api'

export default function Dashboard() {
  const router = useRouter()
  const [company, setCompany] = useState(null)
  const [user, setUser] = useState(null)
  const [counts, setCounts] = useState({ crews: 0, jobs: 0, equipment: 0, workers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: companyUser } = await supabase
        .from('company_users')
        .select('*, companies(*)')
        .eq('user_id', user.id)
        .single()

      if (companyUser?.companies) setCompany(companyUser.companies)

      // Fetch real counts
      const [crewsRes] = await Promise.all([
        apiGet('/api/crews'),
      ])

      setCounts({
        crews: crewsRes.crews?.length || 0,
        jobs: 0,
        equipment: 0,
        workers: 0,
      })

      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={styles.container}>
      <div style={styles.loading}>Loading...</div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Ground<span style={styles.accent}>Work</span></h1>
        <div style={styles.headerRight}>
          <span style={styles.companyName}>{company?.name}</span>
          <button style={styles.signOut} onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.welcome}>
          <h2 style={styles.welcomeHeading}>Dashboard</h2>
          <p style={styles.welcomeSub}>
            Logged in as <strong>{user?.email}</strong>
            {company?.name ? <> at <strong>{company.name}</strong></> : ''}
          </p>
        </div>

        <div style={styles.cards}>
          {[
            { label: 'Crews',     value: counts.crews },
            { label: 'Jobs',      value: counts.jobs },
            { label: 'Equipment', value: counts.equipment },
            { label: 'Workers',   value: counts.workers },
          ].map(card => (
            <div key={card.label} style={styles.card}>
              <div style={styles.cardValue}>{card.value}</div>
              <div style={styles.cardLabel}>{card.label}</div>
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Crews</h3>
            <button style={styles.addBtn} onClick={() => router.push('/dashboard/crews')}>
              Manage Crews →
            </button>
          </div>
          <p style={styles.sectionSub}>
            {counts.crews === 0
              ? 'No crews yet. Add your first crew to get started.'
              : `${counts.crews} crew${counts.crews !== 1 ? 's' : ''} in your company.`}
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#111', color: '#fff', fontFamily: "'Barlow', sans-serif" },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555', fontFamily: 'monospace', letterSpacing: '2px' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '54px',
    borderBottom: '2px solid #F5C800', background: '#0d0d0d',
  },
  logo: { fontFamily: 'monospace', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#fff', margin: 0 },
  accent: { color: '#F5C800' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  companyName: { fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#888' },
  signOut: {
    background: 'transparent', border: '1px solid #333', color: '#888',
    fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '1px',
    textTransform: 'uppercase', padding: '0.35rem 0.75rem', cursor: 'pointer',
  },
  body: { padding: '2.5rem 2rem', maxWidth: '1100px' },
  welcome: { marginBottom: '2rem' },
  welcomeHeading: { fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem' },
  welcomeSub: { color: '#888', fontSize: '0.88rem' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#2a2a2a', marginBottom: '2.5rem' },
  card: { background: '#1a1a1a', padding: '1.5rem', textAlign: 'center' },
  cardValue: { fontFamily: 'monospace', fontSize: '2.5rem', fontWeight: 800, color: '#F5C800', lineHeight: 1 },
  cardLabel: { fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#888', marginTop: '0.5rem' },
  section: { background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '1.25rem 1.5rem', marginBottom: '1rem' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' },
  sectionTitle: { fontFamily: 'monospace', fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#F5C800', margin: 0 },
  addBtn: { background: 'transparent', border: '1px solid #333', color: '#888', fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '0.3rem 0.7rem', cursor: 'pointer' },
  sectionSub: { color: '#555', fontSize: '0.82rem', margin: 0 },
}