'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CloudRain, CalendarClock, Printer, Plus } from 'lucide-react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api'
import { COLORS, FONT_COND, RADIUS, shared } from '../../../lib/theme'
import { buildWorkScheduleMap, computeEndDate } from '../../../lib/workdays'
import { useJobsContext } from '../JobsContext'
import { Skeleton } from '../ui'
import MonthView from './MonthView'
import WeekView from './WeekView'
import BoardView from './BoardView'
import UnscheduledPanel from './UnscheduledPanel'
import JobPanel from './JobPanel'
import JobFormModal from './JobFormModal'
import QuickCreatePopover from './QuickCreatePopover'
import EquipmentDurationModal from './EquipmentDurationModal'
import { RainDayModal, WorkDayModal } from './WorkdayModals'

const VIEWS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: '7 day' },
  { key: 'board', label: 'Board' },
]

export default function SchedulePage() {
  return (
    <Suspense fallback={<Skeleton height="60vh" />}>
      <ScheduleContent />
    </Suspense>
  )
}

function ScheduleContent() {
  const { refreshJobs } = useJobsContext()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState(() => (VIEWS.some(v => v.key === searchParams.get('view')) ? searchParams.get('view') : 'month'))
  const [jobs, setJobs] = useState([])
  const [crews, setCrews] = useState([])
  const [equipment, setEquipment] = useState([])
  const [workers, setWorkers] = useState([])
  const [availability, setAvailability] = useState([])
  const [bookings, setBookings] = useState([])
  const [workScheduleRows, setWorkScheduleRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null) // shown inline in JobFormModal, not the page banner
  const [busy, setBusy] = useState(false)

  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [crewFilter, setCrewFilter] = useState('')

  const [draggingJobId, setDraggingJobId] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [editingJob, setEditingJob] = useState(undefined) // undefined = closed, null = new, job = edit
  const [quickCreateDate, setQuickCreateDate] = useState(null)
  const [equipDropTarget, setEquipDropTarget] = useState(null) // { job, equipmentId, equipmentName }
  const [rainDayOpen, setRainDayOpen] = useState(false)
  const [workDayOpen, setWorkDayOpen] = useState(false)

  const workSchedule = useMemo(() => buildWorkScheduleMap(workScheduleRows), [workScheduleRows])

  async function loadAll() {
    const [jobsRes, crewsRes, equipmentRes, workersRes, availRes, bookingsRes, wsRes] = await Promise.all([
      apiGet('/api/jobs'), apiGet('/api/crews'), apiGet('/api/equipment'), apiGet('/api/workers'),
      apiGet('/api/crew-availability'), apiGet('/api/equipment-bookings'), apiGet('/api/work-schedule'),
    ])
    if (jobsRes.error) setError(jobsRes.error)
    setJobs(jobsRes.jobs || [])
    setCrews(crewsRes.crews || [])
    setEquipment(equipmentRes.equipment || [])
    setWorkers(workersRes.workers || [])
    setAvailability(availRes.availability || [])
    setBookings(bookingsRes.bookings || [])
    setWorkScheduleRows(wsRes.workSchedule || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const jobId = searchParams.get('job')
    if (jobId && jobs.length > 0) {
      const job = jobs.find(j => j.id === jobId)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- open the job named in the URL, then clear the param
      if (job) setSelectedJob(job)
      router.replace('/dashboard/schedule')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, jobs])

  async function refreshAll() {
    await loadAll()
    refreshJobs()
  }

  // ---- job panel / form ----
  const openJob = (job) => { setSelectedJob(job); setEditingJob(undefined) }
  const closePanel = () => setSelectedJob(null)

  const openEdit = (job) => { setSelectedJob(null); setFormError(null); setEditingJob(job) }
  const openCreate = () => { setSelectedJob(null); setFormError(null); setEditingJob(null) }
  const closeForm = () => { setEditingJob(undefined); setFormError(null) }

  // A conflict rejected by the server (a race with another save, since the
  // client already checked what it knew about) shows inline in the modal —
  // not the page's background error banner, which sits behind the modal
  // overlay where the user would never see it — and the form stays open so
  // nothing looks like it silently vanished.
  const handleFormSubmit = async (payload) => {
    setBusy(true)
    setFormError(null)
    const isEdit = editingJob && editingJob.id
    const res = isEdit
      ? await apiPatch('/api/jobs', { id: editingJob.id, ...payload })
      : await apiPost('/api/jobs', payload)
    setBusy(false)
    if (res.error) { setFormError(res.error); return }
    closeForm()
    await refreshAll()
  }

  const handleDeleteJob = async (job) => {
    if (!confirm(`Delete "${job.name}"?`)) return
    setBusy(true)
    await apiDelete('/api/jobs', { id: job.id })
    setBusy(false)
    setSelectedJob(null)
    closeForm()
    await refreshAll()
  }

  const handleStatusChange = async (job, action) => {
    await apiPatch('/api/jobs', { id: job.id, status: action })
    await refreshAll()
    setSelectedJob(null)
  }

  const handlePanelRainDay = async (job) => {
    // Delegate to the same rain-day endpoint the toolbar button uses, so the
    // date gets recorded in work_schedule and every affected job (not just
    // this one) shifts consistently.
    const today = new Date().toISOString().slice(0, 10)
    const rainDate = job.start_date && job.end_date && job.start_date <= today && today <= job.end_date
      ? today
      : job.start_date
    await apiPost('/api/jobs/rain-day', { date: rainDate })
    await refreshAll()
    setSelectedJob(null)
  }

  // ---- quick create ----
  const handleQuickCreate = async ({ name, crew_id, start_date, end_date }) => {
    setBusy(true)
    const res = await apiPost('/api/jobs', { name, crew_id, start_date, end_date, duration_days: 1 })
    setBusy(false)
    if (res.error) { setError(res.error); return }
    setQuickCreateDate(null)
    await refreshAll()
  }

  // ---- drag to schedule / reschedule / unschedule ----
  const handleDropOnDate = async (dateStr) => {
    const jobId = draggingJobId
    setDraggingJobId(null)
    if (!jobId) return
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    const duration = job.duration_days || 1
    const newEnd = computeEndDate(dateStr, duration, workSchedule)
    const res = await apiPatch('/api/jobs', { id: job.id, start_date: dateStr, end_date: newEnd, duration_days: duration })
    if (res.error) { setError(res.error); return }
    await refreshAll()
  }

  const handleDropUnschedule = async () => {
    const jobId = draggingJobId
    setDraggingJobId(null)
    if (!jobId) return
    const job = jobs.find(j => j.id === jobId)
    if (!job || !job.start_date) return
    await apiPatch('/api/jobs', { id: job.id, start_date: null, end_date: null })
    await refreshAll()
  }

  // ---- board view ----
  const handleDropStatus = async (statusKey) => {
    const jobId = draggingJobId
    setDraggingJobId(null)
    if (!jobId) return
    await apiPatch('/api/jobs', { id: jobId, status: statusKey })
    await refreshAll()
  }

  const handleDropCrewOnJob = async (jobId, crewId) => {
    const res = await apiPatch('/api/jobs', { id: jobId, crew_id: crewId })
    if (res.error) { setError(res.error); return }
    await refreshAll()
  }

  const handleDropEquipmentOnJob = (jobId, equipmentId, job) => {
    const eq = equipment.find(e => e.id === equipmentId)
    setEquipDropTarget({ job, equipmentId, equipmentName: eq?.name || 'Equipment' })
  }

  const closeEquipModal = () => setEquipDropTarget(null)

  const handleEquipPermanent = async () => {
    if (!equipDropTarget) return
    setBusy(true)
    await apiPost('/api/perm-equipment', { crew_id: equipDropTarget.job.crew_id, equipment_id: equipDropTarget.equipmentId })
    setBusy(false)
    setEquipDropTarget(null)
    await refreshAll()
  }

  const handleEquipThisJob = async () => {
    if (!equipDropTarget) return
    setBusy(true)
    const res = await apiPost('/api/equipment-bookings', {
      equipment_id: equipDropTarget.equipmentId, job_id: equipDropTarget.job.id,
      start_date: equipDropTarget.job.start_date, end_date: equipDropTarget.job.end_date,
    })
    setBusy(false)
    if (res.error) { setError(res.error); return }
    setEquipDropTarget(null)
    await refreshAll()
  }

  const handleEquipPickDates = async (start, end) => {
    if (!equipDropTarget) return
    setBusy(true)
    const res = await apiPost('/api/equipment-bookings', {
      equipment_id: equipDropTarget.equipmentId, job_id: equipDropTarget.job.id,
      start_date: start, end_date: end,
    })
    setBusy(false)
    if (res.error) { setError(res.error); return }
    setEquipDropTarget(null)
    await refreshAll()
  }

  // ---- rain day / work day ----
  const handleRainDay = async (date) => {
    setBusy(true)
    await apiPost('/api/jobs/rain-day', { date })
    setBusy(false)
    setRainDayOpen(false)
    await refreshAll()
  }

  const handleWorkDay = async (date, type) => {
    setBusy(true)
    const res = await apiPost('/api/work-schedule', { date, type })
    setBusy(false)
    if (res.error) { setError(res.error); return }
    setWorkDayOpen(false)
    await refreshAll()
  }

  if (loading) return (
    <div>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Schedule</h2>
      </div>
      <Skeleton height="60vh" />
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Schedule</h2>
        <div style={styles.toolbarRight}>
          <div style={styles.viewToggle}>
            {VIEWS.map(v => (
              <button key={v.key} onClick={() => setView(v.key)} style={{ ...styles.viewBtn, ...(view === v.key ? styles.viewBtnActive : {}) }}>
                {v.label}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => setRainDayOpen(true)}><CloudRain size={15} />Rain day</button>
          <button className="btn btn-secondary" onClick={() => setWorkDayOpen(true)}><CalendarClock size={15} />Work day</button>
          <Link href="/dashboard/dispatch" target="_blank" className="btn btn-secondary"><Printer size={15} />Dispatch sheet</Link>
          <button className="btn btn-primary" onClick={() => openCreate()}><Plus size={15} />New job</button>
        </div>
      </div>

      {error && <div style={shared.errorBox}>{error}</div>}

      {view === 'month' && (
        <div style={styles.monthToolbar}>
          <div style={styles.nav}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>←</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }}>Today</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>→</button>
          </div>
          <div style={styles.monthLabel}>{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
        </div>
      )}

      <div style={styles.main}>
        {(view === 'month' || view === 'week') && (
          <UnscheduledPanel
            jobs={jobs}
            draggingJobId={draggingJobId}
            onJobDragStart={setDraggingJobId}
            onJobDragEnd={() => setDraggingJobId(null)}
            onDropUnschedule={handleDropUnschedule}
            onJobClick={openJob}
          />
        )}
        <div style={styles.calendarArea}>
          {view === 'month' && (
            <MonthView
              cursor={cursor}
              jobs={jobs}
              availability={availability}
              bookings={bookings}
              equipment={equipment}
              workSchedule={workSchedule}
              draggingJobId={draggingJobId}
              onCellClick={setQuickCreateDate}
              onJobClick={openJob}
              onJobDragStart={setDraggingJobId}
              onJobDragEnd={() => setDraggingJobId(null)}
              onDropOnDate={handleDropOnDate}
            />
          )}
          {view === 'week' && (
            <WeekView
              jobs={jobs}
              availability={availability}
              bookings={bookings}
              equipment={equipment}
              workSchedule={workSchedule}
              draggingJobId={draggingJobId}
              onCellClick={setQuickCreateDate}
              onJobClick={openJob}
              onJobDragStart={setDraggingJobId}
              onJobDragEnd={() => setDraggingJobId(null)}
              onDropOnDate={handleDropOnDate}
            />
          )}
          {view === 'board' && (
            <BoardView
              jobs={jobs}
              crews={crews}
              equipment={equipment}
              crewFilter={crewFilter}
              onCrewFilterChange={setCrewFilter}
              draggingJobId={draggingJobId}
              onJobDragStart={setDraggingJobId}
              onJobDragEnd={() => setDraggingJobId(null)}
              onDropStatus={handleDropStatus}
              onJobClick={openJob}
              onDropCrewOnJob={handleDropCrewOnJob}
              onDropEquipmentOnJob={handleDropEquipmentOnJob}
            />
          )}
        </div>
      </div>

      {selectedJob && (
        <JobPanel
          job={jobs.find(j => j.id === selectedJob.id) || selectedJob}
          workers={workers}
          jobs={jobs}
          bookings={bookings}
          onClose={closePanel}
          onEdit={openEdit}
          onStatusChange={handleStatusChange}
          onRainDay={handlePanelRainDay}
          onDelete={handleDeleteJob}
          onSelectJob={openJob}
        />
      )}

      {editingJob !== undefined && (
        <JobFormModal
          key={editingJob?.id || 'new'}
          editingJob={editingJob}
          crews={crews}
          equipment={equipment}
          jobs={jobs}
          availability={availability}
          bookings={bookings}
          workSchedule={workSchedule}
          saving={busy}
          submitError={formError}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          onDelete={handleDeleteJob}
        />
      )}

      {quickCreateDate && (
        <QuickCreatePopover
          date={quickCreateDate}
          crews={crews}
          saving={busy}
          onClose={() => setQuickCreateDate(null)}
          onCreate={handleQuickCreate}
        />
      )}

      {equipDropTarget && (
        <EquipmentDurationModal
          job={equipDropTarget.job}
          equipmentId={equipDropTarget.equipmentId}
          equipmentName={equipDropTarget.equipmentName}
          saving={busy}
          onClose={closeEquipModal}
          onPermanent={handleEquipPermanent}
          onThisJob={handleEquipThisJob}
          onPickDates={handleEquipPickDates}
        />
      )}

      {rainDayOpen && <RainDayModal saving={busy} onClose={() => setRainDayOpen(false)} onConfirm={handleRainDay} />}
      {workDayOpen && <WorkDayModal saving={busy} onClose={() => setWorkDayOpen(false)} onConfirm={handleWorkDay} />}
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  viewToggle: { display: 'flex', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS, overflow: 'hidden' },
  viewBtn: { background: 'transparent', border: 'none', color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '13px', padding: '8px 14px', cursor: 'pointer', transition: 'background-color 150ms ease, color 150ms ease' },
  viewBtnActive: { background: COLORS.border, color: COLORS.textPrimary },
  monthToolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '0.75rem' },
  nav: { display: 'flex', alignItems: 'center', gap: '8px' },
  monthLabel: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.4rem', letterSpacing: '1px', textTransform: 'uppercase', color: COLORS.textPrimary },
  main: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'stretch', gap: '12px' },
  calendarArea: { flex: 1, minWidth: 0 },
}
