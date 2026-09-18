'use client'

import { useState } from 'react'
import { COLORS, FONT_MONO, RADIUS, shared } from '../../../lib/theme'
import { Spinner } from '../ui'

export default function QuickCreatePopover({ date, crews, onClose, onCreate, saving }) {
  const [name, setName] = useState('')
  const [crewId, setCrewId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate({ name: name.trim(), crew_id: crewId || null, start_date: date, end_date: date })
  }

  return (
    <div className="modal-backdrop" style={styles.overlay} onClick={onClose}>
      <form className="modal-panel" style={styles.popover} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={styles.title}>New job — {date}</div>
        <input
          className="field"
          placeholder="Job name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        <select className="field" style={{ marginTop: '10px' }} value={crewId} onChange={(e) => setCrewId(e.target.value)}>
          <option value="">— No crew —</option>
          {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <Spinner />}
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  overlay: { alignItems: 'center', justifyContent: 'center' },
  popover: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '20px', width: '280px' },
  title: { fontFamily: FONT_MONO, fontSize: '0.68rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: '12px' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
}
