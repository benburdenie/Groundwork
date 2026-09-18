'use client'

import { COLORS, FONT_COND, RADIUS } from '../../lib/theme'

export function Spinner({ style }) {
  return <span className="spinner" style={style} />
}

export function Skeleton({ width = '100%', height = '14px', style }) {
  return <div className="skeleton" style={{ width, height, ...style }} />
}

// A skeleton block matching the shape of a .card, for list/grid loading states.
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <Skeleton width="60%" height="18px" style={{ marginBottom: '12px' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="12px" style={{ marginBottom: '8px' }} />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div style={styles.wrap}>
      {Icon && (
        <div style={styles.iconWrap}>
          <Icon size={28} color={COLORS.textMuted} strokeWidth={1.5} />
        </div>
      )}
      <div style={styles.title}>{title}</div>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction} style={{ marginTop: '16px' }}>{actionLabel}</button>
      )}
    </div>
  )
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '4rem 1rem' },
  iconWrap: {
    width: '56px', height: '56px', borderRadius: RADIUS, background: COLORS.surface, border: `1px solid ${COLORS.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
  },
  title: { fontFamily: FONT_COND, fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textPrimary },
  subtitle: { color: COLORS.textSecondary, fontSize: '0.85rem', margin: '0.4rem 0 0', maxWidth: '360px' },
}
