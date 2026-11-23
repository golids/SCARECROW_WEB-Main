
import {
  LayoutDashboard,
  Cpu,
  Users,
  Bird,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

import Brand from './Brand'
import type { Page, Translate } from '../types'

type Props = {
  page: Page
  onNavigate: (page: Page) => void
  onSignOut: () => void
  t: Translate
  mobileOpen: boolean
  onClose: () => void
}

const navigation: {
  page: Page
  label: string
  icon: typeof LayoutDashboard
}[] = [
  { page: 'overview', label: 'overview', icon: LayoutDashboard },
  { page: 'devices', label: 'devices', icon: Cpu },
  { page: 'clients', label: 'clients', icon: Users },
  { page: 'detections', label: 'detections', icon: Bird },
  { page: 'alerts', label: 'alerts', icon: Bell },
  { page: 'settings', label: 'settings', icon: SettingsIcon },
]

export default function Sidebar({
  page,
  onNavigate,
  onSignOut,
  t,
  mobileOpen,
  onClose,
}: Props) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
        </div>

        <div className="side-caption">
          {t('workspace')}
        </div>

        <nav className="side-nav">
          {navigation.map(item => {
            const Icon = item.icon

            return (
              <button
                type="button"
                key={item.page}
                className={`nav-item ${page === item.page ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.page)
                  onClose()
                }}
              >
                <Icon size={19} />
                <span>{t(item.label)}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-secure">
            <ShieldCheck size={17} />
            <span>{t('secure')}</span>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={onSignOut}
          >
            <LogOut size={18} />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
