import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Filter, MapPin, Clock, AlertTriangle, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getUserReports, getReports, getReport } from '../../services/reportService'
import { getSyncStatus } from '../../services/offlineService'
import { format } from 'date-fns'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'

const ReportsList = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState('my') // 'my' or 'all'
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, pendingCount: 0 })
  const [selectedReport, setSelectedReport] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleReportClick = async (reportId) => {
    setModalLoading(true)
    try {
      const report = await getReport(reportId)
      setSelectedReport(report)
    } catch (error) {
      console.error('Error fetching report details:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedReport(null)
  }

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true
    return report.severity === filter
  })

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1 sm:mb-2">Reports</h1>
          <p className="text-sm sm:text-base text-text-secondary">
            {viewMode === 'my' ? 'Your submitted reports' : 'All reports'}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link to="/submit-report" className="w-full sm:w-auto">
            <Button className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base">
              <Plus size={16} />
              <span className="hidden xs:inline">New Report</span>
              <span className="xs:hidden">New</span>
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
          className="flex-1 sm:flex-initial text-xs sm:text-sm"
        >
          My Reports
        </Button>
        <Button
          variant={viewMode === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('all')}
          className="flex-1 sm:flex-initial text-xs sm:text-sm"
        >
          All Reports
        </Button>
      </div>

      {/* Filters - Dropdown on mobile, buttons on larger screens */}
      <div className="md:hidden">
        <Select
          label="Filter by Severity"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
      </div>
      <div className="hidden md:flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <Filter size={16} className="text-text-secondary flex-shrink-0" />
        {['all', 'critical', 'high', 'medium', 'low'].map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(filterType)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
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
            <Card 
              key={report.id} 
              hover 
              className="transition-all cursor-pointer"
              onClick={() => handleReportClick(report.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-text truncate">{report.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-xl border font-medium flex-shrink-0 ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    {report.status && (
                      <span className={`px-2 py-1 text-xs rounded-xl border font-medium flex-shrink-0 ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    )}
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
          ))}
        </div>
      )}

      {/* Report Details Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={handleCloseModal}
        title={selectedReport?.title}
        size="xl"
      >
        {modalLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-text-secondary">Loading report details...</div>
          </div>
        ) : selectedReport ? (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 text-xs rounded-xl border font-medium ${getSeverityColor(selectedReport.severity)}`}>
                {selectedReport.severity}
              </span>
              <span className={`px-3 py-1 text-xs rounded-xl border font-medium ${getStatusColor(selectedReport.status || 'pending')}`}>
                {selectedReport.status || 'pending'}
              </span>
              {selectedReport.offline && (
                <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-xl border border-yellow-200 font-medium">
                  Offline - Pending Sync
                </span>
              )}
            </div>

            {/* Rejection Reason - Show if report is rejected */}
            {selectedReport.status === 'rejected' && selectedReport.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</h3>
                <p className="text-sm text-red-700">{selectedReport.rejectionReason}</p>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Description</h3>
              <p className="text-text-secondary whitespace-pre-wrap">{selectedReport.description}</p>
            </div>

            {/* Photos */}
            {selectedReport.photos && selectedReport.photos.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-3">Photos ({selectedReport.photos.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedReport.photos.map((photo, index) => (
                    <a
                      key={index}
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={photo}
                        alt={`Report photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-border hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {selectedReport.location && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                  <MapPin size={18} />
                  Location
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary font-mono">
                    {selectedReport.location.latitude.toFixed(6)}, {selectedReport.location.longitude.toFixed(6)}
                  </p>
                  {selectedReport.location.accuracy && (
                    <p className="text-xs text-text-muted">
                      Accuracy: ±{Math.round(selectedReport.location.accuracy)}m
                    </p>
                  )}
                  {selectedReport.address && (
                    <p className="text-sm text-text">{selectedReport.address}</p>
                  )}
                  <Link
                    to={`/map?lat=${selectedReport.location.latitude}&lng=${selectedReport.location.longitude}`}
                    onClick={handleCloseModal}
                  >
                    <Button variant="secondary" size="sm">
                      View on Map
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Report Information */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-text mb-3">Report Information</h3>
              <div className="space-y-2 text-sm">
                {selectedReport.createdAt && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock size={16} />
                    <span>Created: {format(new Date(selectedReport.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
                {selectedReport.updatedAt && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock size={16} />
                    <span>Updated: {format(new Date(selectedReport.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {currentUser && selectedReport.userId === currentUser.uid && (
              <div className="border-t border-border pt-4">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    handleCloseModal()
                    navigate(`/reports/${selectedReport.id}/edit`)
                  }}
                >
                  Edit Report
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default ReportsList

