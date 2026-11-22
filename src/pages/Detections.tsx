
import { useMemo, useState } from 'react'
import {
  Bird,
  Search,
  CalendarDays,
  Filter,
  Clock3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import PageIntro from '../components/PageIntro'
import Empty from '../components/Empty'
import { translateSpecies } from '../utils/translateSpecies'
import type {
  Device,
  Language,
  Log,
  Translate,
} from '../types'

type DateFilter = 'all' | 'today' | 'yesterday' | 'custom'

type Props = {
  devices: Device[]
  logs: Log[]
  language: Language
  t: Translate
  loading: boolean
}

function isBirdDetection(log: Log) {
  return log.event_type?.toLowerCase() === 'bird_detected'
}

function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

function getStartOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

// Parse date input using local time.
function parseDateInput(value: string): Date | null {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function formatDate(value: string, language: Language) {
  const date = new Date(value)

  return date.toLocaleDateString(
    language === 'ceb' ? 'en-PH' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )
}

function formatTime(value: string, language: Language) {
  return new Date(value).toLocaleTimeString(
    language === 'ceb' ? 'en-PH' : 'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}

function getDeviceName(log: Log, devices: Device[]) {
  return (
    log.devices?.name ||
    devices.find(device => device.id === log.device_id)?.name ||
    'Unknown Device'
  )
}

export default function Detections({
  devices,
  logs,
  language,
  t,
  loading,
}: Props) {
  const [search, setSearch] = useState('')
  const [selectedDevice, setSelectedDevice] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  // Custom date range
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [showAll, setShowAll] = useState(false)

  const today = useMemo(() => new Date(), [])

  const yesterday = useMemo(() => {
    const date = new Date(today)
    date.setDate(date.getDate() - 1)
    return date
  }, [today])

  const birdLogs = useMemo(() => {
    return logs
      .filter(isBirdDetection)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
  }, [logs])

  // Summary uses all bird detections, independent of filters.
  const summary = useMemo(() => {
    const todayCount = birdLogs.filter(log =>
      isSameDay(new Date(log.created_at), today)
    ).length

    const weekStart = getStartOfDay(today)
    weekStart.setDate(weekStart.getDate() - 6)

    const weekCount = birdLogs.filter(log => {
      const date = new Date(log.created_at)
      return date >= weekStart && date <= new Date()
    }).length

    const speciesCount = new Set(
      birdLogs
        .map(log => log.species?.trim())
        .filter((species): species is string => Boolean(species))
    ).size

    return {
      total: birdLogs.length,
      today: todayCount,
      week: weekCount,
      species: speciesCount,
    }
  }, [birdLogs, today])

  // Filter bird detections.
  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()

    const startBoundary = parseDateInput(startDate)
    const endBoundary = parseDateInput(endDate)

    // Add one day so the selected end date is inclusive.
    const endExclusive = endBoundary
      ? new Date(endBoundary)
      : null

    if (endExclusive) {
      endExclusive.setDate(endExclusive.getDate() + 1)
    }

    return birdLogs.filter(log => {
      const logDate = new Date(log.created_at)

      const matchesDevice =
        selectedDevice === 'all' ||
        log.device_id === selectedDevice

      let matchesDate = true

      if (dateFilter === 'today') {
        matchesDate = isSameDay(logDate, today)
      } else if (dateFilter === 'yesterday') {
        matchesDate = isSameDay(logDate, yesterday)
      } else if (dateFilter === 'custom') {
        matchesDate =
          (!startBoundary || logDate >= startBoundary) &&
          (!endExclusive || logDate < endExclusive)
      }

      const deviceName = getDeviceName(log, devices)

      const matchesSearch =
        !query ||
        [
          log.species,
          log.label,
          deviceName,
          log.device_id,
        ]
          .filter(Boolean)
          .some(value =>
            String(value).toLowerCase().includes(query)
          )

      return matchesDevice && matchesDate && matchesSearch
    })
  }, [
    birdLogs,
    selectedDevice,
    dateFilter,
    startDate,
    endDate,
    search,
    devices,
    today,
    yesterday,
  ])

  // Show only the five newest matching records unless expanded.
  const visibleLogs = useMemo(() => {
    return showAll ? filteredLogs : filteredLogs.slice(0, 5)
  }, [filteredLogs, showAll])

  // Group only the visible records by date.
  const groupedLogs = useMemo(() => {
    const groups = {
      today: [] as Log[],
      yesterday: [] as Log[],
      earlier: [] as Log[],
    }

    visibleLogs.forEach(log => {
      const date = new Date(log.created_at)

      if (isSameDay(date, today)) {
        groups.today.push(log)
      } else if (isSameDay(date, yesterday)) {
        groups.yesterday.push(log)
      } else {
        groups.earlier.push(log)
      }
    })

    return groups
  }, [visibleLogs, today, yesterday])

  function handleDateFilterChange(value: DateFilter) {
    setDateFilter(value)

    if (value !== 'custom') {
      setStartDate('')
      setEndDate('')
    }
  }

  function renderLog(log: Log) {
    const deviceName = getDeviceName(log, devices)

    return (
      <div className="detection-log-item" key={log.id}>
        <div className="detection-log-icon">
          <Bird size={19} />
        </div>

        <div className="detection-log-info">
          <div className="detection-log-heading">
            <strong>
              {translateSpecies(log.species, t) || 'Unknown Species'}
            </strong>

            <span className="detection-log-time">
              <Clock3 size={12} />
              {formatTime(log.created_at, language)}
            </span>
          </div>

          <div className="detection-log-details">
            <span>{deviceName}</span>
            <span className="detection-log-dot">•</span>
            <span>{formatDate(log.created_at, language)}</span>
          </div>
        </div>

        <span className="detection-log-badge">
          Bird Detected
        </span>
      </div>
    )
  }

  function renderGroup(title: string, items: Log[]) {
    if (items.length === 0) return null

    return (
      <div className="detection-log-group">
        <div className="detection-group-heading">
          <h3>{title}</h3>
          <span>{items.length}</span>
        </div>

        <div className="detection-group-list">
          {items.map(renderLog)}
        </div>
      </div>
    )
  }

  return (
    <div className="detections-page">
      <PageIntro
        title={t('detections')}
        desc="View and monitor recorded bird detections from your field devices."
      />

      {/* BIRD DETECTION SUMMARY */}

      <section className="detection-summary-section">
        <div className="detection-section-heading">
          <div>
            <h2>Bird Detection Summary</h2>
            <p>Overview of recorded bird detections.</p>
          </div>

          <span className="detection-summary-label">
            <Bird size={14} />
            Bird Detections
          </span>
        </div>

        <div className="detection-summary-grid">
          <div className="detection-summary-card">
            <div className="detection-summary-icon total">
              <Bird size={19} />
            </div>

            <div>
              <span>Total Detections</span>
              <strong>{summary.total}</strong>
            </div>
          </div>

          <div className="detection-summary-card">
            <div className="detection-summary-icon today">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>Detections Today</span>
              <strong>{summary.today}</strong>
            </div>
          </div>

          <div className="detection-summary-card">
            <div className="detection-summary-icon week">
              <Clock3 size={19} />
            </div>

            <div>
              <span>Detections This Week</span>
              <strong>{summary.week}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* DETECTION LOGS */}

      <section className="panel detection-logs-panel">
        <div className="panel-title">
          <div>
            <h2>{t('birdDetectionLogs')}</h2>
            <p>Recorded bird detection events from registered devices.</p>
          </div>

          <span className="result-count">
            {filteredLogs.length} Records
          </span>
        </div>

        {/* FILTERS */}

        <div className="detection-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search species or device..."
              aria-label="Search bird detections"
            />
          </div>

          {/* DEVICE FILTER */}

          <div className="detection-filter">
            <Filter size={15} />

            <select
              value={selectedDevice}
              onChange={event =>
                setSelectedDevice(event.target.value)
              }
              aria-label="Filter by device"
            >
              <option value="all">All Devices</option>

              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>

            <ChevronDown size={14} />
          </div>

          {/* DATE FILTER */}

          <div className="detection-filter">
            <CalendarDays size={15} />

            <select
              value={dateFilter}
              onChange={event =>
                handleDateFilterChange(
                  event.target.value as DateFilter
                )
              }
              aria-label="Filter by date"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom Range</option>
            </select>

            <ChevronDown size={14} />
          </div>

          {/* CUSTOM DATE RANGE */}

          {dateFilter === 'custom' && (
            <div className="detection-date-range">
              <label className="detection-date-field">
                <span>From</span>

                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={event =>
                    setStartDate(event.target.value)
                  }
                  aria-label="Start date"
                />
              </label>

              <label className="detection-date-field">
                <span>To</span>

                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={event =>
                    setEndDate(event.target.value)
                  }
                  aria-label="End date"
                />
              </label>
            </div>
          )}
        </div>

        {/* LOG RESULTS */}

        {loading ? (
          <div className="loading-state">
            {t('loading')}
          </div>
        ) : filteredLogs.length === 0 ? (
          <Empty
            text={
              search ||
              selectedDevice !== 'all' ||
              dateFilter !== 'all'
                ? 'No bird detections match your filters.'
                : 'No bird detections have been recorded yet.'
            }
          />
        ) : (
          <>
            <div className="detection-log-groups">
              {renderGroup('Today', groupedLogs.today)}
              {renderGroup('Yesterday', groupedLogs.yesterday)}
              {renderGroup('Earlier', groupedLogs.earlier)}
            </div>

            {filteredLogs.length > 5 && (
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
                    Show All {filteredLogs.length} Detections
                    <ChevronDown size={15} />
                  </>
                )}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}