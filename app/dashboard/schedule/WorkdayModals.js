'use client'

import { useState } from 'react'
import { COLORS, FONT_COND, shared } from '../../../lib/theme'

function Shell({ title, children, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

export function RainDayModal({ saving, onClose, onConfirm }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  return (
    <Shell title="Rain Day" onClose={onClose}>
      <p style={styles.desc}>Every active job scheduled on this date gets its end date pushed back one work day.</p>
      <div style={shared.group}>
        <label style={shared.label}>Date</label>
        <input style={shared.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={styles.actions}>
        <button style={shared.btnSecondary} onClick={onClose}>Cancel</button>
        <button style={shared.btnPrimary} disabled={saving} onClick={() => onConfirm(date)}>{saving ? 'Applying...' : 'Apply Rain Day'}</button>
      </div>
    </Shell>
  )
}

export function WorkDayModal({ saving, onClose, onConfirm }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [type, setType] = useState('workday')
  return (
    <Shell title="Work / Holiday Day" onClose={onClose}>
      <p style={styles.desc}>Mark a weekend or holiday as a working day, or mark a weekday as off. Job end dates recalculate automatically.</p>
      <div style={shared.group}>
        <label style={shared.label}>Date</label>
        <input style={shared.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={shared.group}>
        <label style={shared.label}>Mark as</label>
        <select style={shared.select} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="workday">Working Day</option>
          <option value="holiday">Day Off / Holiday</option>
        </select>
      </div>
      <div style={styles.actions}>
        <button style={shared.btnSecondary} onClick={onClose}>Cancel</button>
        <button style={shared.btnPrimary} disabled={saving} onClick={() => onConfirm(date, type)}>{saving ? 'Applying...' : 'Apply'}</button>
      </div>
    </Shell>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 },
  modal: { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.yellow}`, padding: '1.5rem', width: '100%', maxWidth: '380px' },
  title: { fontFamily: FONT_COND, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' },
  desc: { color: '#999', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
}
