import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { getAlerts, markAlertAsRead, addAlert } from '../../services/drainService'
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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    severity: 'info',
    drainId: ''
  })

  useEffect(() => {
    // Real-time listener
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

  const handleMarkAsRead = async (alertId) => {
    try {
      await markAlertAsRead(alertId)
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  const handleCreateAlert = async (e) => {
    e.preventDefault()
    try {
      await addAlert(newAlert)
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
                        <span>Drain: {alert.drainId}</span>
                      )}
                    </div>
                  </div>
                </div>
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
          <Input
            label="Drain ID (Optional)"
            value={newAlert.drainId}
            onChange={(e) => setNewAlert({ ...newAlert, drainId: e.target.value })}
            placeholder="Leave empty for general alert"
          />
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

