// Shared design tokens, matching the FieldOps prototype's dark industrial look.

export const COLORS = {
  black: '#111',
  yellow: '#F5C800',
  yellowDark: '#d4a900',
  white: '#F2EFE8',
  mid: '#888',
  border: '#2a2a2a',
  cardBg: '#1a1a1a',
  panelBg: '#161616',
  red: '#e84040',
  green: '#3db87a',
  greenDark: '#3a7a55',
  blue: '#4a9eff',
  orange: '#f57c28',
}

export const FONT_COND = "'Barlow Condensed', sans-serif"
export const FONT_BODY = "'Barlow', sans-serif"
export const FONT_MONO = "'Inconsolata', monospace"

// Status -> color mapping used across equipment + job badges.
export const STATUS_COLORS = {
  available: COLORS.green,
  inprogress: COLORS.green,
  inuse: COLORS.yellow,
  notstarted: COLORS.mid,
  repair: COLORS.red,
  overdue: COLORS.red,
  assigned: COLORS.blue,
  complete: COLORS.greenDark,
}

export const STATUS_LABELS = {
  available: 'Available',
  inuse: 'In Use',
  repair: 'In Repair',
  assigned: 'Assigned',
  notstarted: 'Not Started',
  inprogress: 'In Progress',
  overdue: 'Overdue',
  complete: 'Complete',
}

export const EQUIPMENT_CATEGORIES = [
  { value: 'truck', label: 'Truck' },
  { value: 'trailer_flat', label: 'Flat Deck Trailer' },
  { value: 'trailer_dump', label: 'Dump Trailer' },
  { value: 'trailer_equipment', label: 'Equipment Trailer' },
  { value: 'machine', label: 'Machine' },
]

export const WORKER_ROLES = ['Foreman', 'Lead Hand', 'Operator', 'Driver', 'Labourer']

export const CREW_COLORS = ['#F5C800', '#4CAF50', '#2196F3', '#E91E63', '#9C27B0', '#FF5722', '#00BCD4']

// Shared style snippets reused across every dashboard page.
export const shared = {
  pageTitle: { fontFamily: FONT_COND, fontSize: '1.7rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0, color: COLORS.white },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' },
  label: { display: 'block', fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.mid, marginBottom: '0.4rem', fontFamily: FONT_MONO },
  input: {
    width: '100%', background: COLORS.black, border: `1px solid #333`, color: '#fff',
    padding: '0.6rem 0.75rem', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none',
    fontFamily: FONT_BODY,
  },
  select: {
    width: '100%', background: COLORS.black, border: `1px solid #333`, color: '#fff',
    padding: '0.6rem 0.75rem', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none',
    fontFamily: FONT_BODY,
  },
  textarea: {
    width: '100%', background: COLORS.black, border: `1px solid #333`, color: '#fff',
    padding: '0.6rem 0.75rem', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none',
    fontFamily: FONT_BODY, resize: 'vertical',
  },
  group: { marginBottom: '1rem' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  form: { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, padding: '1.5rem', marginBottom: '2rem' },
  btnPrimary: {
    background: COLORS.yellow, color: COLORS.black, border: 'none',
    fontFamily: FONT_MONO, fontSize: '0.7rem', letterSpacing: '1px',
    textTransform: 'uppercase', fontWeight: 700, padding: '0.5rem 1rem', cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent', border: '1px solid #333', color: COLORS.mid,
    fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '1px',
    textTransform: 'uppercase', padding: '0.35rem 0.75rem', cursor: 'pointer',
  },
  btnDanger: {
    background: 'transparent', border: '1px solid #333', color: COLORS.red,
    fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '1px',
    textTransform: 'uppercase', padding: '0.3rem 0.7rem', cursor: 'pointer',
  },
  card: {
    background: COLORS.cardBg,
    borderTop: `1px solid ${COLORS.border}`, borderRight: `1px solid ${COLORS.border}`,
    borderBottom: `1px solid ${COLORS.border}`, borderLeft: `1px solid ${COLORS.border}`,
  },
  errorBox: {
    background: '#2a0d0d', border: '1px solid #5a1a1a', color: '#e87070',
    padding: '0.6rem 0.75rem', fontSize: '0.82rem', marginBottom: '1rem', fontFamily: FONT_MONO,
  },
  empty: { color: '#555', fontSize: '0.9rem', fontFamily: FONT_BODY },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#555', fontFamily: FONT_MONO, letterSpacing: '2px' },
}

export function badgeStyle(status) {
  const color = STATUS_COLORS[status] || COLORS.mid
  return {
    display: 'inline-block',
    fontFamily: FONT_MONO,
    fontSize: '0.62rem',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    border: `1px solid ${color}`,
    color,
    background: `${color}1a`,
    whiteSpace: 'nowrap',
  }
}
