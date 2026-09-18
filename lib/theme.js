// Design tokens — premium dark theme, green accent. Every component should
// pull colors, spacing, and type from here rather than hardcoding values.

export const COLORS = {
  bg: '#0f1117',
  sidebarBg: '#0d0f18',
  surface: '#1a1d27',
  surfaceRaised: '#222638',
  border: '#2d3148',
  borderSubtle: '#1e2135',
  borderHover: '#3d4168',

  primary: '#22c55e',
  primaryHover: '#16a34a',
  primarySubtle: '#052e16',

  yellow: '#f5c800',
  yellowSubtle: '#1a1500',

  danger: '#ef4444',
  dangerSubtle: '#2a0d0d',

  blue: '#3b82f6',
  blueSubtle: '#0f1e33',

  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',

  // legacy alias kept for the couple of call sites that still read COLORS.mid
  mid: '#94a3b8',
}

export const FONT_COND = "'Barlow Condensed', sans-serif" // headings + logo only
export const FONT_BODY = "'Inter', sans-serif" // primary UI font
export const FONT_MONO = "'Inconsolata', monospace" // status tags, codes, mono labels

export const RADIUS = '8px'
export const RADIUS_SM = '6px'

// Status -> color mapping used across equipment + job badges.
export const STATUS_COLORS = {
  available: COLORS.primary,
  inprogress: COLORS.primary,
  inuse: COLORS.yellow,
  notstarted: COLORS.textSecondary,
  repair: COLORS.danger,
  overdue: COLORS.danger,
  assigned: COLORS.blue,
  complete: COLORS.primaryHover,
}

const BADGE_TONES = {
  available: { bg: COLORS.primarySubtle, text: COLORS.primary },
  inprogress: { bg: COLORS.primarySubtle, text: COLORS.primary },
  complete: { bg: COLORS.primarySubtle, text: COLORS.primaryHover },
  notstarted: { bg: COLORS.borderSubtle, text: COLORS.textSecondary },
  overdue: { bg: COLORS.dangerSubtle, text: COLORS.danger },
  repair: { bg: COLORS.dangerSubtle, text: COLORS.danger },
  inuse: { bg: COLORS.yellowSubtle, text: COLORS.yellow },
  assigned: { bg: COLORS.blueSubtle, text: COLORS.blue },
}

export const STATUS_LABELS = {
  available: 'Available',
  inuse: 'In use',
  repair: 'In repair',
  assigned: 'Assigned',
  notstarted: 'Not started',
  inprogress: 'In progress',
  overdue: 'Overdue',
  complete: 'Complete',
}

export const EQUIPMENT_CATEGORIES = [
  { value: 'truck', label: 'Truck' },
  { value: 'trailer_flat', label: 'Flat deck trailer' },
  { value: 'trailer_dump', label: 'Dump trailer' },
  { value: 'trailer_equipment', label: 'Equipment trailer' },
  { value: 'machine', label: 'Machine' },
]

export const WORKER_ROLES = ['Foreman', 'Lead Hand', 'Operator', 'Driver', 'Labourer']

export const CREW_COLORS = ['#22c55e', '#f5c800', '#3b82f6', '#ec4899', '#a855f7', '#f97316', '#06b6d4']

// Shared style snippets reused across every dashboard page. Anything with a
// hover/focus/active state is driven by the matching class in globals.css
// (see .btn / .field / .card / .nav-item) — the object here only supplies the
// static, non-interactive parts that inline styles can express.
export const shared = {
  pageTitle: { fontFamily: FONT_COND, fontSize: '1.7rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', margin: 0, color: COLORS.textPrimary },
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  label: { display: 'block', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: '6px', fontFamily: FONT_BODY, fontWeight: 500 },

  group: { marginBottom: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  form: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS, padding: '20px', marginBottom: '24px' },

  card: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS, boxShadow: '0 1px 3px rgba(0,0,0,0.3)', padding: '20px' },

  errorBox: {
    background: COLORS.dangerSubtle, border: `1px solid ${COLORS.danger}40`, color: COLORS.danger,
    padding: '10px 14px', fontSize: '0.82rem', marginBottom: '16px', borderRadius: RADIUS_SM, fontFamily: FONT_BODY,
  },
  fieldError: { color: COLORS.danger, fontSize: '12px', marginTop: '6px' },
  fieldSuccess: { color: COLORS.primary, fontSize: '12px', marginTop: '6px' },

  empty: { color: COLORS.textMuted, fontSize: '0.9rem', fontFamily: FONT_BODY },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: COLORS.textMuted, fontFamily: FONT_MONO, letterSpacing: '2px' },
}

export function badgeStyle(status) {
  const tone = BADGE_TONES[status] || BADGE_TONES.notstarted
  return {
    display: 'inline-block',
    fontFamily: FONT_MONO,
    fontSize: '11px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: RADIUS_SM,
    color: tone.text,
    background: tone.bg,
    whiteSpace: 'nowrap',
  }
}
