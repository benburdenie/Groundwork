import Link from 'next/link'
import { COLORS, FONT_COND } from '../../lib/theme'

export const metadata = {
  title: 'Privacy Policy — GroundWork',
}

export default function PrivacyPolicy() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link href="/" style={styles.logo}>Ground<span style={styles.accent}>Work</span></Link>
        <Link href="/" style={styles.backLink}>&larr; Back to home</Link>
      </div>

      <main style={styles.main}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: September 16, 2026</p>

        <p style={styles.p}>
          GroundWork (&ldquo;GroundWork,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) provides crew, job, and
          equipment scheduling software for landscaping and field service companies. This Privacy Policy explains
          what personal information we collect, why we collect it, how we protect it, and the choices you have.
          It is written to comply with Canada&apos;s Personal Information Protection and Electronic Documents Act
          (PIPEDA).
        </p>
        <p style={styles.p}>
          By using GroundWork, you agree to the collection and use of information in accordance with this policy.
        </p>

        <h2 style={styles.h2}>Information We Collect</h2>
        <p style={styles.p}>When you sign up for and use GroundWork, we collect:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>Account information: your name, email address, and password (stored securely as a hash, never in plain text)</li>
          <li style={styles.li}>Company information: your company name</li>
          <li style={styles.li}>Contact details you add to the platform: phone numbers for workers and job clients</li>
          <li style={styles.li}>Job and scheduling data: job details, addresses, crew assignments, equipment assignments, and scheduling information you enter to run your business</li>
        </ul>
        <p style={styles.p}>
          We do not collect sensitive personal information (health records, financial account numbers, government
          ID numbers) unless you choose to enter it into free-text fields, which we recommend you avoid.
        </p>

        <h2 style={styles.h2}>Why We Collect It</h2>
        <p style={styles.p}>We only use the information above to operate GroundWork:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>to create and manage your account and company workspace</li>
          <li style={styles.li}>to let you and your team schedule crews, jobs, and equipment</li>
          <li style={styles.li}>to authenticate you when you log in</li>
          <li style={styles.li}>to communicate with you about your account (e.g., password resets, service notices)</li>
          <li style={styles.li}>to respond to support requests</li>
        </ul>
        <p style={styles.p}>
          We do not use your data for advertising, and we do not build behavioral profiles for marketing purposes.
        </p>

        <h2 style={styles.h2}>How We Store and Protect Your Data</h2>
        <p style={styles.p}>
          Your data is stored in a Supabase-managed PostgreSQL database hosted on Amazon Web Services (AWS)
          infrastructure. Access to your company&apos;s data is restricted using row-level security policies, so
          only authenticated users belonging to your company can read or write your company&apos;s records. All
          traffic to GroundWork is encrypted in transit (HTTPS/TLS).
        </p>

        <h2 style={styles.h2}>We Don&apos;t Sell Your Data</h2>
        <p style={styles.p}>
          GroundWork does not sell, rent, or trade your personal information to third parties. We share data only
          with the service providers necessary to run GroundWork (currently Supabase and AWS, who process data on
          our behalf under their own security and confidentiality commitments), or when required by law.
        </p>

        <h2 style={styles.h2}>Cookies</h2>
        <p style={styles.p}>
          GroundWork uses cookies only to keep you signed in — to store your authentication session. We do not use
          cookies for advertising or third-party tracking.
        </p>

        <h2 style={styles.h2}>How Long We Keep Your Data</h2>
        <p style={styles.p}>
          We retain your data for as long as your account is active. If you delete your account, we delete your
          personal information within a reasonable timeframe, except where we&apos;re required to retain limited
          records by law.
        </p>

        <h2 style={styles.h2}>Your Rights and Requesting Deletion</h2>
        <p style={styles.p}>
          Under PIPEDA, you have the right to access the personal information we hold about you, correct
          inaccuracies, and withdraw your consent to our processing of it (which may mean we can no longer provide
          the service to you).
        </p>
        <p style={styles.p}>
          To request access, correction, or deletion of your data, email us at{' '}
          <a href="mailto:hello@groundwork.app" style={styles.link}>hello@groundwork.app</a>. We&apos;ll respond
          and act on your request within a reasonable time.
        </p>

        <h2 style={styles.h2}>Children&apos;s Privacy</h2>
        <p style={styles.p}>
          GroundWork is a business tool and is not directed at, or intended for use by, children.
        </p>

        <h2 style={styles.h2}>Changes to This Policy</h2>
        <p style={styles.p}>
          We may update this Privacy Policy from time to time. If we make material changes, we&apos;ll notify you
          by email or through the app. Continued use of GroundWork after changes take effect means you accept the
          updated policy.
        </p>

        <h2 style={styles.h2}>Contact Us</h2>
        <p style={styles.p}>
          Questions about this policy or how we handle your data? Email us at{' '}
          <a href="mailto:hello@groundwork.app" style={styles.link}>hello@groundwork.app</a>.
        </p>
      </main>

      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} GroundWork</span>
        <span style={styles.footerDot}>·</span>
        <Link href="/terms" style={styles.footerLink}>Terms of Service</Link>
      </footer>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '64px',
    borderBottom: `1px solid ${COLORS.borderSubtle}`, background: COLORS.sidebarBg,
  },
  logo: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.2rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.textPrimary, textDecoration: 'none' },
  accent: { color: COLORS.yellow },
  backLink: { color: COLORS.textSecondary, textDecoration: 'none', fontSize: '0.85rem' },
  main: { flex: 1, maxWidth: '760px', width: '100%', margin: '0 auto', padding: '3rem 1.5rem 4rem' },
  title: { fontFamily: FONT_COND, fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem' },
  updated: { color: COLORS.textMuted, fontSize: '0.82rem', fontFamily: "'Inconsolata', monospace", margin: '0 0 2.5rem' },
  h2: {
    fontFamily: "'Inconsolata', monospace", fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase',
    color: COLORS.textPrimary, margin: '2.25rem 0 0.9rem', paddingBottom: '0.6rem', borderBottom: `1px solid ${COLORS.borderSubtle}`,
  },
  p: { color: COLORS.textSecondary, fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 1rem' },
  ul: { margin: '0 0 1rem', paddingLeft: '1.25rem' },
  li: { color: COLORS.textSecondary, fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '0.4rem' },
  link: { color: COLORS.primary, textDecoration: 'none' },
  footer: {
    borderTop: `1px solid ${COLORS.borderSubtle}`, padding: '1.5rem 2rem', textAlign: 'center',
    color: COLORS.textMuted, fontSize: '0.78rem',
  },
  footerDot: { margin: '0 0.6rem', color: COLORS.border },
  footerLink: { color: COLORS.textSecondary, textDecoration: 'none' },
}
