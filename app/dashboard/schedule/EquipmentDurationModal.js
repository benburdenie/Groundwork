'use client'

import { useState } from 'react'
import { COLORS, FONT_COND, FONT_MONO, shared } from '../../../lib/theme'

export default function EquipmentDurationModal({ job, equipmentId, equipmentName, saving, onClose, onPermanent, onThisJob, onPickDates }) {
  const [mode, setMode] = useState(null)
  const [start, setStart] = useState(job.start_date || '')
  const [end, setEnd] = useState(job.end_date || '')

  const handlePickDatesSubmit = (e) => {
    e.preventDefault()
    if (!start || !end) return
    onPickDates(start, end)
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>Assign {equipmentName} to {job.name}</h3>

        {mode !== 'pick' && (
          <div style={styles.options}>
            <button style={shared.btnSecondary} disabled={!job.crew_id || saving} onClick={onPermanent}>
              Permanent{!job.crew_id ? ' (needs a crew)' : ''}
            </button>
            <button style={shared.btnSecondary} disabled={!job.start_date || !job.end_date || saving} onClick={onThisJob}>
              This Job
            </button>
            <button style={shared.btnSecondary} onClick={() => setMode('pick')}>Pick Dates</button>
          </div>
        )}

        {mode === 'pick' && (
          <form onSubmit={handlePickDatesSubmit}>
            <div style={shared.formRow}>
              <div style={shared.group}>
                <label style={shared.label}>Start Date</label>
                <input style={shared.input} type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
              </div>
              <div style={shared.group}>
                <label style={shared.label}>End Date</label>
                <input style={shared.input} type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
              </div>
            </div>
            <div style={styles.actions}>
              <button type="button" style={shared.btnSecondary} onClick={() => setMode(null)}>Back</button>
              <button type="submit" style={shared.btnPrimary} disabled={saving}>{saving ? 'Saving...' : 'Book Equipment'}</button>
            </div>
          </form>
        )}

        <div style={styles.actions}>
          <button style={shared.btnSecondary} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 },
  modal: { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.yellow}`, padding: '1.5rem', width: '100%', maxWidth: '400px' },
  title: { fontFamily: FONT_COND, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1.1rem' },
  options: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
}
