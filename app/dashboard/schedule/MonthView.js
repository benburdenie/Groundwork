'use client'

import { COLORS, FONT_COND, FONT_MONO } from '../../../lib/theme'
import { fmt, todayStr, jobsForDate, crewBlocksForDate, crewColor, equipmentDeployedOnDate } from './helpers'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startDow = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = startDow; i > 0; i--) cells.push(new Date(year, month, 1 - i))
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length < 42) {
    const last = cells[cells.length - 1]
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1))
  }
  return cells
}

export default function MonthView({ cursor, jobs, availability, bookings, equipment, workSchedule, draggingJobId, onCellClick, onJobClick, onJobDragStart, onJobDragEnd, onDropOnDate }) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = buildMonthGrid(year, month)
  const today = todayStr()
  const totalEquipment = equipment.length

  return (
    <div style={styles.grid}>
      {DOW.map(d => <div key={d} style={styles.dowHeader}>{d}</div>)}
      {cells.map((date, i) => {
        const dateStr = fmt(date)
        const inMonth = date.getMonth() === month
        const isToday = dateStr === today
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        const override = workSchedule.get(dateStr)
        const dayJobs = jobsForDate(jobs, dateStr)
        const blocks = crewBlocksForDate(availability, dateStr)
        const deployed = totalEquipment > 0 ? equipmentDeployedOnDate(dateStr, jobs, bookings).size : 0
        const pressure = totalEquipment > 0 ? deployed / totalEquipment : 0

        return (
          <div
            key={i}
            style={{
              ...styles.cell,
              ...(isToday ? styles.cellToday : {}),
              ...(!inMonth ? styles.cellDim : {}),
              ...((isWeekend && override !== 'workday') || override === 'holiday' || override === 'rain' ? styles.cellWeekend : {}),
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropOnDate(dateStr)}
            onClick={() => onCellClick(dateStr)}
          >
            <div style={styles.cellTop}>
              <div style={{ ...styles.cellDate, ...(isToday ? styles.cellDateToday : {}) }}>{date.getDate()}</div>
              {override === 'rain' && <span style={styles.rainIcon} title="Rain day">🌧</span>}
              {override && override !== 'rain' && <span style={styles.overrideTag}>{override === 'workday' ? 'Work' : 'Off'}</span>}
            </div>

            {blocks.length > 0 && (
              <div style={styles.blockTags}>
                {blocks.map(b => (
                  <span key={b.id} style={{ ...styles.blockTag, background: `${crewColor(b.crew)}26`, color: crewColor(b.crew) }}>
                    {b.crew?.name || 'Crew'} out
                  </span>
                ))}
              </div>
            )}

            <div style={styles.cellJobs}>
              {dayJobs.map(job => (
                <div
                  key={job.id}
                  draggable
                  className="job-pill"
                  onDragStart={(e) => { e.stopPropagation(); onJobDragStart(job.id) }}
                  onDragEnd={onJobDragEnd}
                  onClick={(e) => { e.stopPropagation(); onJobClick(job) }}
                  style={{
                    ...styles.pill,
                    background: COLORS.borderSubtle,
                    borderLeft: `3px solid ${crewColor(job.crew)}`,
                    opacity: draggingJobId === job.id ? 0.4 : 1,
                  }}
                  title={job.name}
                >
                  {job.name}
                </div>
              ))}
            </div>

            {pressure >= 0.5 && (
              <div style={styles.pressureWrap} title={`${deployed}/${totalEquipment} equipment deployed`}>
                <div style={{ ...styles.pressureBar, width: `${Math.min(100, Math.round(pressure * 100))}%` }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${COLORS.borderSubtle}`, borderRight: 'none', borderBottom: 'none', borderRadius: '8px', overflow: 'hidden' },
  dowHeader: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted, padding: '10px', borderRight: `1px solid ${COLORS.borderSubtle}`, borderBottom: `1px solid ${COLORS.borderSubtle}`, background: COLORS.sidebarBg },
  cell: { minHeight: '110px', padding: '8px', borderRight: `1px solid ${COLORS.borderSubtle}`, borderBottom: `1px solid ${COLORS.borderSubtle}`, background: COLORS.bg, display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', transition: 'background-color 150ms ease' },
  cellTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cellToday: { background: COLORS.primaryMuted },
  cellDim: { background: 'rgba(255,255,255,0.015)' },
  cellWeekend: { background: COLORS.sidebarBg },
  cellDate: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: COLORS.textSecondary },
  cellDateToday: { color: COLORS.primary },
  overrideTag: { fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.yellow, border: `1px solid ${COLORS.yellow}`, borderRadius: '4px', padding: '0px 4px' },
  rainIcon: { fontSize: '0.85rem', lineHeight: 1 },
  blockTags: { display: 'flex', flexWrap: 'wrap', gap: '2px' },
  blockTag: { fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '0.03em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' },
  cellJobs: { display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1 },
  pill: { fontSize: '13px', fontWeight: 500, letterSpacing: '0.1px', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: COLORS.textPrimary },
  pressureWrap: { height: '3px', background: COLORS.borderSubtle, borderRadius: '2px' },
  pressureBar: { height: '100%', background: COLORS.yellow, borderRadius: '2px' },
}
