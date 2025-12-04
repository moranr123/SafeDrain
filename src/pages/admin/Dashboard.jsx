import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Droplet,
  AlertTriangle,
  FileText,
  Activity,
  TrendingUp,
  Users
} from 'lucide-react'
import { getReports } from '../../services/reportService'
import { getDrains } from '../../services/drainService'
import { getAlerts } from '../../services/drainService'
import { subscribeToCollection } from '../../services/firestoreHelpers'
import Card from '../../components/ui/Card'
import StatCard from '../../components/StatCard'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDrains: 0,
    activeDrains: 0,
    totalReports: 0,
    pendingReports: 0,
    criticalAlerts: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()

    // Real-time listeners
    const unsubscribeReports = subscribeToCollection(
      'reports',
      (documents) => {
        const pending = documents.filter(r => r.status === 'pending').length
        setStats(prev => ({
          ...prev,
          totalReports: documents.length,
          pendingReports: pending
        }))
      },
      [],
      'createdAt',
      'desc'
    )

    const unsubscribeDrains = subscribeToCollection(
      'drains',
      (documents) => {
        const active = documents.filter(d => d.status === 'active').length
        setStats(prev => ({
          ...prev,
          totalDrains: documents.length,
          activeDrains: active
        }))
      },
      [],
      'createdAt',
      'desc'
    )

    const unsubscribeAlerts = subscribeToCollection(
      'alerts',
      (documents) => {
        const critical = documents.filter(a => a.severity === 'critical' && !a.read).length
        setStats(prev => ({
          ...prev,
          criticalAlerts: critical
        }))
      },
      [],
      'createdAt',
      'desc'
    )

    return () => {
      unsubscribeReports()
      unsubscribeDrains()
      unsubscribeAlerts()
    }
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [reports, drains, alerts] = await Promise.all([
        getReports([], 1000),
        getDrains(),
        getAlerts()
      ])

      const pendingReports = reports.filter(r => r.status === 'pending').length
      const activeDrains = drains.filter(d => d.status === 'active').length
      const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.read).length

      setStats({
        totalDrains: drains.length,
        activeDrains,
        totalReports: reports.length,
        pendingReports,
        criticalAlerts,
        totalUsers: 0 // Would need users collection
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Admin Dashboard</h1>
        <p className="text-text-secondary">Overview of system status and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Drains"
          value={stats.totalDrains}
          subtitle={`${stats.activeDrains} active`}
          icon={Droplet}
        />
        <StatCard
          title="Active Sensors"
          value={stats.activeDrains}
          subtitle="Currently monitoring"
          icon={Activity}
        />
        <StatCard
          title="Total Reports"
          value={stats.totalReports}
          subtitle={`${stats.pendingReports} pending`}
          icon={FileText}
          trend={stats.pendingReports > 0 ? 'up' : null}
          trendValue={stats.pendingReports > 0 ? `${stats.pendingReports} new` : null}
        />
        <StatCard
          title="Pending Reports"
          value={stats.pendingReports}
          subtitle="Requires attention"
          icon={AlertTriangle}
          trend={stats.pendingReports > 0 ? 'up' : null}
        />
        <StatCard
          title="Critical Alerts"
          value={stats.criticalAlerts}
          subtitle="Urgent issues"
          icon={AlertTriangle}
          trend={stats.criticalAlerts > 0 ? 'up' : null}
        />
        <StatCard
          title="System Status"
          value="Operational"
          subtitle="All systems normal"
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/reports?status=pending">
          <Card hover className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FileText className="text-yellow-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text">Review Reports</h3>
                <p className="text-sm text-text-secondary">{stats.pendingReports} pending</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/map">
          <Card hover className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text">View Map</h3>
                <p className="text-sm text-text-secondary">Live monitoring</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/sensors">
          <Card hover className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Droplet className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text">Manage Sensors</h3>
                <p className="text-sm text-text-secondary">{stats.totalDrains} sensors</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/admin/notifications">
          <Card hover className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text">Alerts</h3>
                <p className="text-sm text-text-secondary">{stats.criticalAlerts} critical</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard

