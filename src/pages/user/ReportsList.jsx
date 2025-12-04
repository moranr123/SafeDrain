import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Filter, MapPin, Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getUserReports, getReports } from '../../services/reportService'
import { getSyncStatus } from '../../services/offlineService'
import { format } from 'date-fns'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const ReportsList = () => {
  const { currentUser } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState('my') // 'my' or 'all'
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, pendingCount: 0 })

  useEffect(() => {
    fetchReports()
    updateSyncStatus()
    
    // Update sync status periodically
    const interval = setInterval(updateSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [filter, viewMode, currentUser])

  const fetchReports = async () => {
    setLoading(true)
    try {
      let data = []
      if (viewMode === 'my' && currentUser) {
        data = await getUserReports(currentUser.uid)
      } else {
        const filters = filter !== 'all' 
          ? [{ field: 'severity', operator: '==', value: filter }]
          : []
        data = await getReports(filters)
      }
      setReports(data)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSyncStatus = async () => {
    const status = await getSyncStatus()
    setSyncStatus(status)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity) => {
    return <AlertTriangle size={16} />
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true
    return report.severity === filter
  })

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Reports</h1>
          <p className="text-text-secondary">
            {viewMode === 'my' ? 'Your submitted reports' : 'All reports'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/submit-report">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              New Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Sync Status */}
      {!syncStatus.isOnline && (
        <Card padding="sm" className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Offline Mode</p>
              <p className="text-xs text-yellow-700">
                {syncStatus.pendingCount} report{syncStatus.pendingCount !== 1 ? 's' : ''} pending sync
              </p>
            </div>
            <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
          </div>
        </Card>
      )}

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'my' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('my')}
        >
          My Reports
        </Button>
        <Button
          variant={viewMode === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('all')}
        >
          All Reports
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={18} className="text-text-secondary" />
        {['all', 'critical', 'high', 'medium', 'low'].map((filterType) => (
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

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading reports...</div>
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">No reports found</p>
          <Link to="/submit-report">
            <Button variant="secondary">Submit Your First Report</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Link key={report.id} to={`/reports/${report.id}`}>
              <Card hover className="transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-text truncate">{report.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-xl border font-medium flex-shrink-0 ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                      {report.offline && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-xl border border-gray-200 flex-shrink-0">
                          Offline
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                      {report.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>Location set</span>
                        </div>
                      )}
                      {report.createdAt && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      )}
                      {report.photos && report.photos.length > 0 && (
                        <span>{report.photos.length} photo{report.photos.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReportsList

