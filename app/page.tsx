import Link from 'next/link'

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>Ground<span style={styles.accent}>Work</span></h1>
        <div style={styles.headerLinks}>
          <Link href="/login" style={styles.loginLink}>Sign In</Link>
          <Link href="/signup" style={styles.signupBtn}>Get Started</Link>
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
          <Link href="/signup" style={styles.primaryBtn}>Start Free</Link>
          <Link href="/login" style={styles.secondaryBtn}>Sign In</Link>
        </div>

        <div style={styles.features}>
          {[
            { title: 'Crews', desc: 'Organize crews, foremen, and availability in one place.' },
            { title: 'Jobs', desc: 'Track jobs from scheduled to complete.' },
            { title: 'Equipment', desc: 'Know what equipment is assigned where.' },
          ].map(f => (
            <div key={f.title} style={styles.featureCard}>
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
  container: { minHeight: '100vh', background: '#111', color: '#fff', fontFamily: "'Barlow', sans-serif", display: 'flex', flexDirection: 'column' as const },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '64px',
    borderBottom: '2px solid #F5C800', background: '#0d0d0d',
  },
  logo: { fontFamily: 'monospace', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '3px', textTransform: 'uppercase' as const, color: '#fff', margin: 0 },
  accent: { color: '#F5C800' },
  headerLinks: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
  loginLink: { color: '#888', textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'monospace' },
  signupBtn: {
    background: '#F5C800', color: '#111', textDecoration: 'none',
    fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '1px',
    textTransform: 'uppercase' as const, fontWeight: 700, padding: '0.55rem 1.1rem',
  },
  hero: {
    flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    textAlign: 'center' as const, padding: '5rem 1.5rem 3rem', maxWidth: '900px', margin: '0 auto',
  },
  heroTag: {
    fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '3px', color: '#F5C800',
    marginBottom: '1.25rem',
  },
  heroTitle: { fontSize: '2.6rem', lineHeight: 1.15, fontWeight: 800, margin: '0 0 1.25rem' },
  heroSub: { color: '#999', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '560px', margin: '0 0 2.25rem' },
  heroActions: { display: 'flex', gap: '1rem', marginBottom: '4rem' },
  primaryBtn: {
    background: '#F5C800', color: '#111', textDecoration: 'none',
    fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: '1px',
    textTransform: 'uppercase' as const, fontWeight: 700, padding: '0.85rem 1.75rem',
  },
  secondaryBtn: {
    background: 'transparent', color: '#fff', textDecoration: 'none', border: '1px solid #333',
    fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: '1px',
    textTransform: 'uppercase' as const, fontWeight: 700, padding: '0.85rem 1.75rem',
  },
  features: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#2a2a2a', width: '100%' },
  featureCard: { background: '#1a1a1a', padding: '1.75rem 1.5rem', textAlign: 'left' as const },
  featureTitle: { fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#F5C800', margin: '0 0 0.5rem' },
  featureDesc: { color: '#888', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 },
  footer: {
    borderTop: '1px solid #2a2a2a', padding: '1.5rem 2rem', textAlign: 'center' as const,
    color: '#555', fontSize: '0.78rem', fontFamily: 'monospace',
  },
}
