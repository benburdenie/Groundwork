'use client'

import { useEffect, useState } from 'react'
import { Truck, ChevronDown } from 'lucide-react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api'
import { COLORS, FONT_MONO, EQUIPMENT_CATEGORIES, STATUS_LABELS, shared, badgeStyle } from '../../../lib/theme'
import { Spinner, Skeleton, EmptyState } from '../ui'

const EMPTY_FORM = { name: '', category: EQUIPMENT_CATEGORIES[0].value, status: 'available', notes: '' }

function categoryLabel(value) {
  return EQUIPMENT_CATEGORIES.find(c => c.value === value)?.label || value
}

function formFromItem(item) {
  return {
    name: item.name || '',
    category: item.category || EQUIPMENT_CATEGORIES[0].value,
    status: item.status || 'available',
    notes: item.notes || '',
  }
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingNew, setAddingNew] = useState(false)
  const [expandedId, setExpandedId] = useState(null) // equipment row expanded inline for editing
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
    setExpandedId(null)
    setFormData(EMPTY_FORM)
    setAddingNew(true)
  }

  const closeAddForm = () => {
    setAddingNew(false)
    setFormData(EMPTY_FORM)
  }

  // Accordion: clicking an already-expanded row collapses it; clicking another
  // row switches straight to it. Editing happens in place, right under the row
  // that was clicked — never at the top of the page.
  const toggleRow = (item) => {
    if (expandedId === item.id) {
      setExpandedId(null)
      return
    }
    setAddingNew(false)
    setExpandedId(item.id)
    setFormData(formFromItem(item))
  }

  const closeExpanded = () => {
    setExpandedId(null)
    setFormData(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const editingId = expandedId
    const res = editingId
      ? await apiPatch('/api/equipment', { id: editingId, ...formData })
      : await apiPost('/api/equipment', formData)

    if (res.error) {
      setError(res.error)
      setSaving(false)
      return
    }

    setSaving(false)
    if (editingId) closeExpanded()
    else closeAddForm()
    await loadEquipment()
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this equipment?')) return
    const res = await apiDelete('/api/equipment', { id })
    if (res.error) { setError(res.error); return }
    if (expandedId === id) closeExpanded()
    await loadEquipment()
  }

  if (loading) return (
    <div>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Equipment</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="48px" style={{ borderRadius: '8px' }} />)}
      </div>
    </div>
  )

  const rowProps = {
    expandedId, formData, onChange: handleChange, onToggle: toggleRow,
    onDelete: handleDelete, onSubmit: handleSubmit, onCancel: closeExpanded, saving,
  }

  return (
    <div>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Equipment</h2>
        <button className="btn btn-primary" onClick={() => (addingNew ? closeAddForm() : openAddForm())}>
          {addingNew ? 'Cancel' : '+ New equipment'}
        </button>
      </div>

      {error && <div style={shared.errorBox}>{error}</div>}

      {addingNew && (
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
            {saving ? 'Saving…' : 'Save equipment'}
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
        <div style={styles.list}>
          {equipment.map(item => (
            <EquipmentRow key={item.id} item={item} {...rowProps} />
          ))}
        </div>
      )}
    </div>
  )
}

function EquipmentRow({ item, expandedId, formData, onChange, onToggle, onDelete, onSubmit, onCancel, saving }) {
  const expanded = expandedId === item.id

  return (
    <div className="card" style={styles.rowCard}>
      <div className="row row-hover" style={styles.row} onClick={() => onToggle(item)}>
        <div style={styles.rowMain}>
          <span style={styles.itemName}>{item.name}</span>
          <span style={styles.itemMeta}>{categoryLabel(item.category)}</span>
          {item.notes && <span style={styles.itemNotes}>{item.notes}</span>}
        </div>
        <div style={styles.actions}>
          <span style={badgeStyle(item.computed_status)}>{STATUS_LABELS[item.computed_status]}</span>
          <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}>Remove</button>
          <ChevronDown size={16} color={COLORS.textMuted} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease', flexShrink: 0 }} />
        </div>
      </div>

      {expanded && (
        <form onSubmit={onSubmit} style={styles.inlineForm} onClick={(e) => e.stopPropagation()}>
          <div style={shared.formRow}>
            <div style={shared.group}>
              <label style={shared.label}>Name</label>
              <input className="field" name="name" placeholder="e.g. F-350 #2" value={formData.name} onChange={onChange} required />
            </div>
            <div style={shared.group}>
              <label style={shared.label}>Category</label>
              <select className="field" name="category" value={formData.category} onChange={onChange}>
                {EQUIPMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Status</label>
            <select className="field" name="status" value={formData.status} onChange={onChange}>
              <option value="available">Available</option>
              <option value="repair">In repair</option>
            </select>
          </div>

          <div style={shared.group}>
            <label style={shared.label}>Notes</label>
            <textarea className="field" name="notes" placeholder="Optional notes" value={formData.notes} onChange={onChange} rows={3} />
          </div>

          <div style={styles.inlineActions}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving && <Spinner />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

const styles = {
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  rowCard: { padding: 0, overflow: 'hidden' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', gap: '1rem', flexWrap: 'wrap', minHeight: '48px', cursor: 'pointer' },
  rowMain: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' },
  itemName: { fontWeight: 600, fontSize: '0.95rem', marginRight: '0.25rem', color: COLORS.textPrimary },
  itemMeta: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.textSecondary },
  itemNotes: { fontSize: '0.78rem', color: COLORS.textMuted },
  actions: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 },
  inlineForm: { borderTop: `1px solid ${COLORS.borderSubtle}`, padding: '20px 16px', cursor: 'default' },
  inlineActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
}
