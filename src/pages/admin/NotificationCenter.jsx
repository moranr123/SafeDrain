import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Info, CheckCircle, X, Droplet, Trash2, Loader } from 'lucide-react'
import { getAlerts, markAlertAsRead, addAlert, getDrains, deleteAlert } from '../../services/drainService'
import { subscribeToCollection } from '../../services/firestoreHelpers'
import { format } from 'date-fns'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

const NotificationCenter = () => {
  const [alerts, setAlerts] = useState([])
  const [drains, setDrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDrains, setLoadingDrains] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingAlertId, setDeletingAlertId] = useState(null)
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    severity: 'info',
    drainId: ''
  })

  useEffect(() => {
    // Real-time listener for alerts
    const unsubscribe = subscribeToCollection(
      'alerts',
      (documents) => {
        setAlerts(documents)
        setLoading(false)
      },
      [],
      'createdAt',
      'desc'
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Fetch all drains for the dropdown
    const fetchDrains = async () => {
      try {
        const drainsData = await getDrains()
        setDrains(drainsData)
      } catch (error) {
        console.error('Error fetching drains:', error)
      } finally {
        setLoadingDrains(false)
      }
    }

    fetchDrains()
  }, [])

  const handleMarkAsRead = async (alertId) => {
    try {
      await markAlertAsRead(alertId)
    } catch (error) {
      console.error('Error marking alert as read:', error)
      alert('Failed to mark alert as read')
    }
  }

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return
    }

    setDeletingAlertId(alertId)
    try {
      await deleteAlert(alertId)
    } catch (error) {
      console.error('Error deleting alert:', error)
      alert('Failed to delete notification')
    } finally {
      setDeletingAlertId(null)
    }
  }

  const handleCreateAlert = async (e) => {
    e.preventDefault()
    try {
      // Prepare alert data - only include drainId if one is selected
      const alertData = {
        title: newAlert.title,
        message: newAlert.message,
        severity: newAlert.severity,
        ...(newAlert.drainId && {
          drainId: newAlert.drainId,
          drainName: drains.find(d => d.id === newAlert.drainId)?.name || 'Unknown Drain'
        })
      }
      
      await addAlert(alertData)
      setShowCreateModal(false)
      setNewAlert({
        title: '',
        message: '',
        severity: 'info',
        drainId: ''
      })
    } catch (error) {
      console.error('Error creating alert:', error)
      alert('Failed to create alert')
    }
  }

  const getIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="text-red-600" size={20} />
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={20} />
      case 'info':
        return <Info className="text-blue-600" size={20} />
      default:
        return <Info className="text-text-muted" size={20} />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-50/50'
      case 'warning':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50/50'
      case 'info':
        return 'border-l-4 border-l-blue-500 bg-blue-50/50'
      default:
        return 'border-l-4 border-l-border'
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'unread') return !alert.read
    return alert.severity === filter
  })

  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Notification Center</h1>
          <p className="text-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All notifications read'}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Bell size={18} />
          Create Alert
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'unread', 'critical', 'warning', 'info'].map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading notifications...</div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card className="text-center py-12">
          <Bell size={48} className="mx-auto mb-4 text-text-muted opacity-50" />
          <p className="text-text-secondary">No notifications found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={getSeverityColor(alert.severity)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text">{alert.title}</h3>
                      {!alert.read && (
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      {alert.createdAt && (
                        <span>
                          {format(new Date(alert.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                      {alert.drainId && (
                        <span className="flex items-center gap-1">
                          <Droplet size={12} />
                          Drain: {alert.drainName || alert.drainId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!alert.read && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle size={16} />
                      Mark Read
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                    disabled={deletingAlertId === alert.id}
                    className="flex items-center gap-1"
                  >
                    {deletingAlertId === alert.id ? (
                      <>
                        <Loader className="animate-spin" size={16} />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Alert"
      >
        <form onSubmit={handleCreateAlert} className="space-y-4">
          <Input
            label="Title"
            value={newAlert.title}
            onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
            required
          />
          <Textarea
            label="Message"
            value={newAlert.message}
            onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
            rows="4"
            required
          />
          <Select
            label="Severity"
            value={newAlert.severity}
            onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </Select>
          <Select
            label="Drain (Optional)"
            value={newAlert.drainId}
            onChange={(e) => setNewAlert({ ...newAlert, drainId: e.target.value })}
          >
            <option value="">General Alert (No specific drain)</option>
            {loadingDrains ? (
              <option disabled>Loading drains...</option>
            ) : drains.length === 0 ? (
              <option disabled>No drains available</option>
            ) : (
              drains.map((drain) => (
                <option key={drain.id} value={drain.id}>
                  {drain.name || `Drain ${drain.id.slice(0, 8)}`} {drain.status ? `(${drain.status})` : ''}
                </option>
              ))
            )}
          </Select>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              Create Alert
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default NotificationCenter

