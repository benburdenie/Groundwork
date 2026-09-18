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
              ...((isWeekend && override !== 'workday') || override === 'holiday' ? styles.cellWeekend : {}),
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropOnDate(dateStr)}
            onClick={() => onCellClick(dateStr)}
          >
            <div style={styles.cellTop}>
              <div style={{ ...styles.cellDate, ...(isToday ? styles.cellDateToday : {}) }}>{date.getDate()}</div>
              {override && <span style={styles.overrideTag}>{override === 'workday' ? 'WORK' : 'OFF'}</span>}
            </div>

            {blocks.length > 0 && (
              <div style={styles.blockTags}>
                {blocks.map(b => (
                  <span key={b.id} style={{ ...styles.blockTag, background: `${crewColor(b.crew)}26`, color: crewColor(b.crew), borderColor: crewColor(b.crew) }}>
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
                  onDragStart={(e) => { e.stopPropagation(); onJobDragStart(job.id) }}
                  onDragEnd={onJobDragEnd}
                  onClick={(e) => { e.stopPropagation(); onJobClick(job) }}
                  style={{
                    ...styles.pill,
                    background: `${crewColor(job.crew)}26`,
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${COLORS.border}`, borderRight: 'none', borderBottom: 'none' },
  dowHeader: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.mid, padding: '0.5rem', borderRight: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: '#0f0f0f' },
  cell: { minHeight: '110px', padding: '0.4rem', borderRight: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.black, display: 'flex', flexDirection: 'column', gap: '0.25rem', cursor: 'pointer' },
  cellTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cellToday: { background: '#1a1600' },
  cellDim: { background: '#0c0c0c' },
  cellWeekend: { background: '#0a0a0d' },
  cellDate: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.1rem', color: '#fff' },
  cellDateToday: { color: COLORS.yellow },
  overrideTag: { fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '1px', color: COLORS.orange, border: `1px solid ${COLORS.orange}`, padding: '0px 3px' },
  blockTags: { display: 'flex', flexWrap: 'wrap', gap: '2px' },
  blockTag: { fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '1px 4px', border: '1px solid', whiteSpace: 'nowrap' },
  cellJobs: { display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1 },
  pill: { fontFamily: FONT_COND, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.3px', textTransform: 'uppercase', padding: '2px 5px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#eee' },
  pressureWrap: { height: '3px', background: '#222', marginTop: '2px' },
  pressureBar: { height: '100%', background: COLORS.orange },
}
