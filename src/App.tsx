
import { useEffect, useState } from 'react'

import { isSupabaseConfigured } from './lib/supabase'

import { useAuth } from './hooks/useAuth'
import { useDashboardData } from './hooks/useDashboardData'

import { translations } from './i18n/translations'

import type { Language, Page } from './types'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

import Login from './pages/Login'
import Overview from './pages/Overview'
import Devices from './pages/Devices'
import Clients from './pages/Clients'
import Detections from './pages/Detections'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'

export type Theme = 'light' | 'dark'

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('scarecrow-language')
    return saved === 'ceb' ? 'ceb' : 'en'
  })

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('scarecrow-theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  const [page, setPage] = useState<Page>('overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('scarecrow-theme', theme)
  }, [theme])

  const {
    session,
    loading: authLoading,
    isAdmin,
    adminLoading,
    signIn,
    signOut,
  } = useAuth()

  const {
    devices,
    logs,
    preferences,
    clientStats,
    loading: dataLoading,
    error,
    refresh,
  } = useDashboardData({
    session: isAdmin ? session : null,
  })

  const t = (key: string) =>
    translations[language][key] ??
    translations.en[key] ??
    key

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage)
    localStorage.setItem('scarecrow-language', nextLanguage)
  }

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme)
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="setup-screen">
        <div className="setup-card">
          <h1>{t('connect')}</h1>
          <p>{t('connectDesc')}</p>
          <p className="setup-warning">{t('neverKey')}</p>
        </div>
      </main>
    )
  }

  if (authLoading || adminLoading) {
    return (
      <main className="boot-screen">
        <div className="boot-content">
          <div className="boot-spinner" />
          <p>{t('loading')}</p>
        </div>
      </main>
    )
  }

  if (!session || !isAdmin) {
    return (
      <Login
        language={language}
        changeLanguage={changeLanguage}
        t={t}
        signIn={signIn}
      />
    )
  }

  const activeSession = session

  function renderPage() {
    switch (page) {
      case 'overview':
        return (
          <Overview
            devices={devices}
            logs={logs}
            clientStats={clientStats}
            language={language}
            t={t}
            loading={dataLoading}
            onNavigate={setPage}
          />
        )

      case 'devices':
        return (
          <Devices
            devices={devices}
            language={language}
            t={t}
            loading={dataLoading}
            onRefresh={() => void refresh()}
          />
        )

      case 'clients':
        return (
          <Clients
            devices={devices}
            loading={dataLoading}
            onRefresh={() => void refresh()}
          />
        )

      case 'detections':
        return (
          <Detections
            devices={devices}
            logs={logs}
            language={language}
            t={t}
            loading={dataLoading}
          />
        )

      case 'alerts':
        return (
          <Alerts
            logs={logs}
            language={language}
            t={t}
            loading={dataLoading}
          />
        )

      case 'settings':
        return (
          <Settings
            session={activeSession}
            preferences={preferences}
            language={language}
            changeLanguage={changeLanguage}
            t={t}
            signOut={signOut}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        onNavigate={setPage}
        onSignOut={() => void signOut()}
        t={t}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="main-area">
        <Topbar
          page={page}
          t={t}
          connected={!error}
          refreshing={dataLoading}
          onRefresh={() => void refresh()}
          onMenuClick={() => setMobileOpen(true)}
          theme={theme}
          changeTheme={changeTheme}
        />

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="page-content">
          {renderPage()}
        </div>

        <footer className="app-footer">
          {t('footer')}
        </footer>
      </main>
    </div>
  )
}