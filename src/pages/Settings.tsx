
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Bell,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

import LanguagePicker from '../components/LanguagePicker'
import type { Language, Translate } from '../types'
import type { NotificationPreferences } from '../hooks/useDashboardData'
import { supabase } from '../lib/supabase'

type Props = {
  session: Session
  preferences: NotificationPreferences | null
  language: Language
  changeLanguage: (language: Language) => void
  t: Translate
  signOut: () => Promise<void>
}

const defaultPreferences: NotificationPreferences = {
  device_disconnection: true,
  device_errors: true,
  low_battery: true,
  device_recovery: true,
  bird_detection: true,
}

const preferenceItems = [
  {
    key: 'device_disconnection',
    label: 'disconnection',
    description: 'Receive notifications when a device disconnects.',
  },
  {
    key: 'device_errors',
    label: 'errors',
    description: 'Receive notifications when a device reports an error.',
  },
  {
    key: 'low_battery',
    label: 'lowBattery',
    description: 'Receive notifications when a device battery is low.',
  },
  {
    key: 'device_recovery',
    label: 'recovery',
    description: 'Receive notifications when a device reconnects.',
  },
  {
    key: 'bird_detection',
    label: 'birdDetection',
    description: 'Receive notifications when birds are detected.',
  },
] as const

type PreferenceKey = keyof NotificationPreferences

export default function Settings({
  session,
  preferences,
  language,
  changeLanguage,
  t,
  signOut,
}: Props) {
  const [values, setValues] =
    useState<NotificationPreferences>(preferences ?? defaultPreferences)

  const [saving, setSaving] = useState<PreferenceKey | null>(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    setValues(preferences ?? defaultPreferences)
  }, [preferences])

  async function togglePreference(key: PreferenceKey) {
    if (!supabase) {
      setSaveError('Supabase is not configured.')
      return
    }

    const updatedValues = {
      ...values,
      [key]: !values[key],
    }

    setSaving(key)
    setSaveMessage('')
    setSaveError('')

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: session.user.id,
            ...updatedValues,
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error

      setValues(updatedValues)
      setSaveMessage('Notification preferences saved.')
    } catch (error) {
      console.error('Unable to save notification preferences:', error)

      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to save notification preferences.'
      )
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="settings-page">
      <div className="page-intro">
        <div>
          <h1>{t('systemSettings')}</h1>
          <p>{t('settingsDesc')}</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="panel settings-panel">
          <div className="panel-title">
            <div>
              <h2>{t('account')}</h2>
              <p>{t('signedIn')}</p>
            </div>
            <ShieldCheck size={22} />
          </div>

          <div className="account-card">
            <div className="account-avatar">
              <ShieldCheck size={24} />
            </div>

            <div className="account-details">
              <strong>{session.user.email}</strong>
              <span>{t('authenticated')}</span>
            </div>
          </div>

          <button
            type="button"
            className="secondary-button signout-button"
            onClick={() => void signOut()}
          >
            <LogOut size={17} />
            {t('signOut')}
          </button>
        </section>

        <section className="panel settings-panel">
          <div className="panel-title">
            <div>
              <h2>{t('language')}</h2>
              <p>{t('languageDesc')}</p>
            </div>
          </div>

          <LanguagePicker
            language={language}
            changeLanguage={changeLanguage}
            t={t}
          />
        </section>

        <section className="panel settings-panel notification-panel">
          <div className="panel-title">
            <div>
              <h2>{t('notifications')}</h2>
              <p>{t('savedPerAccount')}</p>
            </div>
            <Bell size={22} />
          </div>

          {preferenceItems.map(item => {
            const key = item.key
            const enabled = values[key]

            return (
              <div className="pref-row" key={key}>
                <div className="pref-info">
                  <strong>{t(item.label)}</strong>
                  <small>{item.description}</small>
                </div>

                <button
                  type="button"
                  className={`toggle ${enabled ? 'enabled' : ''}`}
                  role="switch"
                  aria-checked={enabled}
                  aria-label={t(item.label)}
                  disabled={saving !== null}
                  onClick={() => void togglePreference(key)}
                >
                  <span />
                </button>
              </div>
            )
          })}

          {saving && (
            <p className="settings-feedback">
              {t('syncing')}
            </p>
          )}

          {saveMessage && (
            <p className="settings-success">
              <CheckCircle2 size={16} />
              {saveMessage}
            </p>
          )}

          {saveError && (
            <p className="settings-error">
              <AlertCircle size={16} />
              {saveError}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
