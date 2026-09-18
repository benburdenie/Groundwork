'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '../../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, shared } from '../../../lib/theme'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function DispatchPage() {
  const [jobs, setJobs] = useState([])
  const [equipment, setEquipment] = useState([])
  const [workers, setWorkers] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [jobsRes, equipmentRes, workersRes, bookingsRes] = await Promise.all([
        apiGet('/api/jobs'), apiGet('/api/equipment'), apiGet('/api/workers'), apiGet('/api/equipment-bookings'),
      ])
      setJobs(jobsRes.jobs || [])
      setEquipment(equipmentRes.equipment || [])
      setWorkers(workersRes.workers || [])
      setBookings(bookingsRes.bookings || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={shared.loading}>Loading...</div>

  const today = todayStr()
  const activeJobs = jobs.filter(j =>
    j.status !== 'complete' && j.start_date && j.end_date && j.start_date <= today && today <= j.end_date
  )
  const crewsOutIds = new Set(activeJobs.filter(j => j.crew_id).map(j => j.crew_id))
  const deployed = equipment.filter(e => e.computed_status === 'inuse').length
  const available = equipment.filter(e => e.computed_status === 'available').length

  const statusColor = (status) => (
    status === 'repair' ? COLORS.red :
    status === 'available' ? COLORS.green :
    status === 'inuse' ? COLORS.yellow : COLORS.blue
  )

  return (
    <div className="dispatch-sheet" style={styles.page}>
      <div className="print-hide" style={styles.toolbar}>
        <button style={shared.btnPrimary} onClick={() => window.print()}>Print</button>
      </div>

      <h1 style={styles.title}>Daily Dispatch — {today}</h1>

      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{activeJobs.length}</div>
          <div style={styles.summaryLabel}>Active Jobs</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{crewsOutIds.size}</div>
          <div style={styles.summaryLabel}>Crews Out</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{deployed}</div>
          <div style={styles.summaryLabel}>Equipment Deployed</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryValue}>{available}</div>
          <div style={styles.summaryLabel}>Equipment Available</div>
        </div>
      </div>

      <div style={styles.jobs}>
        {activeJobs.length === 0 && <p style={styles.empty}>No active jobs today.</p>}
        {activeJobs.map(job => {
          const crewWorkers = job.crew_id ? workers.filter(w => w.crew_id === job.crew_id) : []
          const bookedEquip = bookings.filter(b => b.job_id === job.id && b.start_date <= today && today <= b.end_date)
          const equipNames = [
            ...(job.job_equipment || []).map(je => je.equipment?.name).filter(Boolean),
            ...bookedEquip.map(b => b.equipment?.name).filter(Boolean),
          ]
          return (
            <div key={job.id} style={styles.jobCard}>
              <div style={styles.jobHeader}>
                <h3 style={styles.jobName}>{job.name}</h3>
                {job.crew && (
                  <span style={{ ...styles.crewTag, borderColor: job.crew.color || COLORS.yellow, color: job.crew.color || COLORS.yellow }}>
                    {job.crew.name}
                  </span>
                )}
              </div>
              {job.address && <p style={styles.line}>{job.address}{job.city ? `, ${job.city}` : ''}</p>}
              {job.client_name && <p style={styles.line}>Client: {job.client_name}{job.client_phone ? ` · ${job.client_phone}` : ''}</p>}
              <p style={styles.line}>Workers: {crewWorkers.length ? crewWorkers.map(w => w.name).join(', ') : '—'}</p>
              <p style={styles.line}>Equipment: {equipNames.length ? equipNames.join(', ') : '—'}</p>
              {job.notes && <p style={styles.notes}>{job.notes}</p>}
              <div style={styles.signLines}>
                <div style={styles.signLine}>Crew Signature: _____________________</div>
                <div style={styles.signLine}>Time In / Out: _____________________</div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={styles.equipFooter}>
        <div style={styles.equipFooterTitle}>Equipment Status</div>
        <div style={styles.equipGrid}>
          {equipment.map(e => (
            <div key={e.id} style={styles.equipItem}>
              <span style={{ ...styles.equipDot, background: statusColor(e.computed_status) }} />
              {e.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { background: COLORS.black, color: '#fff', padding: '1rem', minHeight: '100vh' },
  toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' },
  title: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.6rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: COLORS.border, marginBottom: '1.5rem' },
  summaryItem: { background: COLORS.cardBg, padding: '0.9rem', textAlign: 'center' },
  summaryValue: { fontFamily: FONT_MONO, fontSize: '1.8rem', fontWeight: 800, color: COLORS.yellow },
  summaryLabel: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.mid, marginTop: '0.3rem' },
  jobs: { display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2rem' },
  empty: { color: '#555' },
  jobCard: { border: `1px solid ${COLORS.border}`, background: COLORS.cardBg, padding: '1rem 1.25rem', breakInside: 'avoid' },
  jobHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' },
  jobName: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', margin: 0 },
  crewTag: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase', border: '1px solid', padding: '0.15rem 0.5rem' },
  line: { fontSize: '0.85rem', margin: '0.2rem 0', color: '#ccc' },
  notes: { fontSize: '0.82rem', color: '#999', fontStyle: 'italic', margin: '0.5rem 0 0' },
  signLines: { display: 'flex', gap: '1.5rem', marginTop: '0.9rem', paddingTop: '0.6rem', borderTop: `1px dashed ${COLORS.border}` },
  signLine: { fontFamily: FONT_MONO, fontSize: '0.7rem', color: '#666' },
  equipFooter: { borderTop: `2px solid ${COLORS.border}`, paddingTop: '1rem' },
  equipFooterTitle: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.mid, marginBottom: '0.6rem' },
  equipGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.4rem 1rem' },
  equipItem: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' },
  equipDot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
}
