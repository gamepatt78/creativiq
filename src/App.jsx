import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  ArrowLeft, ArrowUpRight, BrainCircuit, ChevronLeft, ChevronRight,
  CircleGauge, Eye, LayoutDashboard, LogOut,
  Megaphone, Menu, RefreshCw, Search, Settings, Target,
  TrendingUp, Users, X,
} from 'lucide-react'
import Login from './pages/Login'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { useAdvertisements } from './hooks/useAdvertisements'
import { formatDate, getCategoryScores, getScore, getScorePercent, safeArray } from './utils/adData'
import './styles/auth.css'

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

const chartColors = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#DB2777']

function getAdId(ad) {
  return String(ad?.id || ad?.ad_id || '')
}

function getHeadline(ad) {
  return ad?.headline || 'Untitled advertisement'
}

function getDisplayHeadline(ad, ads = []) {
  const headline = getHeadline(ad)
  const duplicateCount = ads.filter((item) => getHeadline(item) === headline).length
  const adId = getAdId(ad)
  return duplicateCount > 1 && adId ? `${headline} · ${adId}` : headline
}

function LoadingState() {
  return (
    <div className="loading-layout" aria-label="Loading dashboard">
      <div className="skeleton skeleton-kpis">{[0,1,2,3].map((item) => <span key={item} />)}</div>
      <div className="skeleton skeleton-chart" />
      <div className="skeleton skeleton-table" />
    </div>
  )
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <div><strong>Couldn&apos;t load analysis data</strong><p>{message}</p></div>
      <button className="button button-secondary" onClick={onRetry}><RefreshCw size={15}/>Try again</button>
    </div>
  )
}

function EmptyState({ title = 'No advertisements found', text = 'Try changing your search or filters.' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Search size={20}/></div>
      <strong>{title}</strong>
      <p>{text}</p>
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

  const current = location.pathname.startsWith('/ads/')
    ? 'Advertisement Detail'
    : pageTitles[location.pathname] || 'Overview'

  useEffect(() => {
    document.title = 'CreativIQ | AI Ad Intelligence'
  }, [])
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
          <Link className="brand" to="/" aria-label="CreativIQ overview">
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
              <Icon size={18}/>
              <span>{label}</span>
              {location.pathname === to && <i/>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
            title={collapsed ? 'Settings' : undefined}
          >
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
              <Search size={16}/>
              <input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search creatives" aria-label="Search creatives"/>
              <kbd>⌘ K</kbd>
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

function KpiCard({ icon: Icon, label, value, detail, accent = 'indigo', delay = 0 }) {
  return (
    <motion.article className="kpi-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.32 }}>
      <div className={`kpi-icon ${accent}`}><Icon size={18}/></div>
      <div className="kpi-content"><span>{label}</span><strong>{value}</strong><p>{detail}</p></div>
      <ArrowUpRight className="kpi-arrow" size={15}/>
    </motion.article>
  )
}

function ChartTooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><span>{label}</span>{payload.map((item) => <strong key={item.dataKey} style={{ color: item.color }}>{item.value}{item.dataKey === 'score' ? '/60' : ''}</strong>)}</div>
}

function DistributionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  return (
    <div className="chart-tooltip">
      <span>Creative quality</span>
      <strong style={{ color: '#2563EB' }}>{item.name}</strong>
      <strong>{item.count} {item.count === 1 ? 'advertisement' : 'advertisements'}</strong>
    </div>
  )
}

function Overview({ ads, loading, error, refresh }) {
  const metrics = useMemo(() => {
    const scored = ads.filter((ad) => getScore(ad) > 0)
    if (!scored.length) return { average: 0, pct: 0, high: null, low: null }
    const high = scored.reduce((best, ad) => getScore(ad) > getScore(best) ? ad : best)
    const low = scored.reduce((best, ad) => getScore(ad) < getScore(best) ? ad : best)
    const average = scored.reduce((sum, ad) => sum + getScore(ad), 0) / scored.length
    const pct = scored.reduce((sum, ad) => sum + getScorePercent(ad), 0) / scored.length
    return { average, pct, high, low }
  }, [ads])

  const distribution = useMemo(() => {
    const scored = ads.filter((ad) => getScore(ad) > 0)
    return Array.from({ length: 12 }, (_, index) => {
      const start = index * 5 + 1
      const end = start + 4
      const count = scored.filter((ad) => {
        const score = getScore(ad)
        return score >= start && score <= end
      }).length
      return { name: `${start}–${end}`, count }
    })
  }, [ads])

  const scoredCount = ads.filter((ad) => getScore(ad) > 0).length

  const platformData = useMemo(() => {
    const counts = {}
    ads.forEach((ad) => { const platform = ad.platform || 'Unknown'; counts[platform] = (counts[platform] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [ads])

  const ranked = [...ads].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5)

  if (loading) return <div className="page-content"><LoadingState/></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={refresh}/></div>

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div><span className="eyebrow">CREATIVE INTELLIGENCE</span><h1>Overview</h1><p>Monitor advertisement creative quality and AI-powered insights.</p></div>
        <div className="live-status"><i/>Supabase live</div>
      </div>
      <div className="kpi-grid">
        <KpiCard icon={Megaphone} label="Advertisements" value={ads.length} detail="Analyzed records" delay={0}/>
        <KpiCard icon={CircleGauge} label="Average quality" value={metrics.average ? `${metrics.average.toFixed(1)}` : '—'} detail="Out of 60 · AI assessment" accent="cyan" delay={0.04}/>
        <KpiCard icon={TrendingUp} label="Highest score" value={metrics.high ? getScore(metrics.high) : '—'} detail={metrics.high?.headline || 'No scored record'} accent="violet" delay={0.08}/>
        <KpiCard icon={Target} label="Lowest score" value={metrics.low ? getScore(metrics.low) : '—'} detail={metrics.low?.headline || 'No scored record'} accent="amber" delay={0.12}/>
        <KpiCard icon={CircleGauge} label="Quality average" value={metrics.pct ? `${Math.round(metrics.pct)}%` : '—'} detail="Across available scores" accent="cyan" delay={0.16}/>
      </div>

      <div className="overview-grid">
        <article className="panel distribution-panel">
          <PanelHeader eyebrow="QUALITY DISTRIBUTION" title="Creative Quality Distribution" action={`${scoredCount} scored ads`}/>
          {scoredCount ? (
            <div className="chart-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} tick={{ fill: 'var(--muted)', fontSize: 9 }}/>
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 9 }} label={{ value: 'Advertisements', angle: -90, position: 'insideLeft', fill: 'var(--muted)', fontSize: 9 }}/>
                  <Tooltip content={<DistributionTooltip/>} cursor={{ fill: '#F1F5F9' }}/>
                  <Bar dataKey="count" name="Advertisements" fill="#2563EB" radius={[7,7,2,2]} maxBarSize={36}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState title="No scored advertisements" text="Creative quality scores are required for this distribution."/>}
        </article>
        <article className="panel platform-panel">
          <PanelHeader eyebrow="CHANNELS" title="By platform"/>
          {platformData.length ? <div className="chart-lg"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={platformData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={4} stroke="none">{platformData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]}/>)}</Pie><Tooltip content={<ChartTooltipBox/>}/></PieChart></ResponsiveContainer><div className="pie-legend">{platformData.map((item,index)=><div key={item.name}><i style={{background:chartColors[index%chartColors.length]}}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div> : <EmptyState/>}
        </article>
      </div>

      <div className="overview-grid lower-grid">
        <article className="panel ranking-panel">
          <PanelHeader eyebrow="CREATIVE RANKING" title="Top scored ads" action="By AI quality"/>
          {ranked.length ? <div className="ranked-list">{ranked.map((ad,index)=><Link to={`/ads/${getAdId(ad)}`} className="ranked-row" key={getAdId(ad)}><span className="rank-number">{String(index+1).padStart(2,'0')}</span><div><strong>{getDisplayHeadline(ad,ads)}</strong><small>{ad.advertiser_name || 'Unknown advertiser'}</small></div><div className="mini-score"><strong>{getScore(ad)}</strong><span>/60</span></div><ChevronRight size={16}/></Link>)}</div> : <EmptyState/>}
        </article>
        <article className="panel recent-panel">
          <PanelHeader eyebrow="RECENT ACTIVITY" title="Latest analysis" action={<Link to="/ads">View all <ArrowUpRight size={13}/></Link>}/>
          {ads.length ? <div className="recent-list">{ads.slice(0,4).map((ad)=><Link to={`/ads/${getAdId(ad)}`} className="recent-row" key={getAdId(ad)}><div className="recent-avatar">{(ad.advertiser_name || 'UN').slice(0,2).toUpperCase()}</div><div><strong>{getDisplayHeadline(ad,ads)}</strong><small>{formatDate(ad.created_at)} · {ad.platform || 'Unknown'}</small></div><ScoreBadge score={getScore(ad)}/></Link>)}</div> : <EmptyState/>}
        </article>
      </div>
    </div>
  )
}

function PanelHeader({ eyebrow, title, action }) {
  return <div className="panel-header"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action && <div className="panel-action">{action}</div>}</div>
}

function ScoreBadge({ score }) {
  const tone = score >= 45 ? 'excellent' : score >= 30 ? 'good' : 'needs-work'
  return <span className={`score-badge ${tone}`}><strong>{score || '—'}</strong><small>/60</small></span>
}

function AdvertisementExplorer({ ads, loading, error, refresh }) {
  const [query,setQuery]=useState('')
  const [platform,setPlatform]=useState('All')
  const [scoreBand,setScoreBand]=useState('All')
  const [sort,setSort]=useState('date-desc')
  const [page,setPage]=useState(1)
  const pageSize=8
  useEffect(()=>{
    const listener=(event)=>setQuery(event.detail)
    window.addEventListener('mysivi-search',listener)
    return ()=>window.removeEventListener('mysivi-search',listener)
  },[])
  const platforms=[...new Set(ads.map((ad)=>ad.platform).filter(Boolean))]
  const filtered=useMemo(()=>{
    const result=ads.filter((ad)=>{
      const text=`${ad.advertiser_name||''} ${ad.headline||''} ${getAdId(ad)}`.toLowerCase()
      const score=getScore(ad)
      return text.includes(query.toLowerCase())
        && (platform==='All'||ad.platform===platform)
        && (scoreBand==='All'||(scoreBand==='High'&&score>=45)||(scoreBand==='Medium'&&score>=30&&score<45)||(scoreBand==='Low'&&score<30))
    })
    return result.sort((a,b)=>{
      if(sort==='score-desc') return getScore(b)-getScore(a)
      if(sort==='score-asc') return getScore(a)-getScore(b)
      if(sort==='date-asc') return new Date(a.created_at)-new Date(b.created_at)
      return new Date(b.created_at)-new Date(a.created_at)
    })
  },[ads,query,platform,scoreBand,sort])
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize))
  const effectivePage=Math.min(page,pages)
  const rows=filtered.slice((effectivePage-1)*pageSize,effectivePage*pageSize)
  if(loading) return <div className="page-content"><LoadingState/></div>
  if(error) return <div className="page-content"><ErrorState message={error} onRetry={refresh}/></div>
  return (
    <div className="page-content">
      <div className="welcome-row"><div><span className="eyebrow">CREATIVE LIBRARY</span><h1>Advertisements</h1><p>Search, filter, and analyze every creative.</p></div><button className="button button-secondary" onClick={refresh}><RefreshCw size={15}/>Refresh</button></div>
      <div className="filter-bar">
        <label className="table-search"><Search size={16}/><input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1)}} placeholder="Search advertiser, headline, or ad ID"/></label>
        <select value={platform} onChange={(e)=>{setPlatform(e.target.value);setPage(1)}}><option value="All">All platforms</option>{platforms.map((item)=><option key={item}>{item}</option>)}</select>
        <select value={scoreBand} onChange={(e)=>{setScoreBand(e.target.value);setPage(1)}}><option value="All">All scores</option><option value="High">High · 45–60</option><option value="Medium">Medium · 30–44</option><option value="Low">Low · 0–29</option></select>
        <select value={sort} onChange={(e)=>{setSort(e.target.value);setPage(1)}}><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="score-desc">Highest score</option><option value="score-asc">Lowest score</option></select>
      </div>
      <article className="panel data-table-panel">
        <div className="table-scroll"><table><thead><tr><th>Creative</th><th>Platform</th><th>Headline</th><th>AI score</th><th>Format</th><th>Analyzed</th><th/></tr></thead><tbody>{rows.map((ad)=><motion.tr initial={{opacity:0}} animate={{opacity:1}} key={getAdId(ad)}><td><div className="creative-cell"><div className="creative-avatar">{(ad.advertiser_name||'UN').slice(0,2).toUpperCase()}</div><strong>{ad.advertiser_name||'Unknown'}</strong></div></td><td><span className="platform-indicator"><i/> {ad.platform||'Unknown'}</span></td><td><span className="headline-cell" title={getAdId(ad) ? `Ad ID: ${getAdId(ad)}` : undefined}>{getDisplayHeadline(ad,ads)}</span></td><td><ScoreBadge score={getScore(ad)}/></td><td>{ad.ad_format||'—'}</td><td>{formatDate(ad.created_at)}</td><td><Link className="row-action" to={`/ads/${getAdId(ad)}`} aria-label={`View ${getDisplayHeadline(ad,ads)}`}><Eye size={15}/></Link></td></motion.tr>)}</tbody></table>{!filtered.length&&<EmptyState/>}</div>
        {filtered.length>0&&<div className="pagination"><span>{(effectivePage-1)*pageSize+1}–{Math.min(effectivePage*pageSize,filtered.length)} of {filtered.length}</span><div><button disabled={effectivePage===1} onClick={()=>setPage(effectivePage-1)}><ChevronLeft size={15}/></button><span>{effectivePage} / {pages}</span><button disabled={effectivePage===pages} onClick={()=>setPage(effectivePage+1)}><ChevronRight size={15}/></button></div></div>}
      </article>
    </div>
  )
}

function Detail({ ads, loading, error, refresh }) {
  const { id } = useParams()
  const ad = ads.find((item) => String(item.id) === String(id) || String(item.ad_id) === String(id))
  if (loading) return <div className="page-content"><LoadingState/></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={refresh}/></div>
  if (!ad) return <div className="page-content"><EmptyState title="Advertisement not found" text="This record may not exist or may not be included in the current analysis."/></div>

  const categories = getCategoryScores(ad)
  const strengthItems = safeArray(ad.strengths)
  const weaknessItems = safeArray(ad.weaknesses)
  const improvementItems = safeArray(ad.improvement_suggestions)
  const score = getScore(ad)
  const pct = Math.min(100, getScorePercent(ad))

  return (
    <div className="page-content detail-page">
      <Link className="back-link" to="/ads"><ArrowLeft size={15}/>Advertisement explorer</Link>
      <div className="detail-hero">
        <div className="detail-ident">
          <div className="detail-avatar">{(ad.advertiser_name || 'UN').slice(0,2).toUpperCase()}</div>
          <div><span className="platform-indicator"><i/>{ad.platform || 'Unknown'}</span><h1>{getDisplayHeadline(ad, ads)}</h1><p>{ad.advertiser_name || 'Unknown advertiser'} · {formatDate(ad.created_at)} · Ad ID: {getAdId(ad) || '—'}</p></div>
        </div>
        <div className="score-ring" style={{ '--score': `${pct * 3.6}deg` }}>
          <div><strong>{score}</strong><span>/60</span></div>
        </div>
      </div>

      <div className="detail-grid">
        <article className="panel creative-copy-card">
          <PanelHeader eyebrow="ADVERTISEMENT" title="Creative preview"/>
          <div className="creative-preview">
            <span className="preview-label">AD COPY</span>
            <h2>{getDisplayHeadline(ad, ads)}</h2>
            <p>{ad.ad_copy || 'No advertisement copy is available.'}</p>
            {ad.cta_text && <span className="cta-preview">{ad.cta_text}</span>}
          </div>
          <div className="analysis-fields">
            <div><span>Hook</span><p>{ad.hook || '—'}</p></div>
            <div><span>Pain point</span><p>{ad.pain_point || '—'}</p></div>
            <div><span>Value proposition</span><p>{ad.value_proposition || '—'}</p></div>
            <div><span>Target audience</span><p>{ad.target_audience || '—'}</p></div>
          </div>
        </article>

        <article className="panel category-card">
          <PanelHeader eyebrow="AI QUALITY PROFILE" title="Category breakdown"/>
          <div className="category-bars">{categories.map((item) => <div key={item.category}><div><span>{item.category}</span><strong>{item.value}/10</strong></div><div className="progress-track"><motion.i initial={{ width: 0 }} animate={{ width: `${Math.min(100,item.value*10)}%` }} transition={{ duration: 0.6 }}/></div></div>)}</div>
        </article>
      </div>

      <div className="detail-grid insight-grid">
        <article className="panel insight-card strengths">
          <PanelHeader eyebrow="POSITIVE SIGNALS" title="Strengths"/>
          {strengthItems.length ? <ul>{strengthItems.map((item,index)=><li key={index}><span><BrainCircuit size={13}/></span><p>{typeof item === 'string' ? item : JSON.stringify(item)}</p></li>)}</ul> : <p className="muted">No strengths available.</p>}
        </article>
        <article className="panel insight-card weaknesses">
          <PanelHeader eyebrow="AREAS TO FIX" title="Weaknesses"/>
          {weaknessItems.length ? <ul>{weaknessItems.map((item,index)=><li key={index}><span>!</span><p>{typeof item === 'string' ? item : JSON.stringify(item)}</p></li>)}</ul> : <p className="muted">No weaknesses available.</p>}
        </article>
        <article className="panel insight-card improvements">
          <PanelHeader eyebrow="NEXT ACTIONS" title="AI suggestions"/>
          {improvementItems.length ? <ul>{improvementItems.map((item,index)=><li key={index}><span>{index+1}</span><p>{typeof item === 'string' ? item : JSON.stringify(item)}</p></li>)}</ul> : <p className="muted">No suggestions available.</p>}
        </article>
      </div>

      <div className="detail-grid bottom-detail-grid">
        <article className="panel detail-note"><span>Message clarity</span><strong>{typeof ad.message_clarity === 'number' ? `${ad.message_clarity}/10` : ad.message_clarity || '—'}</strong></article>
        <article className="panel detail-note"><span>CTA analysis</span><strong>{typeof ad.cta_analysis === 'number' ? `${ad.cta_analysis}/10` : ad.cta_analysis || '—'}</strong></article>
        <article className="panel detail-note"><span>Creative angle</span><strong>{ad.creative_angle || '—'}</strong></article>
      </div>
    </div>
  )
}

function Comparison({ ads, loading, error, refresh }) {
  const [firstId, setFirstId] = useState('')
  const [secondId, setSecondId] = useState('')

  if (loading) return <div className="page-content"><LoadingState /></div>
  if (error) return <div className="page-content"><ErrorState message={error} onRetry={refresh} /></div>
  if (!ads.length) return <div className="page-content"><EmptyState title="No advertisements available" text="Two analyzed advertisements are required for comparison." /></div>

  const first = ads.find((ad) => String(ad.id || ad.ad_id) === firstId) || ads[0]
  const firstKey = first ? getAdId(first) : ''
  const second = ads.find((ad) => String(ad.id || ad.ad_id) === secondId && String(ad.id || ad.ad_id) !== firstKey)
    || ads.find((ad) => getAdId(ad) !== firstKey)
  const chartData = getCategoryScores(first || {}).map((item, index) => ({
    category: item.category,
    A: item.value,
    B: getCategoryScores(second || {})[index]?.value || 0,
  }))
  const firstScore = first ? getScore(first) : 0
  const secondScore = second ? getScore(second) : 0
  const leader = firstScore === secondScore ? null : firstScore > secondScore ? 'A' : 'B'

  return (
    <div className="page-content comparison-page">
      <div className="welcome-row">
        <div><span className="eyebrow">CREATIVE BENCHMARK</span><h1>Creative comparison</h1><p>Compare real AI creative quality assessments across two advertisements.</p></div>
      </div>

      <div className="compare-selectors">
        <SearchableAdSelector label="Advertisement A" ads={ads} value={getAdId(first)} excludedId={getAdId(second)} onChange={setFirstId} accent="a" />
        <SearchableAdSelector label="Advertisement B" ads={ads} value={getAdId(second)} excludedId={getAdId(first)} onChange={setSecondId} accent="b" />
      </div>

      {first && second ? <>
        <article className={`comparison-summary ${leader ? `leader-${leader.toLowerCase()}` : ''}`}>
          <div className="summary-icon"><BrainCircuit size={18} /></div>
          <div>
            <span>AI creative quality result</span>
            {leader
              ? <strong>Advertisement {leader} has the higher score: {leader === 'A' ? firstScore : secondScore}/60</strong>
              : <strong>Both advertisements have an equal AI creative quality score.</strong>}
          </div>
          <div className="summary-score"><strong>{Math.abs(firstScore - secondScore)}</strong><span>point difference</span></div>
        </article>

        <div className="comparison-cards">
          <ComparisonCard label="A" ad={first} accent="blue" />
          <ComparisonCard label="B" ad={second} accent="violet" />
        </div>

        <div className="comparison-grid">
          <article className="panel radar-panel">
            <PanelHeader eyebrow="CATEGORY PROFILE" title="Six-dimension AI score comparison"/>
            <div className="radar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="var(--chart-grid)"/>
                  <PolarAngleAxis dataKey="category" tick={{ fill: 'var(--muted)', fontSize: 10 }}/>
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false}/>
                  <Radar name="Advertisement A" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.20}/>
                  <Radar name="Advertisement B" dataKey="B" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.16}/>
                  <Tooltip/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="panel comparison-difference">
            <PanelHeader eyebrow="CATEGORY DIFFERENCE" title="A minus B"/>
            <div className="difference-list">
              {chartData.map((item) => {
                const difference = item.A - item.B
                return (
                  <div key={item.category}>
                    <span>{item.category}</span>
                    <div className="difference-bars">
                      <i className="a" style={{ width: `${Math.min(100, item.A * 10)}%` }}/>
                      <i className="b" style={{ width: `${Math.min(100, item.B * 10)}%` }}/>
                    </div>
                    <strong className={difference > 0 ? 'a-text' : difference < 0 ? 'b-text' : ''}>
                      {difference > 0 ? '+' : ''}{difference}
                    </strong>
                  </div>
                )
              })}
            </div>
          </article>
        </div>

        <div className="creative-facts-grid">
          <CreativeFacts label="A" ad={first} accent="blue"/>
          <CreativeFacts label="B" ad={second} accent="violet"/>
        </div>

        <div className="comparison-insights-grid">
          <AdvertisementInsights label="A" ad={first} accent="blue"/>
          <AdvertisementInsights label="B" ad={second} accent="violet"/>
        </div>
      </> : <EmptyState title="Select two different advertisements" text="Choose both advertisements to begin the comparison." />}
    </div>
  )
}

function ListItems({ items }) {
  if(!items.length) return <p className="muted">No structured AI analysis available.</p>
  return <ul>{items.map((item,index)=><li key={index}><span>{index+1}</span><p>{typeof item==='string'?item:JSON.stringify(item)}</p></li>)}</ul>
}

function SearchableAdSelector({ label, ads, value, excludedId, onChange, accent }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = ads.find((ad) => String(ad.id || ad.ad_id) === value)
  const normalizedQuery = query.trim().toLowerCase()
  const options = ads.filter((ad) => {
    const id = String(ad.id || ad.ad_id)
    if (id === excludedId) return false
    if (!normalizedQuery) return true
    return [ad.headline, ad.advertiser_name, ad.platform, ad.ad_id, ad.id]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(normalizedQuery))
  })

  return (
    <div className={`ad-selector accent-${accent}`}>
      <span className="ad-selector-label">{label}</span>
      <div className="ad-selector-control">
        <Search size={16} />
        <input
          value={open ? query :           (selected ? getDisplayHeadline(selected, ads) : '')}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={(event) => { setOpen(true); setQuery(event.target.value) }}
          placeholder={`Search ${label}`}
          aria-label={`Search ${label}`}
        />
        {open && <button type="button" className="ad-selector-close" onClick={() => setOpen(false)} aria-label="Close search"><X size={14}/></button>}
      </div>
      {open && (
        <div className="ad-selector-menu">
          {options.length ? options.map((ad) => {
            const id = String(ad.id || ad.ad_id)
            return (
              <button
                type="button"
                key={id}
                onClick={() => { onChange(id); setQuery(''); setOpen(false) }}
                className={id === value ? 'selected' : ''}
              >
                <span className="selector-avatar">{(ad.advertiser_name || 'UN').slice(0, 2).toUpperCase()}</span>
                <span><strong>{getDisplayHeadline(ad, ads)}</strong><small>{ad.advertiser_name || 'Unknown advertiser'} · {ad.platform || 'Unknown'} · ID: {getAdId(ad)}</small></span>
              </button>
            )
          }) : <p>No matching advertisements</p>}
        </div>
      )}
    </div>
  )
}

function ComparisonCard({ label, ad, accent }) {
  const score = getScore(ad)
  const pct = Math.min(100, getScorePercent(ad))
  return (
    <motion.article className={`panel comparison-card accent-${accent}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="comparison-meta">
        <span>Advertisement {label}</span>
        <small>{ad.advertiser_name || 'Unknown advertiser'}</small>
      </div>
      <h2>{getHeadline(ad)}</h2>
      <p className="comparison-score-copy">{ad.ad_copy || 'No advertisement copy is available.'}</p>
      <div className="comparison-score-row">
        <div className={`comparison-score ${accent}`}><strong>{score || '—'}</strong><span>/60</span></div>
        <div className="comparison-percent"><strong>{score ? `${pct}%` : '—'}</strong><span>AI quality</span></div>
      </div>
    </motion.article>
  )
}

function CreativeFacts({ label, ad, accent }) {
  const facts = [
    ['Hook', ad.hook],
    ['Value proposition', ad.value_proposition],
    ['Target audience', ad.target_audience],
    ['Creative angle', ad.creative_angle],
  ]
  return (
    <article className={`panel creative-facts accent-${accent}`}>
      <PanelHeader eyebrow={`CREATIVE ${label}`} title="Creative direction"/>
      <div className="creative-facts-list">
        {facts.map(([title, value]) => <div key={title}><span>{title}</span><p>{value || 'Not available in the record.'}</p></div>)}
      </div>
    </article>
  )
}

function AdvertisementInsights({ label, ad, accent }) {
  return (
    <article className={`comparison-insight-column accent-${accent}`}>
      <div className="comparison-insight-header"><span>CREATIVE {label}</span><strong>AI analysis</strong></div>
      <div className="panel insight-card strengths">
        <PanelHeader eyebrow="POSITIVE SIGNALS" title="Strengths"/>
        <ListItems items={safeArray(ad.strengths)}/>
      </div>
      <div className="panel insight-card weaknesses">
        <PanelHeader eyebrow="AREAS TO FIX" title="Weaknesses"/>
        <ListItems items={safeArray(ad.weaknesses)}/>
      </div>
      <div className="panel insight-card improvements">
        <PanelHeader eyebrow="NEXT ACTIONS" title="Improvement suggestions"/>
        <ListItems items={safeArray(ad.improvement_suggestions)}/>
      </div>
    </article>
  )
}

function Insights({ ads, loading, error, refresh }) {
  if(loading) return <div className="page-content"><LoadingState/></div>
  if(error) return <div className="page-content"><ErrorState message={error} onRetry={refresh}/></div>
  const ranked=[...ads].sort((a,b)=>getScore(b)-getScore(a))
  const collect=(field)=>{
    const counts={}
    ads.forEach((ad)=>safeArray(ad[field]).forEach((item)=>{
      const text=typeof item==='string'?item:JSON.stringify(item)
      counts[text]=(counts[text]||0)+1
    }))
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5)
  }
  const strengths=collect('strengths')
  const weaknesses=collect('weaknesses')
  const improvements=collect('improvement_suggestions')

  return (
    <div className="page-content">
      <div className="welcome-row"><div><span className="eyebrow">AI INTELLIGENCE</span><h1>Creative insights</h1><p>Patterns derived only from your existing Supabase analysis.</p></div></div>
      <div className="insight-disclaimer"><BrainCircuit size={18}/><div><strong>AI assessment, not ad performance</strong><p>These scores estimate creative quality and do not represent reach, revenue, or conversions.</p></div></div>
      <div className="insights-grid">
        <article className="panel top-creatives"><PanelHeader eyebrow="AI RANKING" title="Highest-Rated Creatives"/>{ranked.length?<div className="ranked-list">{ranked.slice(0,5).map((ad,index)=><Link className="ranked-row" to={`/ads/${getAdId(ad)}`} key={getAdId(ad)}><span className="rank-number">{index+1}</span><div><strong>{getDisplayHeadline(ad,ads)}</strong><small>{ad.advertiser_name||'Unknown'}</small></div><div className="mini-score"><strong>{getScore(ad)}</strong><span>/60</span></div></Link>)}</div>:<EmptyState/>}</article>
        <article className="panel theme-panel"><PanelHeader eyebrow="COMMON PATTERNS" title="Analysis themes"/><ThemeList title="Strengths" items={strengths}/><ThemeList title="Weaknesses" items={weaknesses}/><ThemeList title="Suggested improvements" items={improvements}/></article>
      </div>
    </div>
  )
}

function ThemeList({ title, items }) {
  return <div className="theme-list"><h3>{title}</h3>{items.length?items.map(([text,count])=><div key={text}><span>{text}</span><strong>{count}</strong></div>):<p className="muted">No structured data available.</p>}</div>
}

function SettingsPage({ refresh }) {
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div><span className="eyebrow">WORKSPACE</span><h1>Settings</h1><p>Manage your connected dashboard.</p></div>
      </div>
      <div className="settings-grid">
        <article className="panel setting-card">
          <div className="setting-icon"><RefreshCw size={18}/></div>
          <div><strong>Data connection</strong><p>Reload the latest advertisement records from Supabase.</p></div>
          <button className="button button-secondary" onClick={refresh}>Refresh</button>
        </article>
        <article className="panel setting-card">
          <div className="setting-icon"><Megaphone size={18}/></div>
          <div><strong>Advertising performance</strong><p>Advertising performance metrics are not available for these records.</p></div>
        </article>
      </div>
    </div>
  )
}

function ProtectedApp() {
  const [session,setSession]=useState(undefined)
  const data=useAdvertisements(Boolean(session))
  useEffect(()=>{
    if(!isSupabaseConfigured){setSession(null);return}
    supabase.auth.getSession().then(({data:sessionData})=>setSession(sessionData.session))
    const {data:listener}=supabase.auth.onAuthStateChange((_event,nextSession)=>setSession(nextSession))
    return ()=>listener.subscription.unsubscribe()
  },[])
  if(session===undefined) return <div className="auth-loading"><div className="skeleton auth-skeleton"/></div>
  if(!session) return <Login/>
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      setSession(null)
    }
  }
  return <Shell refresh={data.refresh} onSignOut={signOut} ads={data.ads}><Routes><Route path="/" element={<Overview {...data}/>}/><Route path="/ads" element={<AdvertisementExplorer {...data}/>}/><Route path="/ads/:id" element={<Detail {...data}/>}/><Route path="/compare" element={<Comparison {...data}/>}/><Route path="/insights" element={<Insights {...data}/>}/><Route path="/settings" element={<SettingsPage refresh={data.refresh}/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Shell>
}

export default ProtectedApp
