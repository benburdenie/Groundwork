'use client'

import { useState } from 'react'
import { COLORS, FONT_COND, shared } from '../../../lib/theme'
import { Spinner } from '../ui'

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
    <div className="modal-backdrop" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>Assign {equipmentName} to {job.name}</h3>

        {mode !== 'pick' && (
          <div style={styles.options}>
            <button className="btn btn-secondary" disabled={!job.crew_id || saving} onClick={onPermanent}>
              Permanent{!job.crew_id ? ' (needs a crew)' : ''}
            </button>
            <button className="btn btn-secondary" disabled={!job.start_date || !job.end_date || saving} onClick={onThisJob}>
              This job
            </button>
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
  title: { fontFamily: FONT_COND, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '18px', color: COLORS.textPrimary },
  options: { display: 'flex', flexDirection: 'column', gap: '8px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
}
