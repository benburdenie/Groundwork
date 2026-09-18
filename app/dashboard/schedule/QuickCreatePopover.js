'use client'

import { useState } from 'react'
import { COLORS, FONT_MONO, shared } from '../../../lib/theme'

export default function QuickCreatePopover({ date, crews, onClose, onCreate, saving }) {
  const [name, setName] = useState('')
  const [crewId, setCrewId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({ name: name.trim(), crew_id: crewId || null, start_date: date, end_date: date })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <form style={styles.popover} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={styles.title}>New job — {date}</div>
        <input
          style={shared.input}
          placeholder="Job name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <select style={{ ...shared.select, marginTop: '0.6rem' }} value={crewId} onChange={(e) => setCrewId(e.target.value)}>
          <option value="">— No crew —</option>
          {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={styles.actions}>
          <button type="button" style={shared.btnSecondary} onClick={onClose}>Cancel</button>
          <button type="submit" style={shared.btnPrimary} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 350 },
  popover: { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.yellow}`, padding: '1.25rem', width: '280px' },
  title: { fontFamily: FONT_MONO, fontSize: '0.68rem', letterSpacing: '1px', textTransform: 'uppercase', color: COLORS.mid, marginBottom: '0.75rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.9rem' },
}
