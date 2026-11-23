
import {
  Menu,
  RefreshCw,
  Wifi,
  WifiOff,
  Sun,
  Moon,
} from 'lucide-react'

import type { Page, Translate } from '../types'
import type { Theme } from '../App'

type Props = {
  page: Page
  t: Translate
  connected: boolean
  refreshing: boolean
  onRefresh: () => void
  onMenuClick: () => void
  theme: Theme
  changeTheme: (theme: Theme) => void
}

const pageTitles: Record<Page, string> = {
  overview: 'Overview',
  devices: 'registeredTitle',
  clients: 'Client Management',
  detections: 'history',
  alerts: 'alertsTitle',
  settings: 'systemSettings',
}

export default function Topbar({
  page,
  t,
  connected,
  refreshing,
  onRefresh,
  onMenuClick,
  theme,
  changeTheme,
}: Props) {
  const toggleTheme = () => {
    changeTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <div className="topbar-heading">
          <span className="topbar-caption">{t('fieldOps')}</span>
          <h1>{t(pageTitles[page])}</h1>
        </div>
      </div>

      <div className="topbar-actions">

        {/* Connection Status */}
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? (
            <Wifi size={16} />
          ) : (
            <WifiOff size={16} />
          )}

          <span>{connected ? t('connected') : 'Disconnected'}</span>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          className="refresh-button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label={t('refresh')}
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'spin' : ''}
          />
          <span>{refreshing ? t('syncing') : t('refresh')}</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          className="topbar-theme-toggle"
          onClick={toggleTheme}
          aria-label={
            theme === 'light'
              ? 'Switch to dark mode'
              : 'Switch to light mode'
          }
          title={
            theme === 'light'
              ? 'Switch to dark mode'
              : 'Switch to light mode'
          }
        >
          {theme === 'light' ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>

      </div>
    </header>
  )
}