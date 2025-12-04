import { useState, useEffect } from 'react'
import { Bell, Filter } from 'lucide-react'
import AlertCard from '../components/AlertCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getAlerts, markAlertAsRead } from '../services/drainService'

const Alerts = () => {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alertsData = await getAlerts()
        setAlerts(alertsData)
      } catch (error) {
        console.error('Error fetching alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Alerts</h1>
          <p className="text-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts read'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={18} className="text-text-secondary" />
        {['all', 'unread', 'critical', 'warning', 'info'].map((filterType) => (
          <Button
            key={filterType}
            onClick={() => setFilter(filterType)}
            variant={filter === filterType ? 'primary' : 'secondary'}
            size="sm"
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </Button>
        ))}
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

