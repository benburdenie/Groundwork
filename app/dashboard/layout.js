'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { apiGet } from '../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, FONT_BODY } from '../../lib/theme'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/crews', label: 'Crews' },
  { href: '/dashboard/equipment', label: 'Equipment' },
  { href: '/dashboard/workers', label: 'Workers' },
  { href: '/dashboard/jobs', label: 'Jobs' },
  { href: '/dashboard/calendar', label: 'Calendar' },
]

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (!active) return
      setUser(user)

      const { company } = await apiGet('/api/me')
      if (active && company) setCompany(company)
      if (active) setChecked(true)
    }
    init()
    return () => { active = false }
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!checked) return (
    <div style={styles.appShell}>
      <div style={styles.loadingFull}>Loading...</div>
    </div>
  )

  return (
    <div style={styles.appShell}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoBar} />
          <span style={styles.logoText}>Ground<span style={styles.accent}>Work</span></span>
        </div>
        <div style={styles.headerRight}>
          {company?.name && <span style={styles.companyName}>{company.name}</span>}
          <span style={styles.userEmail}>{user?.email}</span>
          <button style={styles.signOut} onClick={handleSignOut}>Sign Out</button>
        </div>
      </header>

      <div style={styles.body}>
        <nav style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>Navigation</span>
          </div>
          <div style={styles.sidebarBody}>
            {NAV_ITEMS.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        <main style={styles.main}>
          {children}
        </main>
      </div>
    </div>
  )
}

const styles = {
  appShell: { minHeight: '100vh', background: COLORS.black, color: '#fff', fontFamily: FONT_BODY, display: 'flex', flexDirection: 'column' },
  loadingFull: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555', fontFamily: FONT_MONO, letterSpacing: '2px' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.5rem', height: '54px', flexShrink: 0,
    borderBottom: `2px solid ${COLORS.yellow}`, background: '#0d0d0d',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoBar: { width: '4px', height: '26px', background: COLORS.yellow },
  logoText: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.25rem', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1, color: '#fff' },
  accent: { color: COLORS.yellow },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  companyName: { fontFamily: FONT_MONO, fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.mid },
  userEmail: { fontFamily: FONT_MONO, fontSize: '0.68rem', color: '#555', display: 'none' },
  signOut: {
    background: 'transparent', border: '1px solid #333', color: COLORS.mid,
    fontFamily: FONT_MONO, fontSize: '0.65rem', letterSpacing: '1px',
    textTransform: 'uppercase', padding: '0.35rem 0.75rem', cursor: 'pointer',
  },
  body: { display: 'flex', flex: 1, minHeight: 0 },
  sidebar: {
    width: '220px', minWidth: 0, flexShrink: 0,
    borderRight: `1px solid ${COLORS.border}`, background: COLORS.panelBg,
    display: 'flex', flexDirection: 'column',
  },
  sidebarHeader: { padding: '0.9rem 1rem', borderBottom: `1px solid ${COLORS.border}` },
  sidebarTitle: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '3px', textTransform: 'uppercase', color: COLORS.mid },
  sidebarBody: { flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' },
  navItem: {
    textAlign: 'left', background: 'transparent',
    borderTop: 'none', borderRight: 'none', borderBottom: 'none',
    borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: 'transparent',
    color: COLORS.mid, fontFamily: FONT_COND, fontWeight: 700, fontSize: '0.95rem',
    letterSpacing: '0.5px', textTransform: 'uppercase', padding: '0.6rem 0.75rem', cursor: 'pointer',
  },
  navItemActive: { color: '#fff', borderLeftColor: COLORS.yellow, background: COLORS.cardBg },
  main: { flex: 1, minWidth: 0, overflowY: 'auto', padding: '2rem 2rem 3rem' },
}
