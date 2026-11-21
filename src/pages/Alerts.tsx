
import { useMemo, useState } from 'react'
import {
  Search,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import PageIntro from '../components/PageIntro'
import Empty from '../components/Empty'
import LogRow from '../components/LogRow'

import type { Language, Log, Translate } from '../types'

type Props = {
  logs: Log[]
  language: Language
  t: Translate
  loading: boolean
}

export default function Alerts({
  logs,
  language,
  t,
  loading,
}: Props) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const alertLogs = useMemo(() => {
    return logs
      .filter(log => log.event_type !== 'bird_detected')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
  }, [logs])

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return alertLogs

    return alertLogs.filter(log => {
      const deviceName = log.devices?.name || ''

      return [
        log.label,
        log.event_type,
        log.species,
        deviceName,
        log.device_id,
      ]
        .filter(Boolean)
        .some(value =>
          String(value).toLowerCase().includes(query)
        )
    })
  }, [alertLogs, search])

  // Show only the five newest alerts unless expanded.
  const visibleAlerts = useMemo(() => {
    return showAll
      ? filteredAlerts
      : filteredAlerts.slice(0, 5)
  }, [filteredAlerts, showAll])

  const totalAlerts = alertLogs.length

  return (
    <div className="alerts-page">
      <PageIntro
        title={t('alertsTitle')}
        desc={t('recordsDesc')}
      />

      {/* ALERT AND ACTIVITY SUMMARY */}

      <div className="stats-grid alert-stats">
        <div className="stat-card">
          <div className="stat-icon red">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="stat-label">{t('alertsTitle')}</span>
            <strong className="stat-value">{totalAlerts}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Activity size={20} />
          </div>
          <div>
            <span className="stat-label">{t('deviceActivity')}</span>
            <strong className="stat-value">{filteredAlerts.length}</strong>
          </div>
        </div>
      </div>

      {/* ALERTS AND ACTIVITIES LIST */}

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>{t('alertsTitle')}</h2>
            <p>{t('latestEvents')}</p>
          </div>

          <span className="result-count">
            {filteredAlerts.length} {t('records')}
          </span>
        </div>

        {/* SEARCH */}

        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
            />
          </div>
        </div>

        {/* LOG RESULTS */}

        {loading ? (
          <div className="loading-state">
            {t('loading')}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Empty
            text={search ? t('noMatches') : t('noActivity')}
          />
        ) : (
          <>
            <div className="panel-list">
              {visibleAlerts.map(log => (
                <div className="alert-log-row" key={log.id}>
                  <div className="alert-log-content">
                    <LogRow
                      log={log}
                      language={language}
                      t={t}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* SHOW ALL / SHOW LESS */}

            {filteredAlerts.length > 5 && (
              <button
                type="button"
                className="detection-expand-button"
                onClick={() => setShowAll(prev => !prev)}
                aria-expanded={showAll}
              >
                {showAll ? (
                  <>
                    Show Less
                    <ChevronUp size={15} />
                  </>
                ) : (
                  <>
                    Show All {filteredAlerts.length} Records
                    <ChevronDown size={15} />
                  </>
                )}
              </button>
            )}
          </>
        )}
      </section>

      {/* INFORMATION NOTE */}

      <div className="note-strip">
        <Activity size={18} />
        <span>{t('recordsDesc')}</span>
      </div>
    </div>
  )
}
