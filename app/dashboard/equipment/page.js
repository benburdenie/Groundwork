'use client'

import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api'
import { COLORS, FONT_COND, EQUIPMENT_CATEGORIES, STATUS_LABELS, shared, badgeStyle } from '../../../lib/theme'
import { Spinner, SkeletonGrid, EmptyState } from '../ui'

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

  if (loading) return (
    <div>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Equipment</h2>
      </div>
      <SkeletonGrid />
    </div>
  )

  return (
    <div>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Equipment</h2>
        <button className="btn btn-primary" onClick={() => (showForm ? closeForm() : openAddForm())}>
          {showForm ? 'Cancel' : '+ New equipment'}
        </button>
      </div>

      {error && <div style={shared.errorBox}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={shared.form}>
          <div style={shared.formRow}>
            <div style={shared.group}>
              <label style={shared.label}>Name</label>
              <input className="field" name="name" placeholder="e.g. F-350 #2" value={formData.name} onChange={handleChange} required />
            </div>
            <div style={shared.group}>
              <label style={shared.label}>Category</label>
              <select className="field" name="category" value={formData.category} onChange={handleChange}>
                {EQUIPMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Status</label>
            <select className="field" name="status" value={formData.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="repair">In repair</option>
            </select>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Notes</label>
            <textarea className="field" name="notes" placeholder="Optional notes" value={formData.notes} onChange={handleChange} rows={3} />
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving && <Spinner />}
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save equipment'}
          </button>
        </form>
      )}

      {equipment.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No equipment yet"
          subtitle="Add trucks, trailers, and machines to track what's deployed where."
          actionLabel="Add your first equipment"
          onAction={openAddForm}
        />
      ) : (
        <div style={styles.grid}>
          {equipment.map(item => (
            <div key={item.id} className="card card-hover" style={styles.itemCard}>
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
                <button className="btn btn-secondary btn-sm" onClick={() => openEditForm(item)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' },
  itemCard: { padding: '20px' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' },
  itemName: { margin: 0, fontFamily: FONT_COND, fontWeight: 700, fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textPrimary },
  itemMeta: { color: COLORS.textSecondary, fontSize: '0.82rem', margin: '0.2rem 0 0' },
  itemNotes: { color: COLORS.textMuted, fontSize: '0.8rem', margin: '0.4rem 0 0' },
  actions: { display: 'flex', gap: '0.5rem', marginTop: '0.9rem' },
}
