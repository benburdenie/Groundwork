'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Calendar, Users, Truck, HardHat, LogOut } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { apiGet } from '../../lib/api'
import { COLORS, FONT_COND, FONT_MONO } from '../../lib/theme'
import { JobsProvider } from './JobsContext'
import OverdueBanner from './OverdueBanner'
import Search from './Search'

const NAV_ITEMS = [
  { href: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/dashboard/crews', label: 'Crews', icon: Users },
  { href: '/dashboard/equipment', label: 'Equipment', icon: Truck },
  { href: '/dashboard/workers', label: 'Workers', icon: HardHat },
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
    <JobsProvider>
      <div style={styles.appShell}>
        <header style={styles.topbar} className="print-hide">
          <div style={styles.topbarLeft}>
            <div style={styles.logoArea}>
              <div style={styles.logoBar} />
              <span style={styles.logoText}>Ground<span style={styles.accent}>Work</span></span>
            </div>
            <nav style={styles.navTabs}>
              {NAV_ITEMS.map(item => {
                const active = pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`nav-item${active ? ' active' : ''}`}
                  >
                    <Icon size={16} strokeWidth={2} />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div style={styles.topbarRight}>
            <Search />
            <div style={styles.headerRight}>
              {company?.name && <span style={styles.companyName}>{company.name}</span>}
              <span style={styles.userEmail}>{user?.email}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleSignOut}>
                <LogOut size={14} strokeWidth={2} />
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="print-hide"><OverdueBanner /></div>

        <main style={styles.main}>
          {children}
        </main>
      </div>
    </JobsProvider>
  )
}

const styles = {
  appShell: { minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, display: 'flex', flexDirection: 'column' },
  loadingFull: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: COLORS.textMuted, fontFamily: FONT_MONO, letterSpacing: '2px', width: '100%' },

  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem',
    padding: '0 24px', height: '60px', flexShrink: 0, flexWrap: 'wrap',
    background: COLORS.sidebarBg, borderBottom: `1px solid ${COLORS.borderSubtle}`,
    position: 'sticky', top: 0, zIndex: 400,
  },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: '28px', minWidth: 0 },
  logoArea: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  logoBar: { width: '4px', height: '22px', background: COLORS.yellow, borderRadius: '2px' },
  logoText: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.2rem', letterSpacing: '1.5px', textTransform: 'uppercase', lineHeight: 1, color: COLORS.textPrimary },
  accent: { color: COLORS.yellow },

  navTabs: { display: 'flex', alignItems: 'center', gap: '4px', height: '100%' },

  topbarRight: { display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0, marginLeft: 'auto' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 },
  companyName: { fontFamily: FONT_MONO, fontSize: '0.7rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: COLORS.textSecondary },
  userEmail: { fontFamily: FONT_MONO, fontSize: '0.68rem', color: COLORS.textMuted, display: 'none' },

  main: { flex: 1, minWidth: 0, padding: '32px 32px 48px' },
}
