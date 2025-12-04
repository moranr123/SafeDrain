import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Filter, Download, Eye, Edit, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getReports, updateReport } from '../../services/reportService'
import { subscribeToCollection } from '../../services/firestoreHelpers'
import { exportReportsToCSV, exportReportsToPDF } from '../../services/exportService'
import { format } from 'date-fns'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'

const ReportsManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Update URL when filter changes (separate effect to avoid recreating listener)
  useEffect(() => {
    if (filterStatus !== 'all') {
      setSearchParams({ status: filterStatus }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [filterStatus, setSearchParams])

  // Real-time listener (only set up once, not dependent on filterStatus)
  useEffect(() => {
    let unsubscribe = null
    let isMounted = true

    try {
      unsubscribe = subscribeToCollection(
        'reports',
        (documents) => {
          if (isMounted) {
            setReports(documents)
            setLoading(false)
          }
        },
        [],
        'createdAt',
        'desc',
        1000
      )
    } catch (error) {
      console.error('Error setting up reports listener:', error)
      if (isMounted) {
        setLoading(false)
      }
    }

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, []) // Empty dependency array - only set up once

  const handleStatusChange = async (reportId, newStatus) => {
    setUpdating(true)
    try {
      await updateReport(reportId, { status: newStatus })
      setShowModal(false)
      setSelectedReport(null)
    } catch (error) {
      console.error('Error updating report:', error)
      alert('Failed to update report status')
    } finally {
      setUpdating(false)
    }
  }

  const handleExport = (format) => {
    const filtered = getFilteredReports()
    try {
      if (format === 'csv') {
        exportReportsToCSV(filtered)
      } else if (format === 'pdf') {
        exportReportsToPDF(filtered)
      }
    } catch (error) {
      alert('Error exporting reports: ' + error.message)
    }
  }

  const getFilteredReports = () => {
    return reports.filter(report => {
      if (filterStatus !== 'all' && report.status !== filterStatus) return false
      if (filterSeverity !== 'all' && report.severity !== filterSeverity) return false
      return true
    })
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredReports = getFilteredReports()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Reports Management</h1>
          <p className="text-text-secondary">Manage and review user-submitted reports</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-text-secondary" />
            <span className="text-sm font-medium text-text">Status:</span>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-auto min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text">Severity:</span>
            <Select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-auto min-w-[150px]"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
          <div className="text-sm text-text-secondary">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      </Card>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading reports...</div>
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary">No reports found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card key={report.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-text">{report.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-xl border font-medium ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-xl border font-medium ${getStatusColor(report.status || 'pending')}`}>
                      {report.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                    {report.createdAt && (
                      <span>
                        {format(
                          report.createdAt instanceof Date 
                            ? report.createdAt 
                            : new Date(report.createdAt), 
                          'MMM d, yyyy h:mm a'
                        )}
                      </span>
                    )}
                    {report.location && (
                      <span>Location: {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}</span>
                    )}
                    {report.photos && report.photos.length > 0 && (
                      <span>{report.photos.length} photo{report.photos.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link to={`/admin/reports/${report.id}`}>
                    <Button variant="secondary" size="sm" className="flex items-center gap-1">
                      <Eye size={16} />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report)
                      setShowModal(true)
                    }}
                    className="flex items-center gap-1"
                  >
                    <Edit size={16} />
                    Update
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedReport(null)
        }}
        title="Update Report Status"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary mb-2">Current Status:</p>
              <p className="font-medium text-text">{selectedReport.status || 'pending'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                New Status
              </label>
              <Select
                value={selectedReport.status || 'pending'}
                onChange={(e) => {
                  setSelectedReport({ ...selectedReport, status: e.target.value })
                }}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleStatusChange(selectedReport.id, selectedReport.status || 'pending')}
                disabled={updating}
                className="flex-1"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false)
                  setSelectedReport(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReportsManagement

