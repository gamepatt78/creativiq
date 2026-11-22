import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  BrainCircuit, ChevronLeft, ChevronRight, LayoutDashboard, LogOut,
  Megaphone, Menu, RefreshCw, Search, Settings, Users, X,
} from 'lucide-react'
import Login from './pages/Login'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { useAdvertisements } from './hooks/useAdvertisements'

const DashboardRoutes = lazy(() =>
  import('./pages/DashboardRoutes').then((module) => ({ default: module.DashboardRoutes }))
)

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/ads', label: 'Advertisements', icon: Megaphone },
  { to: '/compare', label: 'Creative Comparison', icon: Users },
  { to: '/insights', label: 'AI Insights', icon: BrainCircuit },
]

const pageTitles = {
  '/': 'Overview',
  '/ads': 'Advertisements',
  '/compare': 'Creative Comparison',
  '/insights': 'AI Insights',
  '/settings': 'Settings',
}

function RouteLoadingState() {
  return (
    <div className="page-content" aria-label="Loading dashboard page">
      <div className="loading-layout">
        <div className="skeleton skeleton-kpis">{[0,1,2,3].map((item) => <span key={item} />)}</div>
        <div className="skeleton skeleton-chart" />
      </div>
    </div>
  )
}

function Shell({ children, refresh, onSignOut }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar') === 'collapsed')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  useEffect(() => {
    localStorage.setItem('sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => {
    document.title = 'CreativIQ | AI Ad Intelligence'
  }, [])

  const current = location.pathname.startsWith('/ads/')
    ? 'Advertisement Detail'
    : pageTitles[location.pathname] || 'Overview'

  const submitSearch = (event) => {
    event.preventDefault()
    if (globalSearch.trim()) {
      window.dispatchEvent(new CustomEvent('mysivi-search', { detail: globalSearch.trim() }))
    }
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Primary navigation">
        <div className="brand-row">
          <Link className="brand" to="/" onClick={() => setMobileOpen(false)} aria-label="CreativIQ overview">
            <span className="brand-mark"><BrainCircuit size={18}/></span>
            <span className="brand-copy"><strong>CreativIQ</strong><small>AI-Powered Creative Intelligence</small></span>
          </Link>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18}/></button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`nav-link ${location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18}/><span>{label}</span>
              {location.pathname === to && <i/>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/settings" onClick={() => setMobileOpen(false)} className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`} title={collapsed ? 'Settings' : undefined}>
            <Settings size={18}/><span>Settings</span>
          </Link>
          <div className="account-row">
            <div className="account-avatar">CI</div>
            <div className="account-copy"><strong>CreativIQ Workspace</strong><span>Admin workspace</span></div>
            <button onClick={onSignOut} aria-label="Sign out"><LogOut size={16}/></button>
          </div>
        </div>
        <button className="collapse-button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}
        </button>
      </aside>
      {mobileOpen && <button className="mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19}/></button>
            <div><span>CreativIQ</span><strong>{current}</strong></div>
          </div>
          <div className="topbar-actions">
            <form className="global-search" onSubmit={submitSearch}>
              <Search size={16}/><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search creatives" aria-label="Search creatives"/><kbd>⌘ K</kbd>
            </form>
            <button className="refresh-button" onClick={refresh}><RefreshCw size={15}/><span>Refresh data</span></button>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function ProtectedApp() {
  const [session, setSession] = useState(() => isSupabaseConfigured ? undefined : null)
  const data = useAdvertisements(Boolean(session))

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (active) setSession(error ? null : sessionData.session)
    }).catch(() => {
      if (active) setSession(null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  if (session === undefined) return <div className="auth-loading"><div className="skeleton auth-skeleton"/></div>
  if (!session) return <Login/>

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      setSession(null)
    }
  }

  return (
    <Shell refresh={data.refresh} onSignOut={signOut}>
      <Suspense fallback={<RouteLoadingState/>}>
        <DashboardRoutes ads={data.ads} loading={data.loading} error={data.error} refresh={data.refresh}/>
      </Suspense>
    </Shell>
  )
}

export default ProtectedApp
