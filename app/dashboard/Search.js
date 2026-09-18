'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet } from '../../lib/api'
import { COLORS, FONT_MONO } from '../../lib/theme'

export default function Search() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [data, setData] = useState({ jobs: [], crews: [], equipment: [], workers: [] })
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef(null)

  const loadData = async () => {
    if (loaded) return
    const [jobsRes, crewsRes, equipmentRes, workersRes] = await Promise.all([
      apiGet('/api/jobs'), apiGet('/api/crews'), apiGet('/api/equipment'), apiGet('/api/workers'),
    ])
    setData({
      jobs: jobsRes.jobs || [], crews: crewsRes.crews || [],
      equipment: equipmentRes.equipment || [], workers: workersRes.workers || [],
    })
    setLoaded(true)
  }

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const jobs = data.jobs.filter(j =>
      j.name?.toLowerCase().includes(q) || j.address?.toLowerCase().includes(q) || j.client_name?.toLowerCase().includes(q)
    ).slice(0, 8)
    const crews = data.crews.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 8)
    const equipment = data.equipment.filter(e => e.name?.toLowerCase().includes(q)).slice(0, 8)
    const workers = data.workers.filter(w => w.name?.toLowerCase().includes(q)).slice(0, 8)

    const result = []
    if (jobs.length) result.push({ label: 'Jobs', items: jobs.map(j => ({ id: j.id, label: j.name, sub: j.address || j.client_name || '', href: `/dashboard/schedule?job=${j.id}` })) })
    if (crews.length) result.push({ label: 'Crews', items: crews.map(c => ({ id: c.id, label: c.name, sub: c.foreman_name || '', href: `/dashboard/crews?crew=${c.id}` })) })
    if (equipment.length) result.push({ label: 'Equipment', items: equipment.map(e => ({ id: e.id, label: e.name, sub: e.category || '', href: '/dashboard/equipment' })) })
    if (workers.length) result.push({ label: 'Workers', items: workers.map(w => ({ id: w.id, label: w.name, sub: w.role || '', href: '/dashboard/workers' })) })
    return result
  }, [query, data])

  const flatItems = useMemo(() => groups.flatMap(g => g.items), [groups])

  const handleFocus = () => { setOpen(true); loadData() }

  const handleChange = (e) => {
    setQuery(e.target.value)
    setActiveIndex(0)
    setOpen(true)
  }

  const goTo = (item) => {
    if (!item) return
    setOpen(false)
    setQuery('')
    router.push(item.href)
  }

  const handleKeyDown = (e) => {
    if (!open || flatItems.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      goTo(flatItems[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  let runningIndex = -1

  return (
    <div style={styles.container} ref={containerRef}>
      <input
        style={styles.input}
        placeholder="Search jobs, crews, equipment, workers..."
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      />
      {open && query.trim() && (
        <div style={styles.dropdown}>
          {groups.length === 0 && <div style={styles.empty}>No results</div>}
          {groups.map(group => (
            <div key={group.label}>
              <div style={styles.groupLabel}>{group.label}</div>
              {group.items.map(item => {
                runningIndex++
                const idx = runningIndex
                return (
                  <button
                    key={item.id}
                    style={{ ...styles.item, ...(idx === activeIndex ? styles.itemActive : {}) }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => goTo(item)}
                  >
                    <span style={styles.itemLabel}>{item.label}</span>
                    {item.sub && <span style={styles.itemSub}>{item.sub}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { position: 'relative', flex: 1, maxWidth: '360px' },
  input: {
    width: '100%', background: '#0a0a0a', border: `1px solid ${COLORS.border}`, color: '#fff',
    padding: '0.4rem 0.7rem', fontSize: '0.8rem', boxSizing: 'border-box', outline: 'none',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
    background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, maxHeight: '360px', overflowY: 'auto', zIndex: 600,
  },
  empty: { padding: '0.75rem', fontSize: '0.8rem', color: '#555' },
  groupLabel: { fontFamily: FONT_MONO, fontSize: '0.58rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.yellow, padding: '0.5rem 0.75rem 0.25rem' },
  item: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 'none', textAlign: 'left', padding: '0.4rem 0.75rem', cursor: 'pointer', color: '#eee', fontSize: '0.82rem' },
  itemActive: { background: '#242200' },
  itemLabel: { fontWeight: 600 },
  itemSub: { color: '#666', fontSize: '0.72rem', marginLeft: '0.75rem' },
}
