import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Droplet, TrendingUp, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/StatCard'
import AlertCard from '../components/AlertCard'
import Card from '../components/ui/Card'
import { getDrains, getAlerts } from '../services/drainService'

const Dashboard = () => {
  const { currentUser } = useAuth()
  const [drains, setDrains] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Only fetch if user is authenticated (or if rules allow unauthenticated)
      try {
        const [drainsData, alertsData] = await Promise.all([
          getDrains(),
          getAlerts()
        ])
        setDrains(drainsData)
        setAlerts(alertsData.slice(0, 5)) // Show latest 5 alerts
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // If permission error and not authenticated, show empty state
        if (error.code === 'permission-denied' && !currentUser) {
          setDrains([])
          setAlerts([])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  const activeDrains = drains.filter(d => d.status === 'active').length
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1 sm:mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-text-secondary">Overview of your drain monitoring system</p>
      </div>

      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <StatCard
          title="Total Drains"
          value={drains.length}
          subtitle={`${activeDrains} active`}
          icon={Droplet}
        />
        <StatCard
          title="Active Monitoring"
          value={activeDrains}
          subtitle="Currently monitored"
          icon={Activity}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalAlerts}
          subtitle="Requires attention"
          icon={AlertTriangle}
          trend={criticalAlerts > 0 ? 'up' : null}
          trendValue={criticalAlerts > 0 ? `${criticalAlerts} new` : null}
        />
        <StatCard
          title="System Status"
          value="Operational"
          subtitle="All systems normal"
          icon={TrendingUp}
        />
      </div>

      {/* Recent Alerts */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-text">Recent Alerts</h2>
          <Link
            to="/alerts"
            className="text-primary hover:text-primary-hover text-xs sm:text-sm font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <Card className="text-center py-8 text-text-muted">
              No alerts at this time
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-text mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Link to="/monitoring">
            <Card hover className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <Activity className="text-primary" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base text-text">View Monitoring</h3>
                <p className="text-xs sm:text-sm text-text-secondary">Check real-time drain status</p>
              </div>
            </Card>
          </Link>
          <Link to="/submit-report">
            <Card hover className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <Plus className="text-primary" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base text-text">Submit Report</h3>
                <p className="text-xs sm:text-sm text-text-secondary">Report a drain issue</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

