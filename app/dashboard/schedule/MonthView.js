'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { COLORS, FONT_MONO } from '../../../lib/theme'
import { fmt, todayStr, jobsForDate, crewBlocksForDate, crewColor, equipmentDeployedOnDate } from './helpers'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startDow = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = startDow; i > 0; i--) cells.push(new Date(year, month, 1 - i))
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // Only as many weeks as the month needs (5 or 6), so cells get as tall as possible.
  const weeks = Math.ceil((startDow + daysInMonth) / 7)
  while (cells.length < weeks * 7) {
    const last = cells[cells.length - 1]
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1))
  }
  return cells
}

// Floor for a week row. Below this the grid stops shrinking and the page scrolls
// instead of crushing the cells.
const MIN_ROW_HEIGHT = 72

// Sizes the grid to fill exactly the space between its own top edge and the bottom
// of the viewport (less <main>'s bottom padding), so the month never needs a page
// scroll. Cell height falls out of that: the day-of-week row is auto-sized and the
// week rows split whatever is left. Re-measures whenever something above the grid
// changes size (overdue banner, error box, wrapping toolbar, fonts, window resize).
function useFillViewportHeight(ref, weeks) {
  const [height, setHeight] = useState(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      const main = el.closest('main')
      const bottomPad = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0
      const headerHeight = el.firstElementChild ? el.firstElementChild.offsetHeight : 0
      // 1px of slack so sub-pixel rounding can't tip the document into scrolling.
      const available = Math.floor(window.innerHeight - top - bottomPad - 1)
      setHeight(Math.max(available, headerHeight + weeks * MIN_ROW_HEIGHT))
    }

    measure()

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) observer.observe(node)
    observer.observe(document.body)
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [ref, weeks])

  return height
}

export default function MonthView({ cursor, jobs, availability, bookings, equipment, workSchedule, draggingJobId, onCellClick, onJobClick, onJobDragStart, onJobDragEnd, onDropOnDate }) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = buildMonthGrid(year, month)
  const today = todayStr()
  const totalEquipment = equipment.length
  const weeks = cells.length / 7

  const gridRef = useRef(null)
  const gridHeight = useFillViewportHeight(gridRef, weeks)

  return (
    <div
      ref={gridRef}
      style={{
        ...styles.grid,
        gridTemplateRows: `auto repeat(${weeks}, minmax(0, 1fr))`,
        ...(gridHeight != null ? { height: `${gridHeight}px` } : {}),
      }}
    >
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
  // minmax(0, 1fr): a plain 1fr column can't shrink below its content's min width,
  // which is what pushed Saturday off the right edge.
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', width: '100%', minWidth: 0, border: `1px solid ${COLORS.borderSubtle}`, borderRight: 'none', borderBottom: 'none', borderRadius: '8px', overflow: 'hidden' },
  dowHeader: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted, padding: '8px 10px', minWidth: 0, borderRight: `1px solid ${COLORS.borderSubtle}`, borderBottom: `1px solid ${COLORS.borderSubtle}`, background: COLORS.sidebarBg },
  cell: { minWidth: 0, minHeight: 0, overflow: 'hidden', padding: '6px 8px', borderRight: `1px solid ${COLORS.borderSubtle}`, borderBottom: `1px solid ${COLORS.borderSubtle}`, background: COLORS.bg, display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', transition: 'background-color 150ms ease' },
  cellTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cellToday: { background: COLORS.primaryMuted },
  cellDim: { background: 'rgba(255,255,255,0.015)' },
  cellWeekend: { background: COLORS.sidebarBg },
  cellDate: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '13px', color: COLORS.textSecondary },
  cellDateToday: { color: COLORS.primary },
  overrideTag: { fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.yellow, border: `1px solid ${COLORS.yellow}`, borderRadius: '4px', padding: '0px 4px' },
  rainIcon: { fontSize: '0.85rem', lineHeight: 1 },
  blockTags: { display: 'flex', flexWrap: 'wrap', gap: '2px' },
  blockTag: { fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '0.03em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },
  // Jobs that don't fit the fixed-height cell scroll inside it rather than growing the row.
  cellJobs: { display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0, scrollbarWidth: 'thin' },
  pill: { flexShrink: 0, fontSize: '13px', fontWeight: 500, letterSpacing: '0.1px', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: COLORS.textPrimary },
  pressureWrap: { flexShrink: 0, height: '3px', background: COLORS.borderSubtle, borderRadius: '2px' },
  pressureBar: { height: '100%', background: COLORS.yellow, borderRadius: '2px' },
}
