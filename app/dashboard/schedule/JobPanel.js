'use client'

import { COLORS, FONT_COND, FONT_MONO, STATUS_LABELS, shared, badgeStyle } from '../../../lib/theme'
import { displayStatus, crewColor } from './helpers'

const NEXT_STATUS = {
  notstarted: { action: 'inprogress', label: 'Start' },
  inprogress: { action: 'complete', label: 'Complete' },
  overdue: { action: 'complete', label: 'Complete' },
  complete: { action: 'notstarted', label: 'Reopen' },
}

export default function JobPanel({ job, workers, jobs, bookings, onClose, onEdit, onStatusChange, onRainDay, onDelete, onSelectJob }) {
  if (!job) return null
  const status = displayStatus(job)
  const color = crewColor(job.crew)
  const crewWorkers = job.crew ? (workers || []).filter(w => w.crew_id === job.crew.id) : []
  const otherJobs = job.crew
    ? (jobs || []).filter(j => j.id !== job.id && j.crew_id === job.crew.id && displayStatus(j) !== 'complete')
    : []
  const bookedEquipment = (bookings || []).filter(b => b.job_id === job.id)
  const equipmentList = [
    ...(job.job_equipment || []).map(je => ({ id: je.equipment_id, name: je.equipment?.name, category: je.equipment?.category, statusColor: COLORS.green })),
    ...bookedEquipment.map(b => ({ id: b.equipment_id, name: b.equipment?.name, category: b.equipment?.category, statusColor: COLORS.blue })),
  ]
  const next = NEXT_STATUS[status] || NEXT_STATUS.notstarted

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...styles.accent, background: color }} />
        <div style={styles.body}>
          <div style={styles.header}>
            <h3 style={styles.title}>{job.name}</h3>
            <span style={badgeStyle(status)}>{STATUS_LABELS[status]}</span>
          </div>

          <p style={styles.meta}>
            {job.start_date && job.end_date ? `${job.start_date} → ${job.end_date}` : job.start_date || 'Unscheduled'}
            {job.duration_days ? ` · ${job.duration_days} work day${job.duration_days !== 1 ? 's' : ''}` : ''}
          </p>

          {job.address && <p style={styles.line}>📍 {job.address}{job.city ? `, ${job.city}` : ''}</p>}
          {job.client_name && (
            <p style={styles.line}>
              {job.client_name}
              {job.client_phone && <>{' · '}<a href={`tel:${job.client_phone}`} style={styles.link}>{job.client_phone}</a></>}
            </p>
          )}

          <p style={styles.line}>
            {job.crew
              ? <><span style={{ ...styles.dot, background: color }} />{job.crew.name}</>
              : 'No crew assigned'}
          </p>

          {crewWorkers.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Crew</div>
              {crewWorkers.map(w => (
                <div key={w.id} style={styles.subLine}>{w.name} <span style={styles.dim}>({w.role})</span></div>
              ))}
            </div>
          )}

          {equipmentList.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Equipment</div>
              {equipmentList.map((eq, i) => (
                <div key={`${eq.id}-${i}`} style={styles.subLine}>
                  <span style={{ ...styles.dot, background: eq.statusColor }} />{eq.name || 'Equipment'}
                </div>
              ))}
            </div>
          )}

          {job.notes && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Site Notes</div>
              <p style={styles.notes}>{job.notes}</p>
            </div>
          )}

          {otherJobs.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Crew&apos;s Other Active Jobs</div>
              {otherJobs.map(j => (
                <button key={j.id} style={styles.otherJob} onClick={() => onSelectJob(j)}>
                  {j.name} <span style={styles.dim}>({j.start_date || '?'} → {j.end_date || '?'})</span>
                </button>
              ))}
            </div>
          )}

          <div style={styles.actions}>
            <button style={shared.btnSecondary} onClick={() => onEdit(job)}>Edit</button>
            <button style={shared.btnSecondary} onClick={() => onStatusChange(job, next.action)}>{next.label}</button>
            <button style={shared.btnSecondary} onClick={() => onRainDay(job)}>Rain Day</button>
            <button style={shared.btnDanger} onClick={() => onDelete(job)}>Delete</button>
          </div>
          <div style={styles.closeRow}>
            <button style={shared.btnSecondary} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'flex-end', zIndex: 400 },
  panel: { display: 'flex', width: '440px', maxWidth: '100%', background: COLORS.cardBg, height: '100%', overflowY: 'auto' },
  accent: { width: '4px', flexShrink: 0 },
  body: { padding: '1.5rem', flex: 1 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' },
  title: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 },
  meta: { fontFamily: FONT_MONO, fontSize: '0.75rem', color: COLORS.mid, marginBottom: '1rem' },
  line: { fontSize: '0.85rem', color: '#ccc', margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  link: { color: COLORS.yellow, textDecoration: 'none' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  section: { marginTop: '1.1rem', paddingTop: '1rem', borderTop: `1px solid ${COLORS.border}` },
  sectionTitle: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.yellow, marginBottom: '0.5rem' },
  subLine: { fontSize: '0.82rem', color: '#ccc', margin: '0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  dim: { color: '#666', fontSize: '0.78rem' },
  notes: { fontSize: '0.85rem', color: '#999', margin: 0, fontStyle: 'italic' },
  otherJob: { display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: COLORS.yellow, fontSize: '0.82rem', padding: '0.3rem 0', cursor: 'pointer' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${COLORS.border}` },
  closeRow: { marginTop: '0.75rem' },
}
