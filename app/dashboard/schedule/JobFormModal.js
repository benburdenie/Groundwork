'use client'

import { useEffect, useState } from 'react'
import { COLORS, FONT_COND, RADIUS, shared } from '../../../lib/theme'
import { computeEndDate, countWorkDays } from '../../../lib/workdays'
import { checkJobConflicts } from '../../../lib/conflicts'
import { Spinner } from '../ui'

function emptyForm(defaults = {}) {
  return {
    name: '', address: '', city: '', client_name: '', client_phone: '', client_email: '',
    start_date: '', end_date: '', duration: '', crew_id: '', notes: '', status: 'notstarted',
    equipment_ids: [],
    ...defaults,
  }
}

export default function JobFormModal({ editingJob, crews, equipment, jobs, availability, bookings, workSchedule, saving, onClose, onSubmit, onDelete }) {
  const [formData, setFormData] = useState(() => editingJob ? formFromJob(editingJob) : emptyForm())
  const [conflicts, setConflicts] = useState([])

  useEffect(() => {
    setFormData(editingJob ? formFromJob(editingJob) : emptyForm())
  }, [editingJob])

  useEffect(() => {
    const equipmentNames = new Map(equipment.map(e => [e.id, e.name]))
    setConflicts(checkJobConflicts({
      jobId: editingJob?.id || null,
      crewId: formData.crew_id || null,
      equipmentIds: formData.equipment_ids,
      startDate: formData.start_date,
      endDate: formData.end_date,
      jobs, availability,
      bookings: { list: bookings, equipmentNames },
    }))
  }, [formData.crew_id, formData.equipment_ids, formData.start_date, formData.end_date, jobs, availability, bookings, equipment, editingJob])

  function formFromJob(job) {
    return {
      name: job.name || '', address: job.address || '', city: job.city || '',
      client_name: job.client_name || '', client_phone: job.client_phone || '', client_email: job.client_email || '',
      start_date: job.start_date || '', end_date: job.end_date || '',
      duration: job.duration_days || '', crew_id: job.crew_id || '', notes: job.notes || '',
      status: job.status || 'notstarted',
      equipment_ids: (job.job_equipment || []).map(je => je.equipment_id),
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(f => {
      const next = { ...f, [name]: value }
      if (name === 'duration') {
        const n = parseInt(value, 10)
        if (f.start_date && n > 0) next.end_date = computeEndDate(f.start_date, n, workSchedule)
      } else if (name === 'end_date') {
        const days = countWorkDays(f.start_date, value, workSchedule)
        if (days) next.duration = days
      } else if (name === 'start_date') {
        const n = parseInt(f.duration, 10)
        if (value && n > 0) next.end_date = computeEndDate(value, n, workSchedule)
      }
      return next
    })
  }

  const toggleEquipment = (id) => {
    setFormData(f => ({
      ...f,
      equipment_ids: f.equipment_ids.includes(id) ? f.equipment_ids.filter(e => e !== id) : [...f.equipment_ids, id],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (conflicts.length > 0) return
    const { duration, ...rest } = formData
    onSubmit({ ...rest, crew_id: rest.crew_id || null, duration_days: duration ? parseInt(duration, 10) : null })
  }

  const crewConflicts = conflicts.filter(c => c.field === 'crew')
  const equipmentConflicts = conflicts.filter(c => c.field === 'equipment')

  return (
    <div className="modal-backdrop" style={styles.overlay} onClick={onClose}>
      <form className="modal-panel" style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 style={styles.modalTitle}>{editingJob ? 'Edit job' : 'New job'}</h3>

        <div style={shared.group}>
          <label style={shared.label}>Job name</label>
          <input className="field" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div style={shared.formRow}>
          <div style={shared.group}>
            <label style={shared.label}>Start date</label>
            <input className="field" name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
          </div>
          <div style={shared.group}>
            <label style={shared.label}>Duration (work days)</label>
            <input className="field" name="duration" type="number" min="1" value={formData.duration} onChange={handleChange} />
          </div>
        </div>

        <div style={shared.group}>
          <label style={shared.label}>End date</label>
          <input className="field" name="end_date" type="date" value={formData.end_date} onChange={handleChange} />
        </div>

        <div style={shared.formRow}>
          <div style={shared.group}>
            <label style={shared.label}>Address</label>
            <input className="field" name="address" value={formData.address} onChange={handleChange} />
          </div>
          <div style={shared.group}>
            <label style={shared.label}>City</label>
            <input className="field" name="city" value={formData.city} onChange={handleChange} />
          </div>
        </div>

        <div style={shared.formRow}>
          <div style={shared.group}>
            <label style={shared.label}>Client name</label>
            <input className="field" name="client_name" value={formData.client_name} onChange={handleChange} />
          </div>
          <div style={shared.group}>
            <label style={shared.label}>Client phone</label>
            <input className="field" name="client_phone" value={formData.client_phone} onChange={handleChange} />
          </div>
        </div>

        <div style={shared.formRow}>
          <div style={shared.group}>
            <label style={shared.label}>Crew</label>
            <select className={`field${crewConflicts.length ? ' field-error' : ''}`} name="crew_id" value={formData.crew_id} onChange={handleChange}>
              <option value="">— No crew —</option>
              {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {crewConflicts.map((c, i) => <div key={i} style={shared.fieldError}>{c.message}</div>)}
          </div>
          <div style={shared.group}>
            <label style={shared.label}>Status</label>
            <select className="field" name="status" value={formData.status} onChange={handleChange}>
              <option value="notstarted">Not started</option>
              <option value="inprogress">In progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>

        <div style={shared.group}>
          <label style={shared.label}>Equipment</label>
          <div style={{ ...styles.equipList, ...(equipmentConflicts.length ? styles.equipListError : {}) }}>
            {equipment.length === 0 && <div style={styles.equipEmpty}>No equipment on file</div>}
            {equipment.map(item => (
              <label key={item.id} style={styles.equipRow}>
                <input type="checkbox" checked={formData.equipment_ids.includes(item.id)} onChange={() => toggleEquipment(item.id)} />
                {item.name}
              </label>
            ))}
          </div>
          {equipmentConflicts.map((c, i) => <div key={i} style={shared.fieldError}>{c.message}</div>)}
        </div>

        <div style={shared.group}>
          <label style={shared.label}>Notes</label>
          <textarea className="field" name="notes" value={formData.notes} onChange={handleChange} rows={3} />
        </div>

        <div style={styles.modalActions}>
          {editingJob && <button type="button" className="btn btn-danger" onClick={() => onDelete(editingJob)}>Delete</button>}
          <div style={{ flex: 1 }} />
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || conflicts.length > 0}>
            {saving && <Spinner />}
            {saving ? 'Saving…' : editingJob ? 'Save changes' : 'Create job'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  overlay: { alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto' },
  modal: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '28px', width: '100%', maxWidth: '560px', margin: '3rem 1rem' },
  modalTitle: { fontFamily: FONT_COND, fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${COLORS.borderSubtle}`, color: COLORS.textPrimary },
  modalActions: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${COLORS.borderSubtle}` },
  equipList: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS, padding: '10px 14px' },
  equipListError: { borderColor: COLORS.danger },
  equipRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: COLORS.textPrimary, cursor: 'pointer' },
  equipEmpty: { color: COLORS.textMuted, fontSize: '0.8rem' },
}
