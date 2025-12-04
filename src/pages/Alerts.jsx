import { useState, useEffect } from 'react'
import { Bell, Filter, Droplet, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import AlertCard from '../components/AlertCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import { getAlerts, markAlertAsRead } from '../services/drainService'
import { subscribeToCollection } from '../services/firestoreHelpers'

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

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

  const handleDismiss = async (alertId) => {
    try {
      await markAlertAsRead(alertId)
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a))
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'unread') return !alert.read
    if (filter === 'critical') return alert.severity === 'critical'
    return alert.severity === filter
  })

  const unreadCount = alerts.filter(a => !a.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1 sm:mb-2">Alerts</h1>
          <p className="text-sm sm:text-base text-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts read'}
          </p>
        </div>
      </div>

      {/* Filters - Dropdown on mobile, buttons on desktop */}
      <div className="space-y-2">
        {/* Mobile Dropdown */}
        <div className="md:hidden">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full"
          >
            <option value="all">All Alerts</option>
            <option value="unread">Unread</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </Select>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-text-secondary flex-shrink-0" />
          {['all', 'unread', 'critical', 'warning', 'info'].map((filterType) => (
            <Button
              key={filterType}
              onClick={() => setFilter(filterType)}
              variant={filter === filterType ? 'primary' : 'secondary'}
              size="sm"
              className="text-sm px-3 py-1.5"
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={!alert.read ? () => handleDismiss(alert.id) : null}
            />
          ))
        ) : (
          <Card className="text-center py-12 text-text-muted">
            <Bell size={48} className="mx-auto mb-4 text-text-muted opacity-50" />
            <p>No alerts found</p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Alerts

