'use client'

import { useState } from 'react'
import { COLORS, FONT_COND, shared } from '../../../lib/theme'
import { Spinner } from '../ui'

function Shell({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

export function RainDayModal({ saving, onClose, onConfirm }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  return (
    <Shell title="Rain day" onClose={onClose}>
      <p style={styles.desc}>Every active job scheduled on this date gets its end date pushed back one work day.</p>
      <div style={shared.group}>
        <label style={shared.label}>Date</label>
        <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={styles.actions}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={saving} onClick={() => onConfirm(date)}>
          {saving && <Spinner />}
          {saving ? 'Applying…' : 'Apply rain day'}
        </button>
      </div>
    </Shell>
  )
}

export function WorkDayModal({ saving, onClose, onConfirm }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [type, setType] = useState('workday')
  return (
    <Shell title="Work / holiday day" onClose={onClose}>
      <p style={styles.desc}>Mark a weekend or holiday as a working day, or mark a weekday as off. Job end dates recalculate automatically.</p>
      <div style={shared.group}>
        <label style={shared.label}>Date</label>
        <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={shared.group}>
        <label style={shared.label}>Mark as</label>
        <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="workday">Working day</option>
          <option value="holiday">Day off / holiday</option>
        </select>
      </div>
      <div style={styles.actions}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={saving} onClick={() => onConfirm(date, type)}>
          {saving && <Spinner />}
          {saving ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </Shell>
  )
}

const styles = {
  overlay: { alignItems: 'center', justifyContent: 'center' },
  modal: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '24px', width: '100%', maxWidth: '380px' },
  title: { fontFamily: FONT_COND, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', color: COLORS.textPrimary },
  desc: { color: COLORS.textSecondary, fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '16px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
}
