'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { COLORS, FONT_COND, FONT_MONO, shared } from '../../../lib/theme'
import { rangesOverlap } from '../../../lib/workdays'
import { Spinner } from '../ui'

// Every current commitment for this equipment — a direct job assignment
// (job_equipment) or a dated booking (equipment_bookings) — excluding the job
// it's being dropped on right now (assigning it there isn't a conflict with
// itself). Used both for the "Available" / "Booked" status and to warn on
// whichever duration option would actually overlap.
function useCommitments(equipmentId, job, jobs, bookings) {
  return useMemo(() => {
    const fromJobs = (jobs || [])
      .filter(j => j.id !== job.id && j.status !== 'complete' && j.start_date && j.end_date)
      .filter(j => (j.job_equipment || []).some(je => je.equipment_id === equipmentId))
      .map(j => ({ jobName: j.name, start_date: j.start_date, end_date: j.end_date }))

    const fromBookings = (bookings || [])
      .filter(b => b.equipment_id === equipmentId && b.job_id !== job.id)
      .map(b => ({ jobName: b.job?.name || 'Another job', start_date: b.start_date, end_date: b.end_date }))

    return [...fromJobs, ...fromBookings]
  }, [equipmentId, job.id, jobs, bookings])
}

function overlapsAny(start, end, commitments) {
  if (!start || !end) return false
  return commitments.some(c => rangesOverlap(start, end, c.start_date, c.end_date))
}

export default function EquipmentDurationModal({ job, equipmentId, equipmentName, jobs, bookings, saving, onClose, onPermanent, onThisJob, onPickDates }) {
  const [mode, setMode] = useState(null)
  const [start, setStart] = useState(job.start_date || '')
  const [end, setEnd] = useState(job.end_date || '')

  const commitments = useCommitments(equipmentId, job, jobs, bookings)
  const thisJobConflicts = overlapsAny(job.start_date, job.end_date, commitments)
  const pickDatesConflicts = overlapsAny(start, end, commitments)

  const handlePickDatesSubmit = (e) => {
    e.preventDefault()
    if (!start || !end) return
    onPickDates(start, end)
  }

  return (
    <div className="modal-backdrop" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>Assign {equipmentName} to {job.name}</h3>

        <div style={styles.availability}>
          <div style={styles.availabilityHeader}>
            <span style={styles.availabilityLabel}>Current assignments</span>
            {commitments.length === 0
              ? <span style={styles.statusAvailable}>Available</span>
              : <span style={styles.statusBooked}>Booked</span>}
          </div>
          {commitments.length > 0 && (
            <div style={styles.commitmentList}>
              {commitments.map((c, i) => (
                <div key={i} style={styles.commitmentRow}>
                  <span style={styles.commitmentJob}>{c.jobName}</span>
                  <span style={styles.commitmentDates}>{c.start_date} → {c.end_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {mode !== 'pick' && (
          <div style={styles.options}>
            <button className="btn btn-secondary" disabled={!job.crew_id || saving} onClick={onPermanent}>
              Permanent{!job.crew_id ? ' (needs a crew)' : ''}
            </button>
            {commitments.length > 0 && (
              <div style={styles.warning}><AlertTriangle size={12} />Already has scheduled commitments above</div>
            )}

            <button className="btn btn-secondary" disabled={!job.start_date || !job.end_date || saving} onClick={onThisJob}>
              This job
            </button>
            {thisJobConflicts && (
              <div style={styles.warning}><AlertTriangle size={12} />Overlaps a booking above for {job.start_date} → {job.end_date}</div>
            )}

            <button className="btn btn-secondary" onClick={() => setMode('pick')}>Pick dates</button>
          </div>
        )}

        {mode === 'pick' && (
          <form onSubmit={handlePickDatesSubmit}>
            <div style={shared.formRow}>
              <div style={shared.group}>
                <label style={shared.label}>Start date</label>
                <input className="field" type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
              </div>
              <div style={shared.group}>
                <label style={shared.label}>End date</label>
                <input className="field" type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
              </div>
            </div>
            {pickDatesConflicts && (
              <div style={styles.warning}><AlertTriangle size={12} />Overlaps a booking above for these dates</div>
            )}
            <div style={styles.actions}>
              <button type="button" className="btn btn-secondary" onClick={() => setMode(null)}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <Spinner />}
                {saving ? 'Saving…' : 'Book equipment'}
              </button>
            </div>
          </form>
        )}

        <div style={styles.actions}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: { alignItems: 'center', justifyContent: 'center' },
  modal: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '24px', width: '100%', maxWidth: '400px' },
  title: { fontFamily: FONT_COND, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', color: COLORS.textPrimary },
  availability: { background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' },
  availabilityHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  availabilityLabel: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.textMuted },
  statusAvailable: { fontFamily: FONT_MONO, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.primary },
  statusBooked: { fontFamily: FONT_MONO, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.yellow },
  commitmentList: { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' },
  commitmentRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', fontSize: '0.78rem' },
  commitmentJob: { color: COLORS.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  commitmentDates: { fontFamily: FONT_MONO, fontSize: '0.68rem', color: COLORS.textSecondary, flexShrink: 0 },
  options: { display: 'flex', flexDirection: 'column', gap: '8px' },
  warning: { display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.danger, fontSize: '0.72rem', margin: '-2px 0 4px 2px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
}
