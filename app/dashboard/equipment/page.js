'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api'
import { COLORS, FONT_COND, EQUIPMENT_CATEGORIES, STATUS_LABELS, shared, badgeStyle } from '../../../lib/theme'

const EMPTY_FORM = { name: '', category: EQUIPMENT_CATEGORIES[0].value, status: 'available', notes: '' }

function categoryLabel(value) {
  return EQUIPMENT_CATEGORIES.find(c => c.value === value)?.label || value
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  async function loadEquipment() {
    const res = await apiGet('/api/equipment')
    if (res.error) setError(res.error)
    else setEquipment(res.equipment || [])
    setLoading(false)
  }

  // loadEquipment sets state after an await, not synchronously; the lint rule can't
  // trace through the async call and flags this legitimate fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEquipment() }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const openAddForm = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (item) => {
    setEditingId(item.id)
    setFormData({
      name: item.name || '',
      category: item.category || EQUIPMENT_CATEGORIES[0].value,
      status: item.status || 'available',
      notes: item.notes || '',
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
      ? await apiPatch('/api/equipment', { id: editingId, ...formData })
      : await apiPost('/api/equipment', formData)

    if (res.error) {
      setError(res.error)
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    await loadEquipment()
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this equipment?')) return
    const res = await apiDelete('/api/equipment', { id })
    if (res.error) { setError(res.error); return }
    await loadEquipment()
  }

  if (loading) return <div style={shared.loading}>Loading...</div>

  return (
    <div>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Equipment</h2>
        <button style={shared.btnPrimary} onClick={() => (showForm ? closeForm() : openAddForm())}>
          {showForm ? 'Cancel' : '+ New Equipment'}
        </button>
      </div>

      {error && <div style={shared.errorBox}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={shared.form}>
          <div style={shared.formRow}>
            <div style={shared.group}>
              <label style={shared.label}>Name</label>
              <input style={shared.input} name="name" placeholder="e.g. F-350 #2" value={formData.name} onChange={handleChange} required />
            </div>
            <div style={shared.group}>
              <label style={shared.label}>Category</label>
              <select style={shared.select} name="category" value={formData.category} onChange={handleChange}>
                {EQUIPMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Status</label>
            <select style={shared.select} name="status" value={formData.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="repair">In Repair</option>
            </select>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Notes</label>
            <textarea style={shared.textarea} name="notes" placeholder="Optional notes" value={formData.notes} onChange={handleChange} rows={3} />
          </div>

          <button style={shared.btnPrimary} type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Equipment'}
          </button>
        </form>
      )}

      {equipment.length === 0 ? (
        <p style={shared.empty}>No equipment yet. Add your first piece of equipment to get started.</p>
      ) : (
        <div style={styles.grid}>
          {equipment.map(item => (
            <div key={item.id} style={{ ...shared.card, ...styles.itemCard }}>
              <div style={styles.cardHeader}>
                <h3 style={styles.itemName}>{item.name}</h3>
                <span style={badgeStyle(item.computed_status)}>{STATUS_LABELS[item.computed_status]}</span>
              </div>
              <p style={styles.itemMeta}>
                {categoryLabel(item.category)}
                {item.status_detail && item.computed_status !== 'available' && item.computed_status !== 'repair'
                  ? ` · ${item.status_detail}` : ''}
              </p>
              {item.notes && <p style={styles.itemNotes}>{item.notes}</p>}
              <div style={styles.actions}>
                <button style={shared.btnSecondary} onClick={() => openEditForm(item)}>Edit</button>
                <button style={shared.btnDanger} onClick={() => handleDelete(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  itemCard: { padding: '1rem 1.25rem' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' },
  itemName: { margin: 0, fontFamily: FONT_COND, fontWeight: 700, fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  itemMeta: { color: COLORS.mid, fontSize: '0.82rem', margin: '0.2rem 0 0' },
  itemNotes: { color: '#666', fontSize: '0.8rem', margin: '0.4rem 0 0' },
  actions: { display: 'flex', gap: '0.4rem', marginTop: '0.75rem' },
}
