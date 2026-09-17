'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, WORKER_ROLES, shared } from '../../../lib/theme'

const EMPTY_FORM = { name: '', role: WORKER_ROLES[WORKER_ROLES.length - 1], phone: '', email: '', crew_id: '', notes: '' }

export default function WorkersPage() {
  const [workers, setWorkers] = useState([])
  const [crews, setCrews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  async function loadAll() {
    const [workersRes, crewsRes] = await Promise.all([apiGet('/api/workers'), apiGet('/api/crews')])
    if (workersRes.error) setError(workersRes.error)
    else setWorkers(workersRes.workers || [])
    setCrews(crewsRes.crews || [])
    setLoading(false)
  }

  // loadAll sets state after an await, not synchronously; the lint rule can't
  // trace through the async call and flags this legitimate fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll() }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const openAddForm = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (worker) => {
    setEditingId(worker.id)
    setFormData({
      name: worker.name || '',
      role: worker.role || WORKER_ROLES[WORKER_ROLES.length - 1],
      phone: worker.phone || '',
      email: worker.email || '',
      crew_id: worker.crew_id || '',
      notes: worker.notes || '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = editingId
      ? await apiPatch('/api/workers', { id: editingId, ...formData })
      : await apiPost('/api/workers', formData)

    if (res.error) {
      setError(res.error)
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    await loadAll()
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this worker?')) return
    const res = await apiDelete('/api/workers', { id })
    if (res.error) { setError(res.error); return }
    await loadAll()
  }

  if (loading) return <div style={shared.loading}>Loading...</div>

  const grouped = new Map()
  for (const crew of crews) grouped.set(crew.id, { crew, workers: [] })
  const unassigned = []
  for (const w of workers) {
    if (w.crew_id && grouped.has(w.crew_id)) grouped.get(w.crew_id).workers.push(w)
    else unassigned.push(w)
  }

  return (
    <div>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Workers</h2>
        <button style={shared.btnPrimary} onClick={() => (showForm ? closeForm() : openAddForm())}>
          {showForm ? 'Cancel' : '+ New Worker'}
        </button>
      </div>

      {error && <div style={shared.errorBox}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={shared.form}>
          <div style={shared.formRow}>
            <div style={shared.group}>
              <label style={shared.label}>Name</label>
              <input style={shared.input} name="name" placeholder="Full name" value={formData.name} onChange={handleChange} required />
            </div>
            <div style={shared.group}>
              <label style={shared.label}>Role</label>
              <select style={shared.select} name="role" value={formData.role} onChange={handleChange}>
                {WORKER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div style={shared.formRow}>
            <div style={shared.group}>
              <label style={shared.label}>Phone</label>
              <input style={shared.input} name="phone" placeholder="Phone number" value={formData.phone} onChange={handleChange} />
            </div>
            <div style={shared.group}>
              <label style={shared.label}>Email</label>
              <input style={shared.input} name="email" type="email" placeholder="Email address" value={formData.email} onChange={handleChange} />
            </div>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Crew</label>
            <select style={shared.select} name="crew_id" value={formData.crew_id} onChange={handleChange}>
              <option value="">— Unassigned —</option>
              {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Notes</label>
            <textarea style={shared.textarea} name="notes" placeholder="Optional notes" value={formData.notes} onChange={handleChange} rows={3} />
          </div>

          <button style={shared.btnPrimary} type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Worker'}
          </button>
        </form>
      )}

      {workers.length === 0 ? (
        <p style={shared.empty}>No workers yet. Add your first worker to get started.</p>
      ) : (
        <div>
          {[...grouped.values()].map(({ crew, workers }) => workers.length > 0 && (
            <div key={crew.id} style={styles.section}>
              <h3 style={{ ...styles.sectionTitle, color: crew.color || COLORS.yellow }}>{crew.name}</h3>
              <div style={styles.list}>
                {workers.map(w => (
                  <WorkerRow key={w.id} worker={w} onEdit={openEditForm} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}

          {unassigned.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Unassigned</h3>
              <div style={styles.list}>
                {unassigned.map(w => (
                  <WorkerRow key={w.id} worker={w} onEdit={openEditForm} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WorkerRow({ worker, onEdit, onDelete }) {
  return (
    <div style={{ ...shared.card, ...styles.row }}>
      <div>
        <span style={styles.workerName}>{worker.name}</span>
        <span style={styles.workerRole}>{worker.role}</span>
        {worker.phone && <span style={styles.workerContact}>{worker.phone}</span>}
        {worker.email && <span style={styles.workerContact}>{worker.email}</span>}
      </div>
      <div style={styles.actions}>
        <button style={shared.btnSecondary} onClick={() => onEdit(worker)}>Edit</button>
        <button style={shared.btnDanger} onClick={() => onDelete(worker.id)}>Remove</button>
      </div>
    </div>
  )
}

const styles = {
  section: { marginBottom: '1.75rem' },
  sectionTitle: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', gap: '1rem', flexWrap: 'wrap' },
  workerName: { fontWeight: 700, fontSize: '0.95rem', marginRight: '0.75rem' },
  workerRole: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase', color: COLORS.mid, marginRight: '0.75rem' },
  workerContact: { fontFamily: FONT_MONO, fontSize: '0.72rem', color: '#666', marginRight: '0.75rem' },
  actions: { display: 'flex', gap: '0.4rem', flexShrink: 0 },
}
