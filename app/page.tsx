import Link from 'next/link'
import { COLORS, FONT_COND } from '../lib/theme'

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Ground<span style={styles.accent}>Work</span></h1>
        <div style={styles.headerLinks}>
          <Link href="/login" style={styles.loginLink}>Sign in</Link>
          <Link href="/signup" className="btn btn-primary">Get started</Link>
        </div>
      </div>

      <main style={styles.hero}>
        <div style={styles.heroTag}>CREW MANAGEMENT, SIMPLIFIED</div>
        <h2 style={styles.heroTitle}>
          Run your landscaping<br />crews <span style={styles.accent}>without the chaos.</span>
        </h2>
        <p style={styles.heroSub}>
          Schedule crews, track equipment, and manage jobs from one dashboard —
          built for landscaping companies that are done wrangling spreadsheets.
        </p>
        <div style={styles.heroActions}>
          <Link href="/signup" className="btn btn-accent" style={styles.heroBtn}>Start free</Link>
          <Link href="/login" className="btn btn-secondary" style={styles.heroBtn}>Sign in</Link>
        </div>

        <div style={styles.features}>
          {[
            { title: 'Crews', desc: 'Organize crews, foremen, and availability in one place.' },
            { title: 'Jobs', desc: 'Track jobs from scheduled to complete.' },
            { title: 'Equipment', desc: 'Know what equipment is assigned where.' },
          ].map(f => (
            <div key={f.title} className="card" style={styles.featureCard}>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} GroundWork</span>
      </footer>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' as const },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '64px',
    borderBottom: `1px solid ${COLORS.borderSubtle}`, background: COLORS.sidebarBg,
  },
  logo: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.3rem', letterSpacing: '2px', textTransform: 'uppercase' as const, color: COLORS.textPrimary, margin: 0 },
  accent: { color: COLORS.yellow },
  headerLinks: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
  loginLink: { color: COLORS.textSecondary, textDecoration: 'none', fontSize: '0.85rem' },
  hero: {
    flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    textAlign: 'center' as const, padding: '5rem 1.5rem 3rem', maxWidth: '900px', margin: '0 auto',
  },
  heroTag: {
    fontFamily: "'Inconsolata', monospace", fontSize: '0.72rem', letterSpacing: '3px', color: COLORS.yellow,
    marginBottom: '1.25rem',
  },
  heroTitle: { fontFamily: FONT_COND, fontWeight: 700, fontSize: '2.8rem', lineHeight: 1.15, margin: '0 0 1.25rem' },
  heroSub: { color: COLORS.textSecondary, fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '560px', margin: '0 0 2.25rem' },
  heroActions: { display: 'flex', gap: '1rem', marginBottom: '4rem' },
  heroBtn: { padding: '0.85rem 1.75rem', fontSize: '0.95rem' },
  features: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', width: '100%' },
  featureCard: { padding: '20px', textAlign: 'left' as const },
  featureTitle: { fontSize: '0.95rem', fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 0.5rem' },
  featureDesc: { color: COLORS.textSecondary, fontSize: '0.85rem', lineHeight: 1.5, margin: 0 },
  footer: {
    borderTop: `1px solid ${COLORS.borderSubtle}`, padding: '1.5rem 2rem', textAlign: 'center' as const,
    color: COLORS.textMuted, fontSize: '0.78rem',
  },
}
