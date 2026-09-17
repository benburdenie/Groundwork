'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '../../lib/api'
import { COLORS, FONT_MONO, shared } from '../../lib/theme'

export default function Dashboard() {
  const router = useRouter()
  const [counts, setCounts] = useState({ crews: 0, jobs: 0, equipment: 0, workers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [crewsRes, equipmentRes, workersRes, jobsRes] = await Promise.all([
        apiGet('/api/crews'),
        apiGet('/api/equipment'),
        apiGet('/api/workers'),
        apiGet('/api/jobs'),
      ])

      setCounts({
        crews: crewsRes.crews?.length || 0,
        equipment: equipmentRes.equipment?.length || 0,
        workers: workersRes.workers?.length || 0,
        jobs: jobsRes.jobs?.length || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={shared.loading}>Loading...</div>

  const cards = [
    { label: 'Crews', value: counts.crews, href: '/dashboard/crews' },
    { label: 'Jobs', value: counts.jobs, href: '/dashboard/jobs' },
    { label: 'Equipment', value: counts.equipment, href: '/dashboard/equipment' },
    { label: 'Workers', value: counts.workers, href: '/dashboard/workers' },
  ]

  return (
    <div>
      <h2 style={styles.pageTitle}>Dashboard</h2>

      <div style={styles.cards}>
        {cards.map(card => (
          <div key={card.label} style={styles.card} onClick={() => router.push(card.href)}>
            <div style={styles.cardValue}>{card.value}</div>
            <div style={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Getting Started</div>
        <p style={styles.sectionSub}>
          Use the sidebar to manage crews, equipment, workers, and jobs. Track everything on the
          kanban board or calendar view.
        </p>
      </div>
    </div>
  )
}

const styles = {
  pageTitle: { ...shared.pageTitle, marginBottom: '1.5rem' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: COLORS.border, marginBottom: '2rem' },
  card: { background: COLORS.cardBg, padding: '1.5rem', textAlign: 'center', cursor: 'pointer' },
  cardValue: { fontFamily: FONT_MONO, fontSize: '2.5rem', fontWeight: 800, color: COLORS.yellow, lineHeight: 1 },
  cardLabel: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase', color: COLORS.mid, marginTop: '0.5rem' },
  section: { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, padding: '1.25rem 1.5rem' },
  sectionTitle: { fontFamily: FONT_MONO, fontSize: '0.7rem', letterSpacing: '3px', textTransform: 'uppercase', color: COLORS.yellow, marginBottom: '0.5rem' },
  sectionSub: { color: '#888', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 },
}
