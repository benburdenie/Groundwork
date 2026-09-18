'use client'

import { useEffect, useState } from 'react'
import { Printer } from 'lucide-react'
import { apiGet } from '../../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, RADIUS, shared } from '../../../lib/theme'
import { Skeleton } from '../ui'

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

  if (loading) return (
    <div style={styles.page}>
      <Skeleton height="120px" style={{ marginBottom: '24px' }} />
      <Skeleton height="200px" />
    </div>
  )

  const today = todayStr()
  const activeJobs = jobs.filter(j =>
    j.status !== 'complete' && j.start_date && j.end_date && j.start_date <= today && today <= j.end_date
  )
  const crewsOutIds = new Set(activeJobs.filter(j => j.crew_id).map(j => j.crew_id))
  const deployed = equipment.filter(e => e.computed_status === 'inuse').length
  const available = equipment.filter(e => e.computed_status === 'available').length

  const statusColor = (status) => (
    status === 'repair' ? COLORS.danger :
    status === 'available' ? COLORS.primary :
    status === 'inuse' ? COLORS.yellow : COLORS.blue
  )

  return (
    <div className="dispatch-sheet" style={styles.page}>
      <div className="print-hide" style={styles.toolbar}>
        <button className="btn btn-primary" onClick={() => window.print()}><Printer size={15} />Print</button>
      </div>

      <h1 style={styles.title}>Daily dispatch — {today}</h1>

      <div style={styles.summary}>
        <div className="card" style={styles.summaryItem}>
          <div style={styles.summaryValue}>{activeJobs.length}</div>
          <div style={styles.summaryLabel}>Active jobs</div>
        </div>
        <div className="card" style={styles.summaryItem}>
          <div style={styles.summaryValue}>{crewsOutIds.size}</div>
          <div style={styles.summaryLabel}>Crews out</div>
        </div>
        <div className="card" style={styles.summaryItem}>
          <div style={styles.summaryValue}>{deployed}</div>
          <div style={styles.summaryLabel}>Equipment deployed</div>
        </div>
        <div className="card" style={styles.summaryItem}>
          <div style={styles.summaryValue}>{available}</div>
          <div style={styles.summaryLabel}>Equipment available</div>
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
            <div key={job.id} className="card" style={styles.jobCard}>
              <div style={styles.jobHeader}>
                <h3 style={styles.jobName}>{job.name}</h3>
                {job.crew && (
                  <span style={{ ...styles.crewTag, borderColor: job.crew.color || COLORS.primary, color: job.crew.color || COLORS.primary }}>
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
                <div style={styles.signLine}>Crew signature: _____________________</div>
                <div style={styles.signLine}>Time in / out: _____________________</div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={styles.equipFooter}>
        <div style={styles.equipFooterTitle}>Equipment status</div>
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
  page: { background: COLORS.bg, color: COLORS.textPrimary, padding: '24px', minHeight: '100vh' },
  toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' },
  title: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.6rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  summaryItem: { padding: '16px', textAlign: 'center' },
  summaryValue: { fontFamily: FONT_MONO, fontSize: '1.8rem', fontWeight: 800, color: COLORS.textPrimary },
  summaryLabel: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted, marginTop: '0.3rem' },
  jobs: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' },
  empty: { color: COLORS.textMuted },
  jobCard: { padding: '20px', breakInside: 'avoid' },
  jobHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' },
  jobName: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', margin: 0 },
  crewTag: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid', borderRadius: RADIUS, padding: '0.15rem 0.5rem' },
  line: { fontSize: '0.85rem', margin: '0.2rem 0', color: COLORS.textSecondary },
  notes: { fontSize: '0.82rem', color: COLORS.textMuted, fontStyle: 'italic', margin: '0.5rem 0 0' },
  signLines: { display: 'flex', gap: '1.5rem', marginTop: '0.9rem', paddingTop: '0.6rem', borderTop: `1px dashed ${COLORS.borderSubtle}` },
  signLine: { fontFamily: FONT_MONO, fontSize: '0.7rem', color: COLORS.textMuted },
  equipFooter: { borderTop: `2px solid ${COLORS.borderSubtle}`, paddingTop: '16px' },
  equipFooterTitle: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted, marginBottom: '10px' },
  equipGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.4rem 1rem' },
  equipItem: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' },
  equipDot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
}
