'use client'

import { useState } from 'react'
import { COLORS, FONT_COND, FONT_MONO } from '../../../lib/theme'
import { displayStatus, crewColor } from './helpers'

const COLUMNS = [
  { key: 'notstarted', label: 'Not started', color: COLORS.textSecondary, droppable: true },
  { key: 'inprogress', label: 'In progress', color: COLORS.primary, droppable: true },
  { key: 'overdue', label: 'Overdue', color: COLORS.danger, droppable: false },
  { key: 'complete', label: 'Complete', color: COLORS.primaryHover, droppable: true },
]

export default function BoardView({ jobs, crews, equipment, crewFilter, onCrewFilterChange, draggingJobId, onJobDragStart, onJobDragEnd, onDropStatus, onJobClick, onDropCrewOnJob, onDropEquipmentOnJob }) {
  const [dragKind, setDragKind] = useState(null) // 'crew' | 'equipment' | null
  const [dragCrewId, setDragCrewId] = useState(null)
  const [dragEquipmentId, setDragEquipmentId] = useState(null)
  const [overJobId, setOverJobId] = useState(null)

  const filteredJobs = crewFilter ? jobs.filter(j => j.crew_id === crewFilter) : jobs
  const byColumn = Object.fromEntries(COLUMNS.map(c => [c.key, []]))
  for (const job of filteredJobs) byColumn[displayStatus(job)].push(job)

  const handleCardDrop = (job) => {
    setOverJobId(null)
    if (dragKind === 'crew' && dragCrewId) {
      onDropCrewOnJob(job.id, dragCrewId)
    } else if (dragKind === 'equipment' && dragEquipmentId) {
      onDropEquipmentOnJob(job.id, dragEquipmentId, job)
    }
    setDragKind(null)
    setDragCrewId(null)
    setDragEquipmentId(null)
  }

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <select className="field" style={{ width: '220px' }} value={crewFilter} onChange={(e) => onCrewFilterChange(e.target.value)}>
          <option value="">All crews</option>
          {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={styles.layout}>
        <div className="card" style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Crews</div>
          {crews.map(c => (
            <div
              key={c.id}
              draggable
              onDragStart={() => { setDragKind('crew'); setDragCrewId(c.id) }}
              onDragEnd={() => { setDragKind(null); setDragCrewId(null) }}
              style={{ ...styles.dragItem, borderLeft: `3px solid ${crewColor(c)}` }}
            >
              {c.name}
            </div>
          ))}

          <div style={{ ...styles.sidebarTitle, marginTop: '20px' }}>Equipment</div>
          {equipment.map(e => (
            <div
              key={e.id}
              draggable
              onDragStart={() => { setDragKind('equipment'); setDragEquipmentId(e.id) }}
              onDragEnd={() => { setDragKind(null); setDragEquipmentId(null) }}
              style={styles.dragItem}
            >
              {e.name}
            </div>
          ))}
        </div>

        <div style={styles.board}>
          {COLUMNS.map(col => (
            <div
              key={col.key}
              className="card"
              style={styles.column}
              onDragOver={col.droppable ? (e) => e.preventDefault() : undefined}
              onDrop={col.droppable ? () => onDropStatus(col.key) : undefined}
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
                    className="card card-hover"
                    onDragStart={() => onJobDragStart(job.id)}
                    onDragEnd={onJobDragEnd}
                    onDragOver={(e) => { e.preventDefault(); if (dragKind) setOverJobId(job.id) }}
                    onDragLeave={() => setOverJobId(null)}
                    onDrop={(e) => { if (dragKind) { e.stopPropagation(); handleCardDrop(job) } }}
                    onClick={() => onJobClick(job)}
                    style={{
                      ...styles.jobCard,
                      borderLeft: `3px solid ${crewColor(job.crew)}`,
                      opacity: draggingJobId === job.id ? 0.4 : 1,
                      outline: overJobId === job.id ? `2px dashed ${COLORS.primary}` : 'none',
                    }}
                  >
                    <div style={styles.jobName}>{job.name}</div>
                    {job.address && <div style={styles.jobMeta}>{job.address}</div>}
                    <div style={styles.jobCrew}>
                      {job.crew
                        ? <><span style={{ ...styles.dot, background: crewColor(job.crew) }} />{job.crew.name}</>
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
      </div>
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '16px' },
  toolbar: { display: 'flex', justifyContent: 'flex-end' },
  layout: { display: 'flex', gap: '24px', alignItems: 'flex-start' },
  sidebar: { width: '200px', flexShrink: 0, padding: '16px' },
  sidebarTitle: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted, marginBottom: '10px' },
  dragItem: { background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', color: COLORS.textPrimary, marginBottom: '6px', cursor: 'grab' },
  board: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))', gap: '16px', flex: 1, overflowX: 'auto' },
  column: { display: 'flex', flexDirection: 'column', minWidth: 0, padding: 0, overflow: 'hidden' },
  columnHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderTop: '3px solid', background: COLORS.surfaceRaised },
  columnTitle: { fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.textSecondary },
  columnCount: { fontFamily: FONT_MONO, fontSize: '0.7rem', color: COLORS.textMuted },
  columnBody: { flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '200px' },
  columnEmpty: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.textMuted, textAlign: 'center', padding: '1.5rem 0' },
  jobCard: { padding: '12px 14px', cursor: 'pointer' },
  jobName: { fontFamily: FONT_COND, fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px', color: COLORS.textPrimary },
  jobMeta: { fontFamily: FONT_MONO, fontSize: '0.65rem', color: COLORS.textMuted, marginTop: '1px' },
  jobCrew: { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: COLORS.textSecondary, marginTop: '0.5rem' },
  jobEquip: { fontSize: '0.7rem', color: COLORS.textMuted, marginTop: '0.3rem' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
}
