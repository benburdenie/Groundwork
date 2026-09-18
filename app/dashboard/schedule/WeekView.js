'use client'

import { COLORS, FONT_COND, FONT_MONO } from '../../../lib/theme'
import { fmt, todayStr, jobsForDate, crewBlocksForDate, crewColor, equipmentDeployedOnDate, addDaysToDate } from './helpers'

export default function WeekView({ jobs, availability, bookings, equipment, workSchedule, draggingJobId, onCellClick, onJobClick, onJobDragStart, onJobDragEnd, onDropOnDate }) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDaysToDate(today, i))
  const todayS = todayStr()
  const totalEquipment = equipment.length

  return (
    <div style={styles.grid}>
      {days.map((date, i) => {
        const dateStr = fmt(date)
        const isToday = dateStr === todayS
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
              ...styles.col,
              ...(isToday ? styles.colToday : {}),
              ...((isWeekend && override !== 'workday') || override === 'holiday' ? styles.colWeekend : {}),
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDropOnDate(dateStr)}
            onClick={() => onCellClick(dateStr)}
          >
            <div style={styles.colHeader}>
              <div style={styles.dowLabel}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div style={{ ...styles.dateLabel, ...(isToday ? styles.dateLabelToday : {}) }}>{date.getDate()}</div>
              {override && <span style={styles.overrideTag}>{override === 'workday' ? 'Work' : 'Off'}</span>}
            </div>

            {blocks.length > 0 && (
              <div style={styles.blockTags}>
                {blocks.map(b => (
                  <span key={b.id} style={{ ...styles.blockTag, background: `${crewColor(b.crew)}26`, color: crewColor(b.crew) }}>
                    {b.crew?.name || 'Crew'} out{b.reason ? ` — ${b.reason}` : ''}
                  </span>
                ))}
              </div>
            )}

            <div style={styles.jobList}>
              {dayJobs.length === 0 && <div style={styles.empty}>No jobs</div>}
              {dayJobs.map(job => (
                <div
                  key={job.id}
                  draggable
                  className="job-pill"
                  onDragStart={(e) => { e.stopPropagation(); onJobDragStart(job.id) }}
                  onDragEnd={onJobDragEnd}
                  onClick={(e) => { e.stopPropagation(); onJobClick(job) }}
                  style={{
                    ...styles.card,
                    background: COLORS.borderSubtle,
                    borderLeft: `3px solid ${crewColor(job.crew)}`,
                    opacity: draggingJobId === job.id ? 0.4 : 1,
                  }}
                >
                  <div style={styles.cardName}>{job.name}</div>
                  {job.crew && <div style={styles.cardCrew}>{job.crew.name}</div>}
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: COLORS.borderSubtle, minHeight: '60vh', borderRadius: '8px', overflow: 'hidden' },
  col: { background: COLORS.bg, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' },
  colToday: { background: COLORS.primaryMuted },
  colWeekend: { background: COLORS.sidebarBg },
  colHeader: { display: 'flex', alignItems: 'baseline', gap: '8px', borderBottom: `1px solid ${COLORS.borderSubtle}`, paddingBottom: '8px' },
  dowLabel: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.textMuted },
  dateLabel: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '1.2rem', color: COLORS.textSecondary },
  dateLabelToday: { color: COLORS.primary },
  overrideTag: { fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '0.05em', color: COLORS.yellow, border: `1px solid ${COLORS.yellow}`, borderRadius: '4px', padding: '0px 4px', marginLeft: 'auto' },
  blockTags: { display: 'flex', flexDirection: 'column', gap: '2px' },
  blockTag: { fontFamily: FONT_MONO, fontSize: '0.58rem', letterSpacing: '0.03em', textTransform: 'uppercase', padding: '2px 5px', borderRadius: '4px' },
  jobList: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' },
  empty: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: COLORS.textMuted, textAlign: 'center', padding: '1rem 0' },
  card: { padding: '8px 10px', borderRadius: '4px' },
  cardName: { fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary },
  cardCrew: { fontFamily: FONT_MONO, fontSize: '0.62rem', color: COLORS.textSecondary, marginTop: '2px' },
  pressureWrap: { height: '3px', background: COLORS.borderSubtle, borderRadius: '2px' },
  pressureBar: { height: '100%', background: COLORS.yellow, borderRadius: '2px' },
}
