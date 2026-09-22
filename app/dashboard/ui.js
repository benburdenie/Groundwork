'use client'

import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { COLORS, FONT_COND, FONT_BODY, RADIUS } from '../../lib/theme'

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

// A prominent, self-dismissing notification for errors that happen behind a
// modal that's about to close (a 409 conflict on an assignment action, say) —
// unlike the page's inline error banner, this can't end up hidden behind
// whatever overlay was open when the error occurred.
export function Toast({ message, onClose, durationMs = 6000 }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, durationMs)
    return () => clearTimeout(timer)
  }, [message, onClose, durationMs])

  if (!message) return null
  return (
    <div style={toastStyles.wrap} role="alert">
      <AlertTriangle size={16} color={COLORS.danger} style={{ flexShrink: 0 }} />
      <span style={toastStyles.text}>{message}</span>
      <button style={toastStyles.close} onClick={onClose} aria-label="Dismiss">
        <X size={14} />
      </button>
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

const toastStyles = {
  wrap: {
    position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 900,
    display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '90vw',
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.danger}`, borderRadius: RADIUS,
    padding: '12px 16px', boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
  },
  text: { fontFamily: FONT_BODY, fontSize: '0.85rem', color: COLORS.textPrimary },
  close: { background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', display: 'flex', flexShrink: 0, marginLeft: '4px' },
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
