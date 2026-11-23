
import { useMemo, useState } from 'react'
import {
  Activity,
  Bird,
  Cpu,
  Wifi,
  Users,
  UserCheck,
  UserX,
  Link2,
} from 'lucide-react'

import Stat from '../components/Stat'
import PanelTitle from '../components/PanelTitle'
import Empty from '../components/Empty'
import DeviceRow from '../components/DeviceRow'

import type { Device, Language, Log, Translate } from '../types'
import type { ClientStats } from '../hooks/useDashboardData'
import { alive } from '../utils/deviceHelpers'

type StatsPreset = '7d' | '30d' | 'all' | 'custom'

type Props = {
  devices: Device[]
  logs: Log[]
  clientStats: ClientStats
  language: Language
  t: Translate
  loading: boolean
  onNavigate: (page: 'devices' | 'detections' | 'alerts') => void
}

function isBirdDetection(log: Log) {
  return log.event_type?.toLowerCase() === 'bird_detected'
}

function isOfflineEvent(log: Log) {
  const event = `${log.event_type} ${log.label}`.toLowerCase()

  return (
    event.includes('offline') ||
    event.includes('disconnect')
  )
}

// Parse YYYY-MM-DD as a local date instead of UTC.
function parseLocalDate(value: string) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)

  // Reject invalid calendar dates.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export default function Overview({
  devices,
  logs,
  clientStats,
  language,
  t,
  loading,
  onNavigate,
}: Props) {
  const [selectedDeviceId, setSelectedDeviceId] =
    useState<string | null>(null)

  const [preset, setPreset] = useState<StatsPreset>('7d')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const today = new Date()

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      const aOnline = alive(a.last_seen)
      const bOnline = alive(b.last_seen)

      return Number(bOnline) - Number(aOnline)
    })
  }, [devices])

  const selectedDevice = devices.find(
    device => device.id === selectedDeviceId
  ) ?? null

  const selectedDeviceLogs = useMemo(() => {
    if (!selectedDeviceId) return []

    return logs.filter(log => log.device_id === selectedDeviceId)
  }, [logs, selectedDeviceId])

  const filteredLogs = useMemo(() => {
    if (preset === 'all') return selectedDeviceLogs

    if (preset === 'custom') {
      const start = parseLocalDate(startDate)
      const end = parseLocalDate(endDate)

      if (!start || !end || end < start) return []

      start.setHours(0, 0, 0, 0)

      // Exclusive next-day boundary includes the entire end date.
      const endExclusive = new Date(end)
      endExclusive.setDate(endExclusive.getDate() + 1)
      endExclusive.setHours(0, 0, 0, 0)

      return selectedDeviceLogs.filter(log => {
        const logDate = new Date(log.created_at)

        return (
          !Number.isNaN(logDate.getTime()) &&
          logDate >= start &&
          logDate < endExclusive
        )
      })
    }

    const days = preset === '7d' ? 7 : 30
    const rangeStart = new Date()

    rangeStart.setDate(rangeStart.getDate() - (days - 1))
    rangeStart.setHours(0, 0, 0, 0)

    return selectedDeviceLogs.filter(log => {
      const logDate = new Date(log.created_at)

      return (
        !Number.isNaN(logDate.getTime()) &&
        logDate >= rangeStart &&
        logDate <= new Date()
      )
    })
  }, [selectedDeviceLogs, preset, startDate, endDate])

  const birdLogs = filteredLogs.filter(isBirdDetection)
  const offlineLogs = filteredLogs.filter(isOfflineEvent)

  const detectionsToday = selectedDeviceLogs.filter(log => {
    if (!isBirdDetection(log)) return false

    return (
      new Date(log.created_at).toDateString() ===
      today.toDateString()
    )
  }).length

  const averagePerDay = (() => {
    if (filteredLogs.length === 0) return 0

    if (preset === 'all') {
      const dates = filteredLogs.map(log =>
        new Date(log.created_at).toDateString()
      )

      const uniqueDays = new Set(dates).size

      return uniqueDays > 0
        ? Number((birdLogs.length / uniqueDays).toFixed(1))
        : 0
    }

    let days = preset === '7d' ? 7 : 30

    if (preset === 'custom') {
      const start = parseLocalDate(startDate)
      const end = parseLocalDate(endDate)

      if (!start || !end || end < start) return 0

      const millisecondsPerDay = 24 * 60 * 60 * 1000

      days =
        Math.round(
          (end.getTime() - start.getTime()) /
          millisecondsPerDay
        ) + 1
    }

    return Number((birdLogs.length / days).toFixed(1))
  })()

  const peakTime = (() => {
    if (birdLogs.length === 0) return '—'

    const hours = new Array(24).fill(0)

    birdLogs.forEach(log => {
      const hour = new Date(log.created_at).getHours()
      hours[hour] += 1
    })

    const peakHour = hours.indexOf(Math.max(...hours))

    return `${String(peakHour).padStart(2, '0')}:00`
  })()

  const onlineDevices = devices.filter(device =>
    alive(device.last_seen)
  ).length

  const offlineDevices = devices.length - onlineDevices

  const allBirdDetectionsToday = logs.filter(log => {
    if (!isBirdDetection(log)) return false

    return (
      new Date(log.created_at).toDateString() ===
      today.toDateString()
    )
  }).length

  const allBirdDetectionsThisWeek = logs.filter(log => {
    if (!isBirdDetection(log)) return false

    const logDate = new Date(log.created_at)
    const startOfWeek = new Date()

    startOfWeek.setDate(startOfWeek.getDate() - 6)
    startOfWeek.setHours(0, 0, 0, 0)

    return logDate >= startOfWeek && logDate <= new Date()
  }).length

  const validCustomRange =
    preset !== 'custom' ||
    (
      !!parseLocalDate(startDate) &&
      !!parseLocalDate(endDate) &&
      parseLocalDate(endDate)! >= parseLocalDate(startDate)!
    )

  return (
    <div className="overview-page">
      {/* PAGE HEADING */}

      <div className="welcome-row">
        <div>
          <h1>{t('overview')}</h1>
          <p>{t('overviewDesc')}</p>
        </div>
      </div>

      {/* DEVICE SUMMARY */}

      <div className="stats-grid">
        <Stat
          icon={Cpu}
          label={t('registered')}
          value={devices.length}
          note={t('registeredNote')}
          tone="green"
        />

        <Stat
          icon={Wifi}
          label={t('online')}
          value={onlineDevices}
          note={`${offlineDevices} ${t('offline')}`}
          tone="gold"
        />

        <Stat
          icon={Bird}
          label={t('birdsToday')}
          value={allBirdDetectionsToday}
          note={`${allBirdDetectionsThisWeek} ${t('thisWeek')}`}
          tone="green"
        />

        <Stat
          icon={Activity}
          label={t('offlineDevices')}
          value={offlineDevices}
          note={t('deviceActivity')}
          tone="red"
        />
      </div>

      {/* CLIENT SUMMARY */}

      <div className="stats-grid">
        <Stat
          icon={Users}
          label="Registered Clients"
          value={clientStats.registeredClients}
          note="Total client accounts"
          tone="green"
        />

        <Stat
          icon={UserCheck}
          label="Clients with Devices"
          value={clientStats.clientsWithDevices}
          note="Clients with at least one device"
          tone="green"
        />

        <Stat
          icon={UserX}
          label="Clients without Devices"
          value={clientStats.clientsWithoutDevices}
          note="Clients without an assigned device"
          tone="gold"
        />

        <Stat
          icon={Link2}
          label="Active Assignments"
          value={clientStats.activeAssignments}
          note="Currently assigned devices"
          tone="gold"
        />
      </div>

      {/* DEVICE OVERVIEW */}

      <section className="panel">
        <PanelTitle
          title={t('deviceStatus')}
          sub={t('liveHeartbeat')}
          action={t('viewAll')}
          onAction={() => onNavigate('devices')}
        />

        {loading ? (
          <div className="loading-state">
            {t('loading')}
          </div>
        ) : sortedDevices.length === 0 ? (
          <Empty text={t('noDevices')} />
        ) : (
          <div className="panel-list">
            {sortedDevices.map(device => {
              const isSelected = selectedDeviceId === device.id

              return (
                <div
                  key={device.id}
                  className={`overview-device-select ${
                    isSelected ? 'selected' : ''
                  }`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() =>
                    setSelectedDeviceId(
                      isSelected ? null : device.id
                    )
                  }
                  onKeyDown={event => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault()

                      setSelectedDeviceId(
                        isSelected ? null : device.id
                      )
                    }
                  }}
                >
                  <DeviceRow
                    device={device}
                    language={language}
                    t={t}
                  />

                  <span className="overview-select-indicator">
                    {isSelected
                      ? t('selected')
                      : t('viewStatistics')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* SELECTED DEVICE STATISTICS */}

      {selectedDevice && (
        <section className="panel overview-device-statistics">
          <PanelTitle
            title={t('deviceStatistics')}
            sub={`${t('statisticsFor')} ${selectedDevice.name}`}
          />

          {/* DATE FILTERS */}

          <div className="overview-stat-filters">
            <button
              className={preset === '7d' ? 'active' : ''}
              onClick={() => setPreset('7d')}
              type="button"
            >
              {t('last7Days')}
            </button>

            <button
              className={preset === '30d' ? 'active' : ''}
              onClick={() => setPreset('30d')}
              type="button"
            >
              {t('last30Days')}
            </button>

            <button
              className={preset === 'all' ? 'active' : ''}
              onClick={() => setPreset('all')}
              type="button"
            >
              {t('allTime')}
            </button>

            <button
              className={preset === 'custom' ? 'active' : ''}
              onClick={() => setPreset('custom')}
              type="button"
            >
              {t('customRange')}
            </button>
          </div>

          {/* CUSTOM DATE INPUTS */}

          {preset === 'custom' && (
            <div className="overview-custom-date-range">
              <div className="overview-date-field">
                <label htmlFor="overview-start-date">
                  {t('startDate')}
                </label>

                <input
                  id="overview-start-date"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={event =>
                    setStartDate(event.target.value)
                  }
                />
              </div>

              <div className="overview-date-field">
                <label htmlFor="overview-end-date">
                  {t('endDate')}
                </label>

                <input
                  id="overview-end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  max={new Date().toLocaleDateString('en-CA')}
                  onChange={event =>
                    setEndDate(event.target.value)
                  }
                />
              </div>

              {!validCustomRange && (
                <span className="overview-date-error">
                  {t('selectValidDateRange')}
                </span>
              )}
            </div>
          )}

          {/* STATISTICS */}

          <div className="stats-grid">
            <Stat
              icon={Activity}
              label={t('totalEvents')}
              value={filteredLogs.length}
              note={t('eventsRecorded')}
              tone="green"
            />

            <Stat
              icon={Bird}
              label={t('birdAlerts')}
              value={birdLogs.length}
              note={t('birdDetections')}
              tone="green"
            />

            <Stat
              icon={Wifi}
              label={t('offlineEvents')}
              value={offlineLogs.length}
              note={t('connectionEvents')}
              tone="red"
            />

            <Stat
              icon={Bird}
              label={t('detectedToday')}
              value={detectionsToday}
              note={t('birdDetectionsToday')}
              tone="gold"
            />

            <Stat
              icon={Activity}
              label={t('averagePerDay')}
              value={averagePerDay}
              note={t('detectionsPerDay')}
              tone="green"
            />

            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">
                  {t('peakTime')}
                </span>

                <strong className="stat-value">
                  {peakTime}
                </strong>

                <span className="stat-note">
                  {t('mostDetections')}
                </span>
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <Empty text={t('noStatistics')} />
          )}
        </section>
      )}

      {/* INFORMATION NOTE */}

      <div className="note-strip">
        <Activity size={18} />
        <span>
          {t('statusNote')} {t('statusNoteEnd')}
        </span>
      </div>
    </div>
  )
}