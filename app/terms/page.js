import Link from 'next/link'
import { COLORS, FONT_COND } from '../../lib/theme'

export const metadata = {
  title: 'Terms of Service — GroundWork',
}

export default function TermsOfService() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link href="/" style={styles.logo}>Ground<span style={styles.accent}>Work</span></Link>
        <Link href="/" style={styles.backLink}>&larr; Back to home</Link>
      </div>

      <main style={styles.main}>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: September 16, 2026</p>

        <p style={styles.p}>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of GroundWork
          (&ldquo;GroundWork,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a crew, job, and
          equipment scheduling platform. By creating an account or using GroundWork, you agree to these Terms. If
          you don&apos;t agree, please don&apos;t use the service.
        </p>

        <h2 style={styles.h2}>1. Acceptance of Terms</h2>
        <p style={styles.p}>
          By accessing or using GroundWork, you confirm that you have read, understood, and agree to be bound by
          these Terms and our <Link href="/privacy" style={styles.link}>Privacy Policy</Link>. You must be at least
          18 years old and authorized to act on behalf of the company you register, if applicable.
        </p>

        <h2 style={styles.h2}>2. Description of Service</h2>
        <p style={styles.p}>
          GroundWork is a software-as-a-service platform that helps landscaping and field service companies
          schedule crews, manage jobs, and track equipment. We may add, change, or remove features at any time,
          and we&apos;ll try to give reasonable notice of any change that materially reduces functionality you
          rely on.
        </p>

        <h2 style={styles.h2}>3. Your Account &amp; Responsibilities</h2>
        <p style={styles.p}>You&apos;re responsible for:</p>
        <ul style={styles.ul}>
          <li style={styles.li}>providing accurate, current information when you create your account and keeping it up to date</li>
          <li style={styles.li}>keeping your login credentials confidential and for all activity that happens under your account</li>
          <li style={styles.li}>using GroundWork only for lawful business purposes, and not to store or transmit content that is illegal, infringing, or harmful</li>
          <li style={styles.li}>not attempting to disrupt, reverse-engineer, or gain unauthorized access to GroundWork or other users&apos; data</li>
        </ul>
        <p style={styles.p}>
          If you become aware of unauthorized use of your account, contact us immediately at{' '}
          <a href="mailto:hello@groundwork.app" style={styles.link}>hello@groundwork.app</a>.
        </p>

        <h2 style={styles.h2}>4. Suspension &amp; Termination</h2>
        <p style={styles.p}>
          We may suspend or terminate your access to GroundWork, without notice, if we reasonably believe
          you&apos;ve violated these Terms, misused the platform, or created risk or legal exposure for us or
          other users. You may stop using GroundWork and close your account at any time by contacting us at{' '}
          <a href="mailto:hello@groundwork.app" style={styles.link}>hello@groundwork.app</a>.
        </p>

        <h2 style={styles.h2}>5. Disclaimer of Warranties</h2>
        <p style={styles.p}>
          GroundWork is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any
          kind, whether express or implied. We don&apos;t guarantee that the service will be uninterrupted,
          error-free, or completely secure.
        </p>

        <h2 style={styles.h2}>6. Limitation of Liability</h2>
        <p style={styles.p}>
          To the fullest extent permitted by law, GroundWork and its owners are not liable for any indirect,
          incidental, special, or consequential damages — including, without limitation, loss of data, loss of
          business, loss of profits, or business interruption — arising from or related to your use of, or
          inability to use, GroundWork, even if we&apos;ve been advised of the possibility of such damages.
          Nothing in these Terms limits liability that cannot be limited under applicable law.
        </p>

        <h2 style={styles.h2}>7. Your Data</h2>
        <p style={styles.p}>
          You retain ownership of the data you enter into GroundWork. You&apos;re responsible for maintaining your
          own backups of critical business information. See our{' '}
          <Link href="/privacy" style={styles.link}>Privacy Policy</Link> for how we collect, use, and protect
          your data.
        </p>

        <h2 style={styles.h2}>8. Governing Law</h2>
        <p style={styles.p}>
          These Terms are governed by the laws of the Province of British Columbia and the federal laws of Canada
          applicable therein, without regard to conflict-of-law principles. You agree that any dispute arising
          from these Terms or your use of GroundWork will be subject to the exclusive jurisdiction of the courts
          located in British Columbia, Canada.
        </p>

        <h2 style={styles.h2}>9. Changes to These Terms</h2>
        <p style={styles.p}>
          We may update these Terms from time to time. If we make material changes, we&apos;ll notify you by
          email or through the app. Continued use of GroundWork after changes take effect means you accept the
          updated Terms.
        </p>

        <h2 style={styles.h2}>10. Contact</h2>
        <p style={styles.p}>
          Questions about these Terms? Email us at{' '}
          <a href="mailto:hello@groundwork.app" style={styles.link}>hello@groundwork.app</a>.
        </p>
      </main>

      <footer style={styles.footer}>
        <span>© {new Date().getFullYear()} GroundWork</span>
        <span style={styles.footerDot}>·</span>
        <Link href="/privacy" style={styles.footerLink}>Privacy Policy</Link>
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
