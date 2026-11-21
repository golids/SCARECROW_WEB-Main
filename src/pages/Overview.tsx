
import { useMemo, useState } from 'react'
import {
  Activity,
  Bird,
  Cpu,
  Wifi,
} from 'lucide-react'

import Stat from '../components/Stat'
import PanelTitle from '../components/PanelTitle'
import Empty from '../components/Empty'
import DeviceRow from '../components/DeviceRow'

import type { Device, Language, Log, Translate } from '../types'
import { alive } from '../utils/deviceHelpers'

type StatsPreset = '7d' | '30d' | 'all'

type Props = {
  devices: Device[]
  logs: Log[]
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

export default function Overview({
  devices,
  logs,
  language,
  t,
  loading,
  onNavigate,
}: Props) {
  const [selectedDeviceId, setSelectedDeviceId] =
    useState<string | null>(null)

  const [preset, setPreset] = useState<StatsPreset>('7d')

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

    const days = preset === '7d' ? 7 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)

    return selectedDeviceLogs.filter(log => {
      const logDate = new Date(log.created_at)
      return logDate >= startDate && logDate <= new Date()
    })
  }, [selectedDeviceLogs, preset])

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

    const days = preset === '7d' ? 7 : 30

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
          </div>

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