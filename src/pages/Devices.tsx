
import { useMemo, useState } from 'react'
import {
  Search,
  Cpu,
  Pencil,
  Archive,
  X,
  ShieldCheck,
  Loader2,
} from 'lucide-react'

import PageIntro from '../components/PageIntro'
import Empty from '../components/Empty'
import DeviceRow from '../components/DeviceRow'

import { supabase } from '../lib/supabase'
import type { Device, Language, Translate } from '../types'

type DeviceForm = {
  name: string
  location: string
  ip_address: string
  port: string
  status: string
}

type DeviceOperation = 'edit' | 'archive'

type Props = {
  devices: Device[]
  language: Language
  t: Translate
  loading: boolean
  onRefresh?: () => void
}

const emptyForm: DeviceForm = {
  name: '',
  location: '',
  ip_address: '',
  port: '5000',
  status: 'online',
}

export default function Devices({
  devices,
  language,
  t,
  loading,
  onRefresh,
}: Props) {
  const [search, setSearch] = useState('')

  const [editingDevice, setEditingDevice] =
    useState<Device | null>(null)

  const [form, setForm] = useState<DeviceForm>(emptyForm)

  const [pendingOperation, setPendingOperation] =
    useState<DeviceOperation | null>(null)

  const [pendingDeviceId, setPendingDeviceId] =
    useState<string | null>(null)

  const [pendingPayload, setPendingPayload] =
    useState<Record<string, unknown>>({})

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return devices

    return devices.filter(device =>
      [
        device.name,
        device.location,
        device.ip_address,
        device.status,
      ]
        .filter(Boolean)
        .some(value =>
          String(value).toLowerCase().includes(query)
        )
    )
  }, [devices, search])

  function openEditDevice(device: Device) {
    setEditingDevice(device)

    setForm({
      name: device.name ?? '',
      location: device.location ?? '',
      ip_address: device.ip_address ?? '',
      port: String(device.port ?? 5000),
      status:
        device.status?.toLowerCase() === 'offline'
          ? 'offline'
          : 'online',
    })

    setError('')
    setSuccess('')
  }

  function closeEditModal() {
    if (busy) return

    setEditingDevice(null)
    setForm(emptyForm)
    setError('')
  }

  function updateForm(field: keyof DeviceForm, value: string) {
    setForm(previous => ({
      ...previous,
      [field]: value,
    }))
  }

  function requestEdit() {
    if (!editingDevice) return

    const name = form.name.trim()
    const location = form.location.trim()
    const port = Number(form.port)

    if (!name) {
      setError('Device name is required.')
      return
    }

    if (!location) {
      setError('Device location is required.')
      return
    }

    if (
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      setError('Enter a valid port between 1 and 65535.')
      return
    }

    setPendingOperation('edit')
    setPendingDeviceId(editingDevice.id)

    setPendingPayload({
      name,
      location,
      ip_address: form.ip_address.trim() || null,
      port,
      status: form.status,
    })

    setAdminPassword('')
    setError('')
    setPasswordOpen(true)
  }

  function requestArchive(device: Device) {
    const firstConfirmation = window.confirm(
      `Are you sure you want to archive "${device.name}"?`
    )

    if (!firstConfirmation) return

    const secondConfirmation = window.confirm(
      'This device will be removed from the active device list. Its detection history will be preserved. Continue?'
    )

    if (!secondConfirmation) return

    setPendingOperation('archive')
    setPendingDeviceId(device.id)
    setPendingPayload({})

    setAdminPassword('')
    setError('')
    setSuccess('')
    setPasswordOpen(true)
  }

  function closePasswordModal() {
    if (busy) return

    setPasswordOpen(false)
    setAdminPassword('')
    setPendingOperation(null)
    setPendingDeviceId(null)
    setPendingPayload({})
  }

  async function executeDeviceOperation(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    if (
      !adminPassword ||
      !pendingOperation ||
      !pendingDeviceId
    ) {
      setError('Please provide your administrator password.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke('manage-device', {
          body: {
            password: adminPassword,
            operation: pendingOperation,
            deviceId: pendingDeviceId,
            payload: pendingPayload,
          },
        })

      if (functionError) {
        throw functionError
      }

      if (!data?.success) {
        throw new Error(
          data?.error || 'The device operation could not be completed.'
        )
      }

      const operationName = pendingOperation

      setPasswordOpen(false)
      setEditingDevice(null)
      setForm(emptyForm)
      setAdminPassword('')
      setPendingOperation(null)
      setPendingDeviceId(null)
      setPendingPayload({})

      setSuccess(
        operationName === 'edit'
          ? 'Device updated successfully.'
          : 'Device archived successfully.'
      )

      // Refresh the parent dashboard data.
      // Supabase Realtime may also trigger a refresh.
      onRefresh?.()
    } catch (err) {
      console.error('Device operation error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="devices-page">
      <PageIntro
        title={t('registeredTitle')}
        desc={t('monitorDesc')}
      />

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>{t('registeredTitle')}</h2>
            <p>{t('deviceInfo')}</p>
          </div>

          <span className="result-count">
            {filteredDevices.length} {t('records')}
          </span>
        </div>

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

        {success && (
          <div className="device-success-message">
            {success}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            {t('loading')}
          </div>
        ) : filteredDevices.length === 0 ? (
          <Empty text={search ? t('noMatches') : t('noDevices')} />
        ) : (
          <div className="panel-list">
            {filteredDevices.map(device => (
              <div className="registered-device-item" key={device.id}>
                <div className="registered-device-content">
                  <DeviceRow
                    device={device}
                    language={language}
                    t={t}
                  />
                </div>

                <div className="registered-device-actions">
                  <button
                    type="button"
                    className="device-action-btn edit"
                    onClick={() => openEditDevice(device)}
                    disabled={busy}
                    title="Edit device"
                  >
                    <Pencil size={15} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    className="device-action-btn archive"
                    onClick={() => requestArchive(device)}
                    disabled={busy}
                    title="Archive device"
                  >
                    <Archive size={15} />
                    <span>Archive</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="note-strip">
        <Cpu size={18} />
        <span>{t('protection')}</span>
      </div>

      {/* EDIT DEVICE MODAL */}

      {editingDevice && !passwordOpen && (
        <div className="device-modal-overlay">
          <div className="device-modal">
            <div className="device-modal-header">
              <div>
                <h2>Edit Device</h2>
                <p>Update the registered device information.</p>
              </div>

              <button
                type="button"
                className="device-modal-close"
                onClick={closeEditModal}
                disabled={busy}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={event => {
                event.preventDefault()
                requestEdit()
              }}
            >
              <div className="device-form-group">
                <label htmlFor="device-name">Device Name</label>
                <input
                  id="device-name"
                  value={form.name}
                  onChange={event =>
                    updateForm('name', event.target.value)
                  }
                  placeholder="Enter device name"
                  required
                />
              </div>

              <div className="device-form-group">
                <label htmlFor="device-location">Location</label>
                <input
                  id="device-location"
                  value={form.location}
                  onChange={event =>
                    updateForm('location', event.target.value)
                  }
                  placeholder="Enter device location"
                  required
                />
              </div>

              <div className="device-form-group">
                <label htmlFor="device-ip">IP Address</label>
                <input
                  id="device-ip"
                  value={form.ip_address}
                  onChange={event =>
                    updateForm('ip_address', event.target.value)
                  }
                  placeholder="e.g. 192.168.1.100"
                />
              </div>

              <div className="device-form-row">
                <div className="device-form-group">
                  <label htmlFor="device-port">Port</label>
                  <input
                    id="device-port"
                    type="number"
                    min="1"
                    max="65535"
                    value={form.port}
                    onChange={event =>
                      updateForm('port', event.target.value)
                    }
                    required
                  />
                </div>

                <div className="device-form-group">
                  <label htmlFor="device-status">Status</label>
                  <select
                    id="device-status"
                    value={form.status}
                    onChange={event =>
                      updateForm('status', event.target.value)
                    }
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="device-error-message">
                  {error}
                </div>
              )}

              <div className="device-modal-actions">
                <button
                  type="button"
                  className="device-cancel-btn"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="device-save-btn"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PASSWORD CONFIRMATION */}

      {passwordOpen && (
        <div className="device-modal-overlay">
          <div className="device-modal password-modal">
            <div className="device-modal-header">
              <div className="password-heading-icon">
                <ShieldCheck size={25} />
              </div>

              <button
                type="button"
                className="device-modal-close"
                onClick={closePasswordModal}
                disabled={busy}
              >
                <X size={20} />
              </button>
            </div>

            <h2>Administrator Confirmation</h2>

            <p className="password-modal-description">
              {pendingOperation === 'edit'
                ? 'Enter your administrator password to save the device changes.'
                : 'Enter your administrator password to confirm archiving this device.'}
            </p>

            <form onSubmit={executeDeviceOperation}>
              <div className="device-form-group">
                <label htmlFor="admin-password">
                  Administrator Password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={event =>
                    setAdminPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="device-error-message">
                  {error}
                </div>
              )}

              <div className="device-modal-actions">
                <button
                  type="button"
                  className="device-cancel-btn"
                  onClick={closePasswordModal}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="device-save-btn"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <Loader2 size={16} className="device-spinner" />
                      Processing...
                    </>
                  ) : pendingOperation === 'edit' ? (
                    'Confirm Changes'
                  ) : (
                    'Confirm Archive'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}