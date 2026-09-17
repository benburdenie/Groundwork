'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, CREW_COLORS, shared } from '../../../lib/theme'

const EMPTY_FORM = { name: '', foreman_name: '', color: CREW_COLORS[0], notes: '' }

export default function CrewsPage() {
  const [crews, setCrews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  async function loadCrews() {
    const res = await apiGet('/api/crews')
    if (res.error) setError(res.error)
    else setCrews(res.crews || [])
    setLoading(false)
  }

  // loadCrews sets state after an await, not synchronously; the lint rule can't
  // trace through the async call and flags this legitimate fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadCrews() }, [])

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
    await loadCrews()
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this crew?')) return
    const res = await apiDelete('/api/crews', { id })
    if (res.error) { setError(res.error); return }
    await loadCrews()
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
              <div key={crew.id} style={{ ...shared.card, ...styles.crewCard, borderLeft: `4px solid ${crew.color || COLORS.yellow}` }}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.crewName}>{crew.name}</h3>
                  <div style={styles.actions}>
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
