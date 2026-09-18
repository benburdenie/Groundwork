'use client'

import { useState } from 'react'
import { apiPost, apiDelete } from '../../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, shared, STATUS_LABELS, badgeStyle } from '../../../lib/theme'

function displayStatus(job) {
  if (job.status === 'complete') return 'complete'
  const t = new Date().toISOString().slice(0, 10)
  if (job.end_date && job.end_date < t) return 'overdue'
  if (job.start_date && job.end_date && job.start_date <= t && t <= job.end_date) return 'inprogress'
  return job.status === 'inprogress' ? 'inprogress' : 'notstarted'
}

export default function CrewPanel({ crew, workers, jobs, equipment, onClose, onRefresh }) {
  const [busy, setBusy] = useState(false)
  const [addEquipId, setAddEquipId] = useState('')
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')

  if (!crew) return null
  const color = crew.color || COLORS.yellow
  const crewWorkers = (workers || []).filter(w => w.crew_id === crew.id)
  const crewJobs = (jobs || []).filter(j => j.crew_id === crew.id)
  const permEquipment = crew.perm_equipment_assignments || []
  const blocks = crew.crew_availability || []
  const assignedEquipmentIds = new Set(permEquipment.map(pe => pe.equipment_id))
  const availableEquipment = (equipment || []).filter(e => !assignedEquipmentIds.has(e.id))

  const addPermEquipment = async () => {
    if (!addEquipId) return
    setBusy(true)
    await apiPost('/api/perm-equipment', { crew_id: crew.id, equipment_id: addEquipId })
    setBusy(false)
    setAddEquipId('')
    onRefresh()
  }

  const removePermEquipment = async (equipmentId) => {
    setBusy(true)
    await apiDelete('/api/perm-equipment', { equipment_id: equipmentId })
    setBusy(false)
    onRefresh()
  }

  const addBlock = async (e) => {
    e.preventDefault()
    if (!blockStart || !blockEnd) return
    setBusy(true)
    await apiPost('/api/crew-availability', { crew_id: crew.id, start_date: blockStart, end_date: blockEnd, reason: blockReason || null })
    setBusy(false)
    setBlockStart(''); setBlockEnd(''); setBlockReason('')
    onRefresh()
  }

  const removeBlock = async (id) => {
    setBusy(true)
    await apiDelete('/api/crew-availability', { id })
    setBusy(false)
    onRefresh()
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...styles.accent, background: color }} />
        <div style={styles.body}>
          <h3 style={styles.title}>{crew.name}</h3>
          {crew.foreman_name && <p style={styles.meta}>Foreman: {crew.foreman_name}</p>}

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Workers</div>
            {crewWorkers.length === 0 && <p style={styles.empty}>No workers assigned</p>}
            {crewWorkers.map(w => (
              <div key={w.id} style={styles.subLine}>{w.name} <span style={styles.dim}>({w.role})</span></div>
            ))}
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Permanent Equipment</div>
            {permEquipment.length === 0 && <p style={styles.empty}>None assigned</p>}
            {permEquipment.map(pe => (
              <div key={pe.equipment_id} style={styles.rowBetween}>
                <span style={styles.subLine}>{pe.equipment?.name || 'Equipment'}</span>
                <button style={shared.btnDanger} disabled={busy} onClick={() => removePermEquipment(pe.equipment_id)}>Remove</button>
              </div>
            ))}
            <div style={styles.addRow}>
              <select style={shared.select} value={addEquipId} onChange={(e) => setAddEquipId(e.target.value)}>
                <option value="">— Select equipment —</option>
                {availableEquipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <button style={shared.btnSecondary} disabled={busy || !addEquipId} onClick={addPermEquipment}>Add</button>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Availability Blocks</div>
            {blocks.length === 0 && <p style={styles.empty}>No blocked dates</p>}
            {blocks.map(b => (
              <div key={b.id} style={styles.rowBetween}>
                <span style={styles.subLine}>{b.start_date} → {b.end_date}{b.reason ? ` — ${b.reason}` : ''}</span>
                <button style={shared.btnDanger} disabled={busy} onClick={() => removeBlock(b.id)}>Remove</button>
              </div>
            ))}
            <form onSubmit={addBlock} style={styles.blockForm}>
              <div style={shared.formRow}>
                <input style={shared.input} type="date" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} required />
                <input style={shared.input} type="date" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} required />
              </div>
              <input style={{ ...shared.input, marginTop: '0.5rem' }} placeholder="Reason (optional)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
              <button type="submit" style={{ ...shared.btnSecondary, marginTop: '0.5rem' }} disabled={busy}>Block Dates</button>
            </form>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Job History</div>
            {crewJobs.length === 0 && <p style={styles.empty}>No jobs yet</p>}
            {crewJobs.map(j => (
              <div key={j.id} style={styles.rowBetween}>
                <span style={styles.subLine}>{j.name} <span style={styles.dim}>({j.start_date || '?'} → {j.end_date || '?'})</span></span>
                <span style={badgeStyle(displayStatus(j))}>{STATUS_LABELS[displayStatus(j)]}</span>
              </div>
            ))}
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
  title: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 },
  meta: { fontFamily: FONT_MONO, fontSize: '0.78rem', color: COLORS.mid, marginTop: '0.3rem' },
  section: { marginTop: '1.1rem', paddingTop: '1rem', borderTop: `1px solid ${COLORS.border}` },
  sectionTitle: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.yellow, marginBottom: '0.5rem' },
  subLine: { fontSize: '0.82rem', color: '#ccc' },
  dim: { color: '#666', fontSize: '0.78rem' },
  empty: { color: '#555', fontSize: '0.8rem', margin: 0 },
  rowBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', margin: '0.35rem 0' },
  addRow: { display: 'flex', gap: '0.5rem', marginTop: '0.6rem' },
  blockForm: { marginTop: '0.75rem' },
  closeRow: { marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${COLORS.border}` },
}
