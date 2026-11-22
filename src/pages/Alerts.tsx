
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

type DatePreset = 'all' | 'today' | 'yesterday' | 'custom'

type Props = {
  logs: Log[]
  language: Language
  t: Translate
  loading: boolean
}

function parseLocalDate(value: string) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function Alerts({
  logs,
  language,
  t,
  loading,
}: Props) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const today = new Date()

  const alertLogs = useMemo(() => {
    return logs
      .filter(log => log.event_type !== 'bird_detected')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
  }, [logs])

  // DATE FILTER
  const dateFilteredAlerts = useMemo(() => {
    if (datePreset === 'all') return alertLogs

    if (datePreset === 'custom') {
      const start = parseLocalDate(startDate)
      const end = parseLocalDate(endDate)

      if (!start || !end || end < start) return []

      start.setHours(0, 0, 0, 0)

      const endExclusive = new Date(end)
      endExclusive.setDate(endExclusive.getDate() + 1)
      endExclusive.setHours(0, 0, 0, 0)

      return alertLogs.filter(log => {
        const logDate = new Date(log.created_at)

        return (
          !Number.isNaN(logDate.getTime()) &&
          logDate >= start &&
          logDate < endExclusive
        )
      })
    }

    const targetDate = new Date()

    if (datePreset === 'yesterday') {
      targetDate.setDate(targetDate.getDate() - 1)
    }

    const targetDateString = targetDate.toDateString()

    return alertLogs.filter(log => {
      const logDate = new Date(log.created_at)

      return (
        !Number.isNaN(logDate.getTime()) &&
        logDate.toDateString() === targetDateString
      )
    })
  }, [alertLogs, datePreset, startDate, endDate])

  // SEARCH FILTER
  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return dateFilteredAlerts

    return dateFilteredAlerts.filter(log => {
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
  }, [dateFilteredAlerts, search])

  // SHOW ALL / SHOW LESS
  const visibleAlerts = useMemo(() => {
    return showAll
      ? filteredAlerts
      : filteredAlerts.slice(0, 5)
  }, [filteredAlerts, showAll])

  const validCustomRange =
    datePreset !== 'custom' ||
    (
      !!parseLocalDate(startDate) &&
      !!parseLocalDate(endDate) &&
      parseLocalDate(endDate)! >= parseLocalDate(startDate)!
    )

  // SUMMARY COUNTS
  const totalAlerts = dateFilteredAlerts.length
  const totalActivities = filteredAlerts.length

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
            <strong className="stat-value">{totalActivities}</strong>
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
              onChange={event => {
                setSearch(event.target.value)
                setShowAll(false)
              }}
              placeholder={t('search')}
              aria-label={t('search')}
            />
          </div>
        </div>

        {/* DATE FILTERS */}

        <div className="alerts-date-filters">
          <button
            type="button"
            className={datePreset === 'all' ? 'active' : ''}
            onClick={() => {
              setDatePreset('all')
              setShowAll(false)
            }}
          >
            {t('allTime')}
          </button>

          <button
            type="button"
            className={datePreset === 'today' ? 'active' : ''}
            onClick={() => {
              setDatePreset('today')
              setShowAll(false)
            }}
          >
            {t('today')}
          </button>

          <button
            type="button"
            className={datePreset === 'yesterday' ? 'active' : ''}
            onClick={() => {
              setDatePreset('yesterday')
              setShowAll(false)
            }}
          >
            {t('yesterday')}
          </button>

          <button
            type="button"
            className={datePreset === 'custom' ? 'active' : ''}
            onClick={() => {
              setDatePreset('custom')
              setShowAll(false)
            }}
          >
            {t('customRange')}
          </button>
        </div>

        {/* CUSTOM DATE RANGE */}

        {datePreset === 'custom' && (
          <div className="alerts-custom-date-range">
            <div className="alerts-date-field">
              <label htmlFor="alerts-start-date">
                {t('startDate')}
              </label>

              <input
                id="alerts-start-date"
                type="date"
                value={startDate}
                max={endDate || getLocalDateString(today)}
                onChange={event => {
                  setStartDate(event.target.value)
                  setShowAll(false)
                }}
              />
            </div>

            <div className="alerts-date-field">
              <label htmlFor="alerts-end-date">
                {t('endDate')}
              </label>

              <input
                id="alerts-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={getLocalDateString(today)}
                onChange={event => {
                  setEndDate(event.target.value)
                  setShowAll(false)
                }}
              />
            </div>

            {!validCustomRange && (
              <span className="alerts-date-error">
                {t('selectValidDateRange')}
              </span>
            )}
          </div>
        )}

        {/* LOG RESULTS */}

        {loading ? (
          <div className="loading-state">
            {t('loading')}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Empty
            text={
              search
                ? t('noMatches')
                : t('noActivity')
            }
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