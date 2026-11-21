import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Activity, AlertTriangle, Bird, CheckCircle2, ChevronRight, CircleHelp,
  Clock3, CloudOff, Cpu, LayoutDashboard, Leaf, LogOut, Menu, RefreshCw,
  Search, Settings, ShieldCheck, Smartphone, Wifi, X,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Device = {
  id: string; name: string; location: string; status?: string
  last_seen: string | null; ip_address?: string | null; port?: number
  is_archived?: boolean; is_locked?: boolean
}
type Log = {
  id: number | string; device_id: string; event_type: string; label: string
  species: string | null; created_at: string; devices?: { name?: string } | null
}
type Page = 'overview' | 'devices' | 'detections' | 'alerts' | 'settings'
const C = { dark: '#123B25', green: '#4F8F3A', pale: '#F7F9E9', border: '#E5E9D2' }

function alive(lastSeen: string | null) {
  return !!lastSeen && Date.now() - new Date(lastSeen).getTime() < 30_000
}
function ago(value: string | null) {
  if (!value) return 'Never connected'
  const sec = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (sec < 60) return 'Just now'
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`
  return `${Math.floor(sec / 86400)} days ago`
}
function dateTime(value: string) {
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
function eventTitle(log: Log) {
  if (log.event_type === 'bird_detected') return log.species || log.label || 'Bird detected'
  return (log.event_type || 'event').replaceAll('_', ' ').replace(/\b\w/g, x => x.toUpperCase())
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState<Page>('overview')
  const [devices, setDevices] = useState<Device[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    device_disconnection: true, device_errors: true, low_battery: true,
    device_recovery: true, bird_detection: true,
  })

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  const load = useCallback(async () => {
    if (!supabase || !session) return
    setLoading(true); setError('')
    try {
      const [d, l] = await Promise.all([
        supabase.from('devices').select('*').order('name', { ascending: true }),
        supabase.from('detection_logs').select('*, devices(name)').order('created_at', { ascending: false }).limit(500),
      ])
      if (d.error) throw d.error
      if (l.error) throw l.error
      setDevices((d.data ?? []) as Device[])
      setLogs((l.data ?? []) as Log[])
      const { data: pref, error: prefError } = await supabase.from('notification_preferences')
        .select('device_disconnection, device_errors, low_battery, device_recovery, bird_detection')
        .eq('user_id', session.user.id).maybeSingle()
      if (!prefError && pref) setPrefs({
        device_disconnection: pref.device_disconnection, device_errors: pref.device_errors,
        low_battery: pref.low_battery, device_recovery: pref.device_recovery,
        bird_detection: pref.bird_detection,
      })
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load Supabase data.') }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (!supabase || !session) return
    const channel = supabase.channel('scarecrow-web-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => { void load() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'detection_logs' }, () => { void load() })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [session, load])

  const activeDevices = devices.filter(d => alive(d.last_seen))
  const birdLogs = logs.filter(l => l.event_type === 'bird_detected')
  const alertLogs = logs.filter(l => l.event_type !== 'bird_detected')
  const today = new Date().toDateString()
  const birdsToday = birdLogs.filter(l => new Date(l.created_at).toDateString() === today).length
  const filteredLogs = useMemo(() => logs.filter(l =>
    `${eventTitle(l)} ${l.label} ${l.devices?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())
  ), [logs, query])

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return
    setBusy(true); setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    setBusy(false)
  }
  async function signOut() { await supabase?.auth.signOut(); setPage('overview') }
  async function togglePref(key: string, value: boolean) {
    if (!supabase || !session) return
    const old = prefs[key]; setPrefs(p => ({ ...p, [key]: value }))
    const { error } = await supabase.from('notification_preferences').upsert({
      user_id: session.user.id, [key]: value, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) { setPrefs(p => ({ ...p, [key]: old })); setError(error.message) }
  }

  if (!authReady) return <div className="boot"><div className="brand-mark"><Leaf /></div><p>Loading SCARECROW…</p></div>
  if (!isSupabaseConfigured) return <div className="setup-screen"><div className="login-card">
    <Brand /><h1>Connect your Supabase project</h1>
    <p>Create a <code>.env</code> file in the web project using <code>.env.example</code>, then add your Supabase project URL and publishable/anon key.</p>
    <p className="hint">Never use your Supabase service-role key in a browser application.</p>
  </div></div>
  if (!session) return <div className="setup-screen"><form className="login-card" onSubmit={signIn}>
    <Brand /><span className="eyebrow">FIELD MONITORING SYSTEM</span><h1>Welcome back</h1>
    <p>Sign in to manage your ScareCROW devices.</p>
    <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com" /></label>
    <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password" /></label>
    {authError && <div className="error-box">{authError}</div>}
    <button className="primary-btn full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    <small>Use an existing ScareCROW administrator account.</small>
  </form></div>

  const nav: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'devices', label: 'Devices', icon: Cpu },
    { id: 'detections', label: 'Detection Logs', icon: Bird },
    { id: 'alerts', label: 'Alerts & Activities', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]
  const title = nav.find(n => n.id === page)?.label ?? 'Overview'
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <Brand />
      <div className="side-caption">WORKSPACE</div>
      <nav>{nav.map(n => <button key={n.id} className={`nav-link ${page === n.id ? 'selected' : ''}`} onClick={() => { setPage(n.id); setMobileNav(false) }}>
        <n.icon size={18} /><span>{n.label}</span>{page === n.id && <ChevronRight size={15} className="nav-arrow" />}
      </button>)}</nav>
      <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={17}/><span>Secure admin access</span></div>
        <div className="user-mini"><div className="avatar">{session.user.email?.[0]?.toUpperCase()}</div><div className="user-text"><b>Administrator</b><small>{session.user.email}</small></div><button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={17}/></button></div>
      </div>
    </aside>
    {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"><X/></button>}
    <main className="main-area">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}><Menu/></button><div><div className="breadcrumb">SCARECROW <span>/</span> {title.toUpperCase()}</div><h2>{title}</h2></div>
        <div className="top-actions"><span className="live-indicator"><i/> Live database</span><button className="icon-btn" onClick={() => void load()} title="Refresh"><RefreshCw size={17}/></button></div>
      </header>
      <section className="content">
        {error && <div className="error-banner"><AlertTriangle size={17}/>{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
        {loading && <div className="loading-line"><span/> Syncing with Supabase…</div>}
        {page === 'overview' && <>
          <div className="welcome-row"><div><span className="eyebrow">FIELD OPERATIONS</span><h1>Good day, Administrator</h1><p>Here’s what’s happening across your ScareCROW field devices.</p></div><span className="date-pill"><Clock3 size={15}/>{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
          <div className="stats-grid">
            <Stat icon={Cpu} label="Registered devices" value={devices.length} note="All registered field units"/>
            <Stat icon={Wifi} label="Online devices" value={activeDevices.length} note="Heartbeat within 30 seconds" tone="green"/>
            <Stat icon={Bird} label="Bird detections today" value={birdsToday} note="Based on today's records" tone="gold"/>
            <Stat icon={AlertTriangle} label="Other events" value={alertLogs.length} note="Device and system activity" tone="red"/>
          </div>
          <div className="two-col">
            <section className="panel"><PanelTitle title="Device status" sub="Live heartbeat monitoring" action="View all" onAction={() => setPage('devices')}/>
              {devices.length === 0 ? <Empty text="No devices found in the database."/> : devices.map(d => <DeviceRow key={d.id} device={d}/>)}
            </section>
            <section className="panel"><PanelTitle title="Recent activity" sub="Latest database events" action="View logs" onAction={() => setPage('detections')}/>
              {logs.slice(0, 6).length === 0 ? <Empty text="No activity records yet."/> : logs.slice(0, 6).map(l => <LogRow key={l.id} log={l}/>)}
            </section>
          </div>
          <div className="note-strip"><CircleHelp size={18}/><span>Device status is calculated from <b>last_seen</b>. A device is online only when its latest heartbeat is within 30 seconds.</span></div>
        </>}
        {page === 'devices' && <><PageIntro title="Registered devices" desc="Monitor each field unit and its most recent heartbeat."/><div className="panel">
          <PanelTitle title={`${devices.length} registered device${devices.length === 1 ? '' : 's'}`} sub="Device information is read from your Supabase database"/>
          {devices.length === 0 ? <Empty text="No registered devices found."/> : <div className="table-wrap"><table><thead><tr><th>DEVICE</th><th>LOCATION</th><th>STATUS</th><th>LAST SEEN</th><th>IP ADDRESS</th></tr></thead><tbody>{devices.map(d=><tr key={d.id}><td><b>{d.name}</b><small className="cell-sub">{d.id}</small></td><td>{d.location || '—'}</td><td><Status online={alive(d.last_seen)}/></td><td>{ago(d.last_seen)}</td><td>{d.ip_address || 'Not set'}</td></tr>)}</tbody></table></div>}
        </div><div className="note-strip"><ShieldCheck size={18}/><span>Device creation, archiving, and deletion are intentionally not enabled in this first web build to protect registered field records.</span></div></>}
        {(page === 'detections' || page === 'alerts') && <><PageIntro title={page === 'detections' ? 'Detection & event history' : 'Alerts & activities'} desc="Records are loaded directly from detection_logs and update when new events arrive."/>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search species, event, or device…"/></div><span className="result-count">{(page === 'detections' ? filteredLogs.filter(l=>l.event_type==='bird_detected') : filteredLogs.filter(l=>l.event_type!=='bird_detected')).length} records</span></div>
          <div className="panel">{(page === 'detections' ? filteredLogs.filter(l=>l.event_type==='bird_detected') : filteredLogs.filter(l=>l.event_type!=='bird_detected')).length === 0 ? <Empty text="No matching records found."/> : (page === 'detections' ? filteredLogs.filter(l=>l.event_type==='bird_detected') : filteredLogs.filter(l=>l.event_type!=='bird_detected')).map(l=><LogRow key={l.id} log={l}/>)}</div>
        </>}
        {page === 'settings' && <><PageIntro title="System settings" desc="Manage your administrator session and notification preferences."/>
          <div className="settings-grid"><section className="panel"><PanelTitle title="Administrator account" sub="Currently signed-in account"/><div className="account-card"><div className="avatar large">{session.user.email?.[0]?.toUpperCase()}</div><div><b>{session.user.email}</b><small>Authenticated administrator</small></div></div><button className="secondary-btn" onClick={signOut}><LogOut size={16}/> Sign out</button></section>
          <section className="panel"><PanelTitle title="Notification preferences" sub="Saved per administrator account"/>{Object.entries({
            device_disconnection:'Device disconnection', device_errors:'Device errors', low_battery:'Low battery', device_recovery:'Device recovery', bird_detection:'Bird detection',
          }).map(([key,label])=><div className="pref-row" key={key}><span>{label}</span><button className={`toggle ${prefs[key] ? 'on' : ''}`} onClick={()=>void togglePref(key,!prefs[key])} aria-pressed={!!prefs[key]}><i/></button></div>)}</section></div>
        </>}
        <footer> SCARECROW • Smart field monitoring <span>Connected to Supabase</span></footer>
      </section>
    </main>
  </div>
}

function Brand(){return <div className="brand"><div className="brand-mark"><Leaf size={22}/></div><div><b>SCARECROW</b><small>SMART FIELD SYSTEM</small></div></div>}
function Stat({icon:Icon,label,value,note,tone='default'}:{icon:typeof Cpu;label:string;value:number;note:string;tone?:string}){return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function PanelTitle({title,sub,action,onAction}:{title:string;sub?:string;action?:string;onAction?:()=>void}){return <div className="panel-title"><div><h3>{title}</h3>{sub&&<p>{sub}</p>}</div>{action&&<button className="text-btn" onClick={onAction}>{action}<ChevronRight size={15}/></button>}</div>}
function PageIntro({title,desc}:{title:string;desc:string}){return <div className="page-intro"><h1>{title}</h1><p>{desc}</p></div>}
function Empty({text}:{text:string}){return <div className="empty-state"><Activity size={22}/><p>{text}</p></div>}
function Status({online}:{online:boolean}){return <span className={`status ${online?'online':'offline'}`}><i/>{online?'Online':'Offline'}</span>}
function DeviceRow({device}:{device:Device}){return <div className="device-row"><div className="device-icon"><Smartphone size={19}/></div><div className="row-main"><b>{device.name}</b><small>{device.location || 'Location not specified'} · {ago(device.last_seen)}</small></div><Status online={alive(device.last_seen)}/></div>}
function LogRow({log}:{log:Log}){const bird=log.event_type==='bird_detected';return <div className="log-row"><div className={`log-icon ${bird?'bird':'event'}`}>{bird?<Bird size={18}/>:<AlertTriangle size={18}/>}</div><div className="row-main"><b>{eventTitle(log)}</b><small>{log.devices?.name || 'Unknown device'} · {log.label}</small></div><time>{dateTime(log.created_at)}</time></div>}
