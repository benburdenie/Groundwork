'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, CREW_COLORS, shared } from '../../../lib/theme'
import CrewPanel from './CrewPanel'

const EMPTY_FORM = { name: '', foreman_name: '', color: CREW_COLORS[0], notes: '' }

export default function CrewsPage() {
  return (
    <Suspense fallback={<div style={shared.loading}>Loading...</div>}>
      <CrewsContent />
    </Suspense>
  )
}

function CrewsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [crews, setCrews] = useState([])
  const [workers, setWorkers] = useState([])
  const [jobs, setJobs] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [viewingCrew, setViewingCrew] = useState(null)

  async function loadAll() {
    const [crewsRes, workersRes, jobsRes, equipmentRes] = await Promise.all([
      apiGet('/api/crews'), apiGet('/api/workers'), apiGet('/api/jobs'), apiGet('/api/equipment'),
    ])
    if (crewsRes.error) setError(crewsRes.error)
    else setCrews(crewsRes.crews || [])
    setWorkers(workersRes.workers || [])
    setJobs(jobsRes.jobs || [])
    setEquipment(equipmentRes.equipment || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const crewId = searchParams.get('crew')
    if (crewId && crews.length > 0) {
      const crew = crews.find(c => c.id === crewId)
      if (crew) setViewingCrew(crew)
      router.replace('/dashboard/crews')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, crews])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const openAddForm = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (crew) => {
    setEditingId(crew.id)
    setFormData({
      name: crew.name || '',
      foreman_name: crew.foreman_name || '',
      color: crew.color || CREW_COLORS[0],
      notes: crew.notes || '',
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
      ? await apiPatch('/api/crews', { id: editingId, ...formData })
      : await apiPost('/api/crews', formData)

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
    if (!confirm('Remove this crew?')) return
    const res = await apiDelete('/api/crews', { id })
    if (res.error) { setError(res.error); return }
    await loadAll()
  }

  if (loading) return <div style={shared.loading}>Loading...</div>

  return (
    <div>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Crews</h2>
        <button style={shared.btnPrimary} onClick={() => (showForm ? closeForm() : openAddForm())}>
          {showForm ? 'Cancel' : '+ New Crew'}
        </button>
      </div>

      {error && <div style={shared.errorBox}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={shared.form}>
          <div style={shared.formRow}>
            <div style={shared.group}>
              <label style={shared.label}>Crew Name</label>
              <input style={shared.input} name="name" placeholder="e.g. Crew 1" value={formData.name} onChange={handleChange} required />
            </div>
            <div style={shared.group}>
              <label style={shared.label}>Foreman</label>
              <input style={shared.input} name="foreman_name" placeholder="Foreman name" value={formData.foreman_name} onChange={handleChange} />
            </div>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Color</label>
            <div style={styles.swatchRow}>
              {CREW_COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setFormData({ ...formData, color: c })}
                  style={{
                    ...styles.swatch,
                    background: c,
                    outline: formData.color === c ? '2px solid #fff' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Notes</label>
            <textarea style={shared.textarea} name="notes" placeholder="Optional notes about this crew" value={formData.notes} onChange={handleChange} rows={3} />
          </div>

          <button style={shared.btnPrimary} type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Crew'}
          </button>
        </form>
      )}

      {crews.length === 0 ? (
        <p style={shared.empty}>No crews yet. Add your first crew to get started.</p>
      ) : (
        <div style={styles.grid}>
          {crews.map(crew => {
            const permEquipment = crew.perm_equipment_assignments || []
            const availability = crew.crew_availability || []
            return (
              <div
                key={crew.id}
                style={{ ...shared.card, ...styles.crewCard, borderLeft: `4px solid ${crew.color || COLORS.yellow}`, cursor: 'pointer' }}
                onClick={() => setViewingCrew(crew)}
              >
                <div style={styles.cardHeader}>
                  <h3 style={styles.crewName}>{crew.name}</h3>
                  <div style={styles.actions} onClick={(e) => e.stopPropagation()}>
                    <button style={shared.btnSecondary} onClick={() => openEditForm(crew)}>Edit</button>
                    <button style={shared.btnDanger} onClick={() => handleDelete(crew.id)}>Remove</button>
                  </div>
                </div>
                {crew.foreman_name && <p style={styles.crewMeta}>Foreman: {crew.foreman_name}</p>}
                {permEquipment.length > 0 && (
                  <p style={styles.crewMeta}>
                    Perm. Equipment: {permEquipment.map(pe => pe.equipment?.name).filter(Boolean).join(', ')}
                  </p>
                )}
                {availability.length > 0 && (
                  <p style={styles.crewNotes}>
                    {availability.length} unavailability block{availability.length !== 1 ? 's' : ''} on file
                  </p>
                )}
                {crew.notes && <p style={styles.crewNotes}>{crew.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {viewingCrew && (
        <CrewPanel
          crew={crews.find(c => c.id === viewingCrew.id) || viewingCrew}
          workers={workers}
          jobs={jobs}
          equipment={equipment}
          onClose={() => setViewingCrew(null)}
          onRefresh={loadAll}
        />
      )}
    </div>
  )
}

const styles = {
  swatchRow: { display: 'flex', gap: '0.6rem' },
  swatch: { width: '28px', height: '28px', border: 'none', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' },
  crewCard: { padding: '1rem 1.25rem' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', gap: '0.5rem' },
  actions: { display: 'flex', gap: '0.4rem', flexShrink: 0 },
  crewName: { margin: 0, fontFamily: FONT_COND, fontWeight: 700, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  crewMeta: { color: COLORS.mid, fontSize: '0.82rem', margin: '0.3rem 0 0', fontFamily: FONT_MONO },
  crewNotes: { color: '#666', fontSize: '0.8rem', margin: '0.3rem 0 0' },
}
