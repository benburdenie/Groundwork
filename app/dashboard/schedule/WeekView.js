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
              {override && <span style={styles.overrideTag}>{override === 'workday' ? 'WORK' : 'OFF'}</span>}
            </div>

            {blocks.length > 0 && (
              <div style={styles.blockTags}>
                {blocks.map(b => (
                  <span key={b.id} style={{ ...styles.blockTag, background: `${crewColor(b.crew)}26`, color: crewColor(b.crew), borderColor: crewColor(b.crew) }}>
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
                  onDragStart={(e) => { e.stopPropagation(); onJobDragStart(job.id) }}
                  onDragEnd={onJobDragEnd}
                  onClick={(e) => { e.stopPropagation(); onJobClick(job) }}
                  style={{
                    ...styles.card,
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
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: COLORS.border, minHeight: '60vh' },
  col: { background: COLORS.black, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', cursor: 'pointer' },
  colToday: { background: '#1a1600' },
  colWeekend: { background: '#0a0a0d' },
  colHeader: { display: 'flex', alignItems: 'baseline', gap: '0.4rem', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '0.4rem' },
  dowLabel: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '1px', textTransform: 'uppercase', color: COLORS.mid },
  dateLabel: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.3rem', color: '#fff' },
  dateLabelToday: { color: COLORS.yellow },
  overrideTag: { fontFamily: FONT_MONO, fontSize: '0.55rem', letterSpacing: '1px', color: COLORS.orange, border: `1px solid ${COLORS.orange}`, padding: '0px 3px', marginLeft: 'auto' },
  blockTags: { display: 'flex', flexDirection: 'column', gap: '2px' },
  blockTag: { fontFamily: FONT_MONO, fontSize: '0.58rem', letterSpacing: '0.5px', textTransform: 'uppercase', padding: '2px 4px', border: '1px solid' },
  jobList: { display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto' },
  empty: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#3a3a3a', textAlign: 'center', padding: '1rem 0' },
  card: { background: COLORS.cardBg, padding: '0.5rem 0.6rem', cursor: 'pointer' },
  cardName: { fontFamily: FONT_COND, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: '#eee' },
  cardCrew: { fontFamily: FONT_MONO, fontSize: '0.62rem', color: COLORS.mid, marginTop: '2px' },
  pressureWrap: { height: '3px', background: '#222' },
  pressureBar: { height: '100%', background: COLORS.orange },
}
