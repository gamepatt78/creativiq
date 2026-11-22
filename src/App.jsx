import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  ArrowLeft, ArrowUpRight, BrainCircuit, ChevronLeft, ChevronRight,
  CircleGauge, Eye, LayoutDashboard, Lightbulb, LogOut,
  Megaphone, Menu, RefreshCw, Search, Settings, Sparkles, Target,
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

const chartColors = ['#2563EB', '#7C3AED', '#0D9488', '#D97706', '#DB2777']

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

function Shell({ children, refresh, onSignOut, ads }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar') === 'collapsed')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  useEffect(() => {
    localStorage.setItem('sidebar', collapsed ? 'collapsed' : 'expanded')
  }, [collapsed])

  useEffect(() => setMobileOpen(false), [location.pathname])

  const current = navItems.find((item) => item.to === location.pathname)?.label || 'Advertisement'
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
          <Link className="brand" to="/" aria-label="MySivi AI overview">
            <span className="brand-mark"><Sparkles size={17}/></span>
            <span className="brand-copy"><strong>MySivi</strong><small>AI Intelligence</small></span>
          </Link>
          <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18}/></button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
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
            className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings size={18}/><span>Settings</span>
          </Link>
          <div className="account-row">
            <div className="account-avatar">MS</div>
            <div className="account-copy"><strong>MySivi Workspace</strong><span>Admin workspace</span></div>
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
            <div><span>MySivi Intelligence</span><strong>{current}</strong></div>
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

  const distribution = useMemo(() => [
    { name: '0–20', value: ads.filter((ad) => getScore(ad) <= 20).length },
    { name: '21–40', value: ads.filter((ad) => getScore(ad) > 20 && getScore(ad) <= 40).length },
    { name: '41–50', value: ads.filter((ad) => getScore(ad) > 40 && getScore(ad) <= 50).length },
    { name: '51–60', value: ads.filter((ad) => getScore(ad) > 50).length },
  ], [ads])

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
          <PanelHeader eyebrow="QUALITY DISTRIBUTION" title="Creative score bands" action={`${ads.length} ads`}/>
          {ads.length ? <div className="chart-lg"><ResponsiveContainer width="100%" height="100%"><BarChart data={distribution} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis allowDecimals={false} axisLine={false} tickLine={false}/><Tooltip content={<ChartTooltipBox/>} cursor={{ fill: '#F1F5F9' }}/><Bar dataKey="value" fill="#2563EB" radius={[7,7,2,2]} maxBarSize={46}/></BarChart></ResponsiveContainer></div> : <EmptyState/>}
        </article>
        <article className="panel platform-panel">
          <PanelHeader eyebrow="CHANNELS" title="By platform"/>
          {platformData.length ? <div className="chart-lg"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={platformData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={4} stroke="none">{platformData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]}/>)}</Pie><Tooltip content={<ChartTooltipBox/>}/></PieChart></ResponsiveContainer><div className="pie-legend">{platformData.map((item,index)=><div key={item.name}><i style={{background:chartColors[index%chartColors.length]}}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div> : <EmptyState/>}
        </article>
      </div>

      <div className="overview-grid lower-grid">
        <article className="panel ranking-panel">
          <PanelHeader eyebrow="CREATIVE RANKING" title="Top scored ads" action="By AI quality"/>
          {ranked.length ? <div className="ranked-list">{ranked.map((ad,index)=><Link to={`/ads/${ad.id || ad.ad_id}`} className="ranked-row" key={ad.id || ad.ad_id}><span className="rank-number">{String(index+1).padStart(2,'0')}</span><div><strong>{ad.headline || 'Untitled advertisement'}</strong><small>{ad.advertiser_name || 'Unknown advertiser'}</small></div><div className="mini-score"><strong>{getScore(ad)}</strong><span>/60</span></div><ChevronRight size={16}/></Link>)}</div> : <EmptyState/>}
        </article>
        <article className="panel recent-panel">
          <PanelHeader eyebrow="RECENT ACTIVITY" title="Latest analysis" action={<Link to="/ads">View all <ArrowUpRight size={13}/></Link>}/>
          {ads.length ? <div className="recent-list">{ads.slice(0,4).map((ad)=><Link to={`/ads/${ad.id || ad.ad_id}`} className="recent-row" key={ad.id || ad.ad_id}><div className="recent-avatar">{(ad.advertiser_name || 'UN').slice(0,2).toUpperCase()}</div><div><strong>{ad.headline || 'Untitled advertisement'}</strong><small>{formatDate(ad.created_at)} · {ad.platform || 'Unknown'}</small></div><ScoreBadge score={getScore(ad)}/></Link>)}</div> : <EmptyState/>}
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
      const text=`${ad.advertiser_name||''} ${ad.headline||''}`.toLowerCase()
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
  useEffect(()=>setPage(1),[query,platform,scoreBand,sort])
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize))
  const rows=filtered.slice((page-1)*pageSize,page*pageSize)
  if(loading) return <div className="page-content"><LoadingState/></div>
  if(error) return <div className="page-content"><ErrorState message={error} onRetry={refresh}/></div>
  return (
    <div className="page-content">
      <div className="welcome-row"><div><span className="eyebrow">CREATIVE LIBRARY</span><h1>Advertisements</h1><p>Search, filter, and analyze every creative.</p></div><button className="button button-secondary" onClick={refresh}><RefreshCw size={15}/>Refresh</button></div>
      <div className="filter-bar">
        <label className="table-search"><Search size={16}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search advertiser or headline"/></label>
        <select value={platform} onChange={(e)=>setPlatform(e.target.value)}><option value="All">All platforms</option>{platforms.map((item)=><option key={item}>{item}</option>)}</select>
        <select value={scoreBand} onChange={(e)=>setScoreBand(e.target.value)}><option value="All">All scores</option><option value="High">High · 45–60</option><option value="Medium">Medium · 30–44</option><option value="Low">Low · 0–29</option></select>
        <select value={sort} onChange={(e)=>setSort(e.target.value)}><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="score-desc">Highest score</option><option value="score-asc">Lowest score</option></select>
      </div>
      <article className="panel data-table-panel">
        <div className="table-scroll"><table><thead><tr><th>Creative</th><th>Platform</th><th>Headline</th><th>AI score</th><th>Format</th><th>Analyzed</th><th/></tr></thead><tbody>{rows.map((ad)=><motion.tr initial={{opacity:0}} animate={{opacity:1}} key={ad.id||ad.ad_id}><td><div className="creative-cell"><div className="creative-avatar">{(ad.advertiser_name||'UN').slice(0,2).toUpperCase()}</div><strong>{ad.advertiser_name||'Unknown'}</strong></div></td><td><span className="platform-indicator"><i/> {ad.platform||'Unknown'}</span></td><td><span className="headline-cell">{ad.headline||'—'}</span></td><td><ScoreBadge score={getScore(ad)}/></td><td>{ad.ad_format||'—'}</td><td>{formatDate(ad.created_at)}</td><td><Link className="row-action" to={`/ads/${ad.id||ad.ad_id}`} aria-label={`View ${ad.headline||'advertisement'}`}><Eye size={15}/></Link></td></motion.tr>)}</tbody></table>{!filtered.length&&<EmptyState/>}</div>
        {filtered.length>0&&<div className="pagination"><span>{(page-1)*pageSize+1}–{Math.min(page*pageSize,filtered.length)} of {filtered.length}</span><div><button disabled={page===1} onClick={()=>setPage(page-1)}><ChevronLeft size={15}/></button><span>{page} / {pages}</span><button disabled={page===pages} onClick={()=>setPage(page+1)}><ChevronRight size={15}/></button></div></div>}
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
          <div><span className="platform-indicator"><i/>{ad.platform || 'Unknown'}</span><h1>{ad.headline || 'Untitled advertisement'}</h1><p>{ad.advertiser_name || 'Unknown advertiser'} · {formatDate(ad.created_at)}</p></div>
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
            <h2>{ad.headline || 'Untitled advertisement'}</h2>
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
          {strengthItems.length ? <ul>{strengthItems.map((item,index)=><li key={index}><span><Sparkles size={13}/></span><p>{typeof item === 'string' ? item : JSON.stringify(item)}</p></li>)}</ul> : <p className="muted">No strengths available.</p>}
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
  const [firstId,setFirstId]=useState('')
  const [secondId,setSecondId]=useState('')
  useEffect(()=>{
    if(!firstId && ads[0]) setFirstId(String(ads[0].id || ads[0].ad_id))
    if(!secondId && ads[1]) setSecondId(String(ads[1].id || ads[1].ad_id))
  },[ads,firstId,secondId])
  const first=ads.find((ad)=>String(ad.id||ad.ad_id)===firstId)
  const second=ads.find((ad)=>String(ad.id||ad.ad_id)===secondId)
  if(loading) return <div className="page-content"><LoadingState/></div>
  if(error) return <div className="page-content"><ErrorState message={error} onRetry={refresh}/></div>

  const chartData=getCategoryScores(first || {}).map((item,index)=>({category:item.category,A:item.value,B:getCategoryScores(second || {})[index]?.value||0}))
  return (
    <div className="page-content">
      <div className="welcome-row"><div><span className="eyebrow">CREATIVE BENCHMARK</span><h1>Side-by-side comparison</h1><p>Compare AI quality signals across two creatives.</p></div></div>
      <div className="compare-selectors">
        {[['A',firstId,setFirstId],['B',secondId,setSecondId]].map(([label,value,setter])=><label key={label}><span>Creative {label}</span><select value={value} onChange={(e)=>setter(e.target.value)}><option value="">Select advertisement</option>{ads.map((ad)=><option key={ad.id||ad.ad_id} value={ad.id||ad.ad_id}>{ad.headline||ad.ad_id||ad.id}</option>)}</select></label>)}
      </div>
      {first&&second ? <>
        <div className="comparison-cards">
          {[['A',first,'violet'],['B',second,'cyan']].map(([label,ad,accent])=><article className="panel comparison-card" key={label}><div className="comparison-meta"><span>{label}</span><small>{ad.advertiser_name||'Unknown advertiser'}</small></div><h2>{ad.headline||'Untitled'}</h2><div className={`comparison-score ${accent}`}><strong>{getScore(ad)}</strong><span>/60</span></div></article>)}
        </div>
        <div className="comparison-grid">
          <article className="panel radar-panel"><PanelHeader eyebrow="CATEGORY PROFILE" title="AI score comparison"/>{chartData.length&&<div className="radar-chart"><ResponsiveContainer width="100%" height="100%"><RadarChart data={chartData}><PolarGrid stroke="var(--chart-grid)"/><PolarAngleAxis dataKey="category" tick={{fill:'var(--muted)',fontSize:10}}/><PolarRadiusAxis angle={30} domain={[0,10]} tick={false}/><Radar name="Creative A" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.22}/><Radar name="Creative B" dataKey="B" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.16}/><Tooltip/></RadarChart></ResponsiveContainer></div>}</article>
          <article className="panel comparison-difference"><PanelHeader eyebrow="KEY DIFFERENCE" title="Score breakdown"/><div className="difference-list">{chartData.map((item)=><div key={item.category}><span>{item.category}</span><div><i className="a" style={{width:`${item.A*10}%`}}/><i className="b" style={{width:`${item.B*10}%`}}/></div><strong>{item.A-item.B>0?'A':item.B-item.A>0?'B':'—'}</strong></div>)}</div></article>
        </div>
        <div className="comparison-copy"><article className="panel insight-card strengths"><PanelHeader eyebrow="CREATIVE A" title="Strengths"/><ListItems items={safeArray(first.strengths)}/></article><article className="panel insight-card weaknesses"><PanelHeader eyebrow="CREATIVE B" title="Weaknesses"/><ListItems items={safeArray(second.weaknesses)}/></article></div>
      </> : <EmptyState title="Select two advertisements" text="Choose a creative in both dropdowns to begin."/>}
    </div>
  )
}

function ListItems({ items }) {
  if(!items.length) return <p className="muted">No structured AI analysis available.</p>
  return <ul>{items.map((item,index)=><li key={index}><span>{index+1}</span><p>{typeof item==='string'?item:JSON.stringify(item)}</p></li>)}</ul>
}

function Insights({ ads, loading, error, refresh }) {
  const timeline=useMemo(()=>{
    const groups={}
    ads.forEach((ad)=>{if(!ad.created_at)return;const date=new Date(ad.created_at);const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;if(!groups[key])groups[key]={total:0,count:0};groups[key].total+=getScore(ad);groups[key].count++})
    return Object.entries(groups).sort(([a],[b])=>a.localeCompare(b)).map(([month,value])=>({month,score:Math.round(value.total/value.count)}))
  },[ads])
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
        <article className="panel top-creatives"><PanelHeader eyebrow="TOP PERFORMERS" title="Highest AI quality"/>{ranked.length?<div className="ranked-list">{ranked.slice(0,5).map((ad,index)=><Link className="ranked-row" to={`/ads/${ad.id||ad.ad_id}`} key={ad.id||ad.ad_id}><span className="rank-number">{index+1}</span><div><strong>{ad.headline||'Untitled'}</strong><small>{ad.advertiser_name||'Unknown'}</small></div><div className="mini-score"><strong>{getScore(ad)}</strong><span>/60</span></div></Link>)}</div>:<EmptyState/>}</article>
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
  return <Shell refresh={data.refresh} onSignOut={()=>supabase.auth.signOut()} ads={data.ads}><Routes><Route path="/" element={<Overview {...data}/>}/><Route path="/ads" element={<AdvertisementExplorer {...data}/>}/><Route path="/ads/:id" element={<Detail {...data}/>}/><Route path="/compare" element={<Comparison {...data}/>}/><Route path="/insights" element={<Insights {...data}/>}/><Route path="/settings" element={<SettingsPage refresh={data.refresh}/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Shell>
}

export default ProtectedApp
