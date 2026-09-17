'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, shared } from '../../../lib/theme'

const EMPTY_FORM = {
  name: '', address: '', city: '', client_name: '', client_phone: '', client_email: '',
  start_date: '', end_date: '', crew_id: '', notes: '', status: 'notstarted', equipment_ids: [],
}

const COLUMNS = [
  { key: 'notstarted', label: 'Not Started', color: '#444', droppable: true },
  { key: 'inprogress', label: 'In Progress', color: COLORS.green, droppable: true },
  { key: 'overdue', label: 'Overdue', color: COLORS.red, droppable: false },
  { key: 'complete', label: 'Complete', color: COLORS.greenDark, droppable: true },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function displayStatus(job) {
  if (job.status === 'complete') return 'complete'
  const t = todayStr()
  if (job.end_date && job.end_date < t) return 'overdue'
  if (job.start_date && job.end_date && job.start_date <= t && t <= job.end_date) return 'inprogress'
  return job.status === 'inprogress' ? 'inprogress' : 'notstarted'
}

function dateRangeLabel(job) {
  if (!job.start_date && !job.end_date) return 'Unscheduled'
  if (job.start_date === job.end_date) return job.start_date
  return `${job.start_date || '?'} → ${job.end_date || '?'}`
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [crews, setCrews] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [draggingId, setDraggingId] = useState(null)

  async function loadAll() {
    const [jobsRes, crewsRes, equipmentRes] = await Promise.all([
      apiGet('/api/jobs'), apiGet('/api/crews'), apiGet('/api/equipment'),
    ])
    if (jobsRes.error) setError(jobsRes.error)
    else setJobs(jobsRes.jobs || [])
    setCrews(crewsRes.crews || [])
    setEquipment(equipmentRes.equipment || [])
    setLoading(false)
  }

  // loadAll sets state after an await, not synchronously; the lint rule can't
  // trace through the async call and flags this legitimate fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll() }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const toggleEquipment = (id) => {
    setFormData(f => ({
      ...f,
      equipment_ids: f.equipment_ids.includes(id)
        ? f.equipment_ids.filter(e => e !== id)
        : [...f.equipment_ids, id],
    }))
  }

  const openAddForm = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setShowModal(true)
  }

  const openEditForm = (job) => {
    setEditingId(job.id)
    setFormData({
      name: job.name || '',
      address: job.address || '',
      city: job.city || '',
      client_name: job.client_name || '',
      client_phone: job.client_phone || '',
      client_email: job.client_email || '',
      start_date: job.start_date || '',
      end_date: job.end_date || '',
      crew_id: job.crew_id || '',
      notes: job.notes || '',
      status: job.status || 'notstarted',
      equipment_ids: (job.job_equipment || []).map(je => je.equipment_id),
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = { ...formData, crew_id: formData.crew_id || null }
    const res = editingId
      ? await apiPatch('/api/jobs', { id: editingId, ...payload })
      : await apiPost('/api/jobs', payload)

    if (res.error) {
      setError(res.error)
      setSaving(false)
      return
    }

    setSaving(false)
    closeModal()
    await loadAll()
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this job?')) return
    const res = await apiDelete('/api/jobs', { id })
    if (res.error) { setError(res.error); return }
    await loadAll()
  }

  const handleDrop = async (columnKey) => {
    if (!draggingId) return
    const column = COLUMNS.find(c => c.key === columnKey)
    if (!column?.droppable) { setDraggingId(null); return }
    setDraggingId(null)
    const res = await apiPatch('/api/jobs', { id: draggingId, status: columnKey })
    if (res.error) { setError(res.error); return }
    await loadAll()
  }

  if (loading) return <div style={shared.loading}>Loading...</div>

  const byColumn = Object.fromEntries(COLUMNS.map(c => [c.key, []]))
  for (const job of jobs) byColumn[displayStatus(job)].push(job)

  return (
    <div style={styles.page}>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Jobs</h2>
        <button style={shared.btnPrimary} onClick={openAddForm}>+ New Job</button>
      </div>

      {error && <div style={shared.errorBox}>{error}</div>}

      <div style={styles.board}>
        {COLUMNS.map(col => (
          <div
            key={col.key}
            style={styles.column}
            onDragOver={col.droppable ? (e) => e.preventDefault() : undefined}
            onDrop={col.droppable ? () => handleDrop(col.key) : undefined}
          >
            <div style={{ ...styles.columnHeader, borderTopColor: col.color }}>
              <span style={styles.columnTitle}>{col.label}</span>
              <span style={styles.columnCount}>{byColumn[col.key].length}</span>
            </div>
            <div style={styles.columnBody}>
              {byColumn[col.key].length === 0 && <div style={styles.columnEmpty}>No jobs</div>}
              {byColumn[col.key].map(job => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={() => setDraggingId(job.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => openEditForm(job)}
                  style={{
                    ...shared.card, ...styles.jobCard,
                    borderLeft: `3px solid ${job.crew?.color || COLORS.yellow}`,
                    opacity: draggingId === job.id ? 0.4 : 1,
                  }}
                >
                  <div style={styles.jobName}>{job.name}</div>
                  <div style={styles.jobMeta}>{dateRangeLabel(job)}</div>
                  {job.address && <div style={styles.jobMeta}>{job.address}</div>}
                  {job.client_name && <div style={styles.jobMeta}>{job.client_name}</div>}
                  <div style={styles.jobCrew}>
                    {job.crew
                      ? <><span style={{ ...styles.dot, background: job.crew.color || COLORS.yellow }} />{job.crew.name}</>
                      : 'No crew assigned'}
                  </div>
                  {job.job_equipment?.length > 0 && (
                    <div style={styles.jobEquip}>
                      {job.job_equipment.map(je => je.equipment?.name).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={styles.overlay} onClick={closeModal}>
          <form style={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3 style={styles.modalTitle}>{editingId ? 'Edit Job' : 'New Job'}</h3>

            <div style={shared.group}>
              <label style={shared.label}>Job Name</label>
              <input style={shared.input} name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div style={shared.formRow}>
              <div style={shared.group}>
                <label style={shared.label}>Start Date</label>
                <input style={shared.input} name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
              </div>
              <div style={shared.group}>
                <label style={shared.label}>End Date</label>
                <input style={shared.input} name="end_date" type="date" value={formData.end_date} onChange={handleChange} />
              </div>
            </div>

            <div style={shared.formRow}>
              <div style={shared.group}>
                <label style={shared.label}>Address</label>
                <input style={shared.input} name="address" value={formData.address} onChange={handleChange} />
              </div>
              <div style={shared.group}>
                <label style={shared.label}>City</label>
                <input style={shared.input} name="city" value={formData.city} onChange={handleChange} />
              </div>
            </div>

            <div style={shared.formRow}>
              <div style={shared.group}>
                <label style={shared.label}>Client Name</label>
                <input style={shared.input} name="client_name" value={formData.client_name} onChange={handleChange} />
              </div>
              <div style={shared.group}>
                <label style={shared.label}>Client Phone</label>
                <input style={shared.input} name="client_phone" value={formData.client_phone} onChange={handleChange} />
              </div>
            </div>

            <div style={shared.group}>
              <label style={shared.label}>Client Email</label>
              <input style={shared.input} name="client_email" type="email" value={formData.client_email} onChange={handleChange} />
            </div>

            <div style={shared.formRow}>
              <div style={shared.group}>
                <label style={shared.label}>Crew</label>
                <select style={shared.select} name="crew_id" value={formData.crew_id} onChange={handleChange}>
                  <option value="">— No crew —</option>
                  {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={shared.group}>
                <label style={shared.label}>Status</label>
                <select style={shared.select} name="status" value={formData.status} onChange={handleChange}>
                  <option value="notstarted">Not Started</option>
                  <option value="inprogress">In Progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
            </div>

            <div style={shared.group}>
              <label style={shared.label}>Equipment</label>
              <div style={styles.equipList}>
                {equipment.length === 0 && <div style={styles.equipEmpty}>No equipment on file</div>}
                {equipment.map(item => (
                  <label key={item.id} style={styles.equipRow}>
                    <input
                      type="checkbox"
                      checked={formData.equipment_ids.includes(item.id)}
                      onChange={() => toggleEquipment(item.id)}
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>

            <div style={shared.group}>
              <label style={shared.label}>Notes</label>
              <textarea style={shared.textarea} name="notes" value={formData.notes} onChange={handleChange} rows={3} />
            </div>

            {error && <div style={shared.errorBox}>{error}</div>}

            <div style={styles.modalActions}>
              {editingId && (
                <button type="button" style={shared.btnDanger} onClick={() => handleDelete(editingId)}>Delete</button>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" style={shared.btnSecondary} onClick={closeModal}>Cancel</button>
              <button type="submit" style={shared.btnPrimary} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100%' },
  board: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))', gap: '1rem', overflowX: 'auto' },
  column: { display: 'flex', flexDirection: 'column', minWidth: 0, background: COLORS.panelBg, border: `1px solid ${COLORS.border}` },
  columnHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderTop: '3px solid', background: '#131313' },
  columnTitle: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#ccc' },
  columnCount: { fontFamily: FONT_MONO, fontSize: '0.7rem', color: COLORS.mid },
  columnBody: { flex: 1, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '200px' },
  columnEmpty: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#3a3a3a', textAlign: 'center', padding: '1.5rem 0' },
  jobCard: { padding: '0.65rem 0.75rem', cursor: 'pointer' },
  jobName: { fontFamily: FONT_COND, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' },
  jobMeta: { fontFamily: FONT_MONO, fontSize: '0.65rem', color: COLORS.mid, marginTop: '1px' },
  jobCrew: { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#aaa', marginTop: '0.4rem' },
  jobEquip: { fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '3rem 1rem', zIndex: 300 },
  modal: { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.yellow}`, padding: '1.75rem', width: '100%', maxWidth: '560px' },
  modalTitle: { fontFamily: FONT_COND, fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${COLORS.border}` },
  modalActions: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: `1px solid ${COLORS.border}` },
  equipList: { display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '160px', overflowY: 'auto', border: '1px solid #333', padding: '0.6rem 0.75rem' },
  equipRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' },
  equipEmpty: { color: '#555', fontSize: '0.8rem' },
}
