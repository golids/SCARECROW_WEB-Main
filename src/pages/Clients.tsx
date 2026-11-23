
import { useState, useEffect, type FormEvent } from 'react'
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Cpu,
  X,
  Check,
  AlertCircle,
  Unlink,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Device } from '../types'

type Client = {
  id: string
  full_name: string
  contact_number: string | null
  province: string | null
  municipality: string | null
  barangay: string | null
  created_at: string
}

type DeviceAssignment = {
  id: string
  device_id: string
  user_id: string
  assigned_at: string
  unassigned_at: string | null
}

type Props = {
  devices: Device[]
  loading: boolean
  onRefresh?: () => void
}

export default function Clients({ devices, loading, onRefresh }: Props) {
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)

  // Active device assignments
  const [assignments, setAssignments] = useState<DeviceAssignment[]>([])
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

  // Device assignment UI states
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState('')

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Registration fields
  const [fullName, setFullName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [username, setUsername] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [province, setProvince] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [barangay, setBarangay] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // Load registered clients using the admin-only database function.
  // The function automatically excludes every account in admin_users.
  const loadClients = async () => {
    if (!supabase) {
      setIsLoadingClients(false)
      return
    }

    setIsLoadingClients(true)

    const { data, error } = await supabase.rpc('get_admin_clients')

    if (error) {
      console.error('Failed to load clients:', error.message)

      setFeedback({
        type: 'error',
        message: `Unable to load registered clients: ${error.message}`,
      })
    } else {
      setClients((data ?? []) as Client[])
    }

    setIsLoadingClients(false)
  }

  // Load active device assignments
  const loadAssignments = async () => {
    if (!supabase) {
      setIsLoadingAssignments(false)
      return
    }

    setIsLoadingAssignments(true)

    const { data, error } = await supabase
      .from('device_assignments')
      .select(`
        id,
        device_id,
        user_id,
        assigned_at,
        unassigned_at
      `)
      .is('unassigned_at', null)

    if (error) {
      console.error('Failed to load device assignments:', error.message)

      setFeedback({
        type: 'error',
        message: `Unable to load device assignments: ${error.message}`,
      })
    } else {
      setAssignments((data ?? []) as DeviceAssignment[])
    }

    setIsLoadingAssignments(false)
  }

  // Load clients and assignments when the page opens
  useEffect(() => {
    void loadClients()
    void loadAssignments()
  }, [])

  // Get assignments belonging to a particular client
  const getClientAssignments = (clientId: string) => {
    return assignments.filter(
      assignment => assignment.user_id === clientId
    )
  }

  // Find the active assignment of a device
  const getDeviceAssignment = (deviceId: string) => {
    return assignments.find(
      assignment => assignment.device_id === deviceId
    )
  }

  // Get a device name from the dashboard device list
  const getDeviceName = (deviceId: string) => {
    const device = devices.find(item => item.id === deviceId)

    return device?.name || `Unavailable device (${deviceId.slice(0, 8)})`
  }

  // Open device assignment modal
  const openAssignModal = (client: Client) => {
    setSelectedClient(client)
    setSelectedDeviceId('')
    setFeedback(null)
    setShowAssignModal(true)
  }

  // Close device assignment modal
  const closeAssignModal = () => {
    if (isAssigning) return

    setShowAssignModal(false)
    setSelectedClient(null)
    setSelectedDeviceId('')
  }

  // Assign or reassign a device using the database function
  const handleAssignDevice = async () => {
    if (!supabase) {
      setFeedback({
        type: 'error',
        message: 'Supabase is not configured. Check your environment variables.',
      })
      return
    }

    if (!selectedClient || !selectedDeviceId) {
      setFeedback({
        type: 'error',
        message: 'Please select a ScareCROW device.',
      })
      return
    }

    const selectedDevice = devices.find(
      device => device.id === selectedDeviceId
    )

    if (!selectedDevice || selectedDevice.is_archived) {
      setFeedback({
        type: 'error',
        message: 'The selected device is unavailable or archived.',
      })
      return
    }

    const existingAssignment = getDeviceAssignment(selectedDeviceId)

    // Prevent creating another active assignment for the same client/device.
    if (existingAssignment?.user_id === selectedClient.id) {
      setFeedback({
        type: 'error',
        message: 'This device is already assigned to this client.',
      })
      return
    }

    // Ask for confirmation when moving a device from another client.
    if (existingAssignment) {
      const previousClient = clients.find(
        client => client.id === existingAssignment.user_id
      )

      const previousName = previousClient?.full_name || 'another client'

      const confirmed = window.confirm(
        `${selectedDevice.name} is currently assigned to ${previousName}.\n\n` +
        `Do you want to reassign this device to ${selectedClient.full_name}?\n\n` +
        `The previous assignment will be saved in the assignment history.`
      )

      if (!confirmed) return
    }

    setIsAssigning(true)
    setFeedback(null)

    try {
      const { error } = await supabase.rpc(
        'assign_device_to_farmer',
        {
          p_device_id: selectedDeviceId,
          p_user_id: selectedClient.id,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      const clientName = selectedClient.full_name
      const deviceName = selectedDevice.name

      setShowAssignModal(false)
      setSelectedClient(null)
      setSelectedDeviceId('')

      setFeedback({
        type: 'success',
        message: `${deviceName} was successfully assigned to ${clientName}.`,
      })

      await loadAssignments()
      onRefresh?.()
    } catch (error) {
      console.error('Device assignment error:', error)

      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to assign the device.',
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Unassign a device while preserving its assignment history
  const handleUnassignDevice = async (
    assignment: DeviceAssignment,
    client: Client
  ) => {
    if (!supabase) {
      setFeedback({
        type: 'error',
        message: 'Supabase is not configured.',
      })
      return
    }

    const deviceName = getDeviceName(assignment.device_id)

    const confirmed = window.confirm(
      `Are you sure you want to unassign ${deviceName} from ${client.full_name}?\n\n` +
      `The assignment record will be preserved in the database history.`
    )

    if (!confirmed) return

    setFeedback(null)

    try {
      const { data, error } = await supabase
        .from('device_assignments')
        .update({
          unassigned_at: new Date().toISOString(),
        })
        .eq('id', assignment.id)
        .is('unassigned_at', null)
        .select('id')

      if (error) {
        throw new Error(error.message)
      }

      if (!data || data.length === 0) {
        throw new Error(
          'This assignment may have already been changed. Please refresh and try again.'
        )
      }

      setFeedback({
        type: 'success',
        message: `${deviceName} was successfully unassigned from ${client.full_name}.`,
      })

      await loadAssignments()
      onRefresh?.()
    } catch (error) {
      console.error('Device unassignment error:', error)

      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to unassign the device.',
      })
    }
  }

  // Reset registration form
  const resetForm = () => {
    setFullName('')
    setContactNumber('')
    setUsername('')
    setTemporaryPassword('')
    setProvince('')
    setMunicipality('')
    setBarangay('')
    setAdminPassword('')
  }

  const openRegistration = () => {
    setFeedback(null)
    resetForm()
    setShowAddModal(true)
  }

  const closeRegistration = () => {
    if (isSubmitting) return

    setShowAddModal(false)
    resetForm()
  }

  // Register a new client
  const handleRegisterClient = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setFeedback(null)

    if (!supabase) {
      setFeedback({
        type: 'error',
        message:
          'Supabase is not configured. Please check your environment variables.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const registeredName = fullName.trim()

      const { data, error } = await supabase.functions.invoke(
        'register-client',
        {
          body: {
            fullName: registeredName,
            username: username.trim().toLowerCase(),
            temporaryPassword,
            adminPassword,
            contactNumber: contactNumber.trim(),
            province: province.trim(),
            municipality: municipality.trim(),
            barangay: barangay.trim(),
          },
        }
      )

      if (error) {
        let message = error.message || 'Unable to register client.'

        try {
          const response = error.context as Response | undefined

          if (response && typeof response.json === 'function') {
            const errorData = await response.json()
            message = errorData.error || errorData.message || message
          }
        } catch {
          // Keep the original error message.
        }

        throw new Error(message)
      }

      if (!data?.success) {
        throw new Error(
          data?.error || 'Client registration was unsuccessful.'
        )
      }

      setShowAddModal(false)
      resetForm()

      setFeedback({
        type: 'success',
        message: `Client account for ${registeredName} was successfully created.`,
      })

      await loadClients()
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Something went wrong while registering the client.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Search clients
  const filteredClients = clients.filter(client => {
    const searchTerm = search.toLowerCase()

    return (
      client.full_name.toLowerCase().includes(searchTerm) ||
      (client.contact_number ?? '').toLowerCase().includes(searchTerm) ||
      (client.municipality ?? '').toLowerCase().includes(searchTerm) ||
      (client.barangay ?? '').toLowerCase().includes(searchTerm) ||
      (client.province ?? '').toLowerCase().includes(searchTerm)
    )
  })

  // Only non-archived devices can be selected
  const availableDevices = devices.filter(
    device => !device.is_archived
  )

  const isAssignmentLoading =
    isLoadingAssignments || loading

  const totalAssignedDevices = assignments.length

  return (
    <div className="clients-page">
      {/* PAGE HEADER */}
      <div className="page-intro">
        <div>
          <h1>Client Management</h1>
          <p>
            Register client accounts, assign devices, and manage account access.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={openRegistration}
        >
          <UserPlus size={16} />
          Register Client
        </button>
      </div>

      {/* FEEDBACK MESSAGE */}
      {feedback && (
        <div
          className="client-form-notice"
          role={feedback.type === 'error' ? 'alert' : 'status'}
          style={{
            borderColor:
              feedback.type === 'success' ? '#4F8F3A' : '#D32F2F',
            color:
              feedback.type === 'success' ? '#245C2D' : '#D32F2F',
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="clients-summary-grid">
        <div className="clients-summary-card">
          <div className="clients-summary-icon">
            <Users size={21} />
          </div>
          <div>
            <span>Total Clients</span>
            <strong>
              {isLoadingClients ? '—' : clients.length}
            </strong>
          </div>
        </div>

        <div className="clients-summary-card">
          <div className="clients-summary-icon">
            <Cpu size={21} />
          </div>
          <div>
            <span>Assigned Devices</span>
            <strong>
              {isAssignmentLoading ? '—' : totalAssignedDevices}
            </strong>
          </div>
        </div>

        <div className="clients-summary-card">
          <div className="clients-summary-icon">
            <ShieldCheck size={21} />
          </div>
          <div>
            <span>Active Accounts</span>
            <strong>—</strong>
          </div>
        </div>
      </div>

      {/* CLIENT LIST */}
      <section className="panel clients-list-panel">
        <div className="panel-title">
          <div>
            <h2>Registered Clients</h2>
            <p>Manage client accounts and their assigned devices.</p>
          </div>
        </div>

        <div className="clients-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search client name or username..."
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoadingClients ? (
          <div className="clients-empty-state">
            <p>Loading registered clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          /* EMPTY STATE */
          <div className="clients-empty-state">
            <Users size={35} />

            <h3>
              {search
                ? 'No matching clients found'
                : 'No registered clients found'}
            </h3>

            <p>
              {search
                ? 'Try searching with a different name or location.'
                : 'Registered client accounts will appear here once created.'}
            </p>

            {!search && (
              <button
                type="button"
                className="primary-btn"
                onClick={openRegistration}
              >
                <UserPlus size={16} />
                Register First Client
              </button>
            )}
          </div>
        ) : (
          /* REGISTERED CLIENTS TABLE */
          <div className="clients-table-wrapper">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact Number</th>
                  <th>Location</th>
                  <th>Assigned ScareCROW Device</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map(client => {
                  const clientAssignments = getClientAssignments(client.id)

                  return (
                    <tr key={client.id}>
                      <td>{client.full_name}</td>

                      <td>
                        {client.contact_number || '—'}
                      </td>

                      <td>
                        {[
                          client.barangay,
                          client.municipality,
                          client.province,
                        ]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>

                      <td>
                        {isLoadingAssignments ? (
                          <span className="client-device-unassigned">
                            Loading assignments...
                          </span>
                        ) : clientAssignments.length === 0 ? (
                          <span className="client-device-unassigned">
                            <Cpu size={15} />
                            No device assigned
                          </span>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '9px',
                              minWidth: '160px',
                            }}
                          >
                            {clientAssignments.map(assignment => (
                              <div
                                key={assignment.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#245C2D',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                  }}
                                >
                                  <Cpu size={14} />
                                  {getDeviceName(assignment.device_id)}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleUnassignDevice(
                                      assignment,
                                      client
                                    )
                                  }
                                  title="Unassign device"
                                  aria-label={`Unassign ${getDeviceName(assignment.device_id)} from ${client.full_name}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 7px',
                                    border: '1px solid #F2CACA',
                                    borderRadius: '6px',
                                    background: '#FDECEA',
                                    color: '#D32F2F',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Unlink size={12} />
                                  Unassign
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="client-assign-btn"
                          onClick={() => openAssignModal(client)}
                        >
                          <Cpu size={15} />
                          Assign Device
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DEVICE ASSIGNMENT MODAL */}
      {showAssignModal && selectedClient && (
        <div
          className="client-modal-overlay"
          onClick={closeAssignModal}
        >
          <div
            className="client-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-modal-title"
            onClick={event => event.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="client-modal-header">
              <div>
                <h2 id="assign-modal-title">
                  Assign ScareCROW Device
                </h2>
                <p>
                  Select a device for {selectedClient.full_name}.
                </p>
              </div>

              <button
                type="button"
                className="client-modal-close"
                onClick={closeAssignModal}
                aria-label="Close assignment modal"
                disabled={isAssigning}
              >
                <X size={20} />
              </button>
            </div>

            {/* INFORMATION NOTICE */}
            <div className="client-form-notice">
              <AlertCircle size={16} />
              Devices already assigned to another client can be reassigned.
              Their previous assignment will be preserved in the database.
            </div>

            {/* AVAILABLE DEVICES */}
            <div className="assign-device-list">
              {isAssignmentLoading ? (
                <p>Loading devices and assignments...</p>
              ) : availableDevices.length === 0 ? (
                <div className="clients-empty-state">
                  <Cpu size={30} />
                  <h3>No active devices found</h3>
                  <p>
                    There are currently no non-archived ScareCROW devices.
                  </p>
                </div>
              ) : (
                availableDevices.map(device => {
                  const currentAssignment = getDeviceAssignment(device.id)

                  const assignedClient = currentAssignment
                    ? clients.find(
                        client => client.id === currentAssignment.user_id
                      )
                    : null

                  const alreadyAssignedToSelectedClient =
                    currentAssignment?.user_id === selectedClient.id

                  return (
                    <label
                      key={device.id}
                      className={`assign-device-option ${
                        selectedDeviceId === device.id ? 'selected' : ''
                      }`}
                      style={{
                        opacity: alreadyAssignedToSelectedClient ? 0.65 : 1,
                        cursor: alreadyAssignedToSelectedClient
                          ? 'not-allowed'
                          : 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="assign-device"
                        value={device.id}
                        checked={selectedDeviceId === device.id}
                        disabled={alreadyAssignedToSelectedClient || isAssigning}
                        onChange={() =>
                          setSelectedDeviceId(device.id)
                        }
                      />

                      <div className="assign-device-info">
                        <strong>{device.name}</strong>
                        <span>
                          {device.location || 'No location specified'}
                        </span>

                        {alreadyAssignedToSelectedClient ? (
                          <span style={{ color: '#4F8F3A', fontWeight: 600 }}>
                            Already assigned to this client
                          </span>
                        ) : currentAssignment ? (
                          <span style={{ color: '#D97706', fontWeight: 600 }}>
                            Currently assigned to:{' '}
                            {assignedClient?.full_name || 'Another client'}
                            {' '}— will be reassigned
                          </span>
                        ) : (
                          <span style={{ color: '#4F8F3A' }}>
                            Available
                          </span>
                        )}
                      </div>

                      {selectedDeviceId === device.id && (
                        <Check size={18} />
                      )}
                    </label>
                  )
                })
              )}
            </div>

            {/* MODAL ACTIONS */}
            <div className="client-modal-actions">
              <button
                type="button"
                className="client-cancel-btn"
                onClick={closeAssignModal}
                disabled={isAssigning}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={() => void handleAssignDevice()}
                disabled={
                  !selectedDeviceId ||
                  isAssignmentLoading ||
                  isAssigning
                }
              >
                <Cpu size={16} />
                {isAssigning
                  ? 'Saving Assignment...'
                  : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT REGISTRATION MODAL */}
      {showAddModal && (
        <div
          className="client-modal-overlay"
          onClick={closeRegistration}
        >
          <div
            className="client-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-modal-title"
            onClick={event => event.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="client-modal-header">
              <div>
                <h2 id="client-modal-title">Register New Client</h2>
                <p>Create a new client account.</p>
              </div>

              <button
                type="button"
                className="client-modal-close"
                onClick={closeRegistration}
                aria-label="Close registration form"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* INFORMATION NOTICE */}
            <div className="client-form-notice">
              The client will use the assigned username and temporary
              password to log in to the ScareCROW Mobile App.
            </div>

            {/* REGISTRATION FORM */}
            <form onSubmit={handleRegisterClient}>
              <div className="client-form-group">
                <label htmlFor="client-full-name">Full Name</label>
                <input
                  id="client-full-name"
                  type="text"
                  placeholder="Enter client's full name"
                  value={fullName}
                  onChange={event => setFullName(event.target.value)}
                  maxLength={150}
                  required
                />
              </div>

              <div className="client-form-group">
                <label htmlFor="client-contact">Contact Number</label>
                <input
                  id="client-contact"
                  type="tel"
                  placeholder="Enter contact number"
                  value={contactNumber}
                  onChange={event => setContactNumber(event.target.value)}
                  maxLength={30}
                />
              </div>

              <div className="client-form-group">
                <label htmlFor="client-username">Username</label>
                <input
                  id="client-username"
                  type="text"
                  placeholder="e.g. juandelacruz"
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  autoComplete="username"
                  required
                />
                <small>Use 3–30 letters, numbers, or underscores.</small>
              </div>

              <div className="client-form-group">
                <label htmlFor="client-password">
                  Temporary Password
                </label>
                <input
                  id="client-password"
                  type="password"
                  placeholder="Enter temporary password"
                  value={temporaryPassword}
                  onChange={event =>
                    setTemporaryPassword(event.target.value)
                  }
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  required
                />
                <small>Must contain at least 8 characters.</small>
              </div>

              <div className="client-form-group">
                <label htmlFor="client-province">Province</label>
                <input
                  id="client-province"
                  type="text"
                  placeholder="Enter province"
                  value={province}
                  onChange={event => setProvince(event.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="client-form-group">
                <label htmlFor="client-municipality">Municipality</label>
                <input
                  id="client-municipality"
                  type="text"
                  placeholder="Enter municipality"
                  value={municipality}
                  onChange={event =>
                    setMunicipality(event.target.value)
                  }
                  maxLength={100}
                />
              </div>

              <div className="client-form-group">
                <label htmlFor="client-barangay">Barangay</label>
                <input
                  id="client-barangay"
                  type="text"
                  placeholder="Enter barangay"
                  value={barangay}
                  onChange={event => setBarangay(event.target.value)}
                  maxLength={100}
                />
              </div>

              {/* ADMIN CONFIRMATION */}
              <div className="client-form-group">
                <label htmlFor="client-admin-password">
                  Administrator Password
                </label>
                <input
                  id="client-admin-password"
                  type="password"
                  placeholder="Re-enter your administrator password"
                  value={adminPassword}
                  onChange={event => setAdminPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <small>
                  Required to confirm that you are authorized to create this account.
                </small>
              </div>

              {/* MODAL ACTIONS */}
              <div className="client-modal-actions">
                <button
                  type="button"
                  className="client-cancel-btn"
                  onClick={closeRegistration}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={isSubmitting}
                >
                  <UserPlus size={16} />
                  {isSubmitting
                    ? 'Registering...'
                    : 'Create Client Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}