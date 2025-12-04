import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Clock, AlertTriangle, ArrowLeft, Edit, CheckCircle } from 'lucide-react'
import { getReport, updateReport } from '../../services/reportService'
import { format } from 'date-fns'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'

const AdminReportDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchReport()
  }, [id])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const data = await getReport(id)
      setReport(data)
      setStatus(data.status || 'pending')
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (status === report.status) return

    setUpdating(true)
    try {
      await updateReport(id, { status })
      setReport({ ...report, status })
    } catch (error) {
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading report...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">Report not found</p>
          <Button onClick={() => navigate('/admin/reports')}>Back to Reports</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/reports')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-text">{report.title}</h1>
              <span className={`px-3 py-1 text-xs rounded-xl border font-medium ${getSeverityColor(report.severity)}`}>
                {report.severity}
              </span>
            </div>
            <p className="text-text-secondary whitespace-pre-wrap mb-6">{report.description}</p>

            {report.photos && report.photos.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-text mb-3">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {report.photos.map((photo, index) => (
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

            {report.location && (
              <div>
                <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <MapPin size={20} />
                  Location
                </h3>
                <p className="text-sm text-text-secondary mb-2">
                  {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                </p>
                <Link to={`/admin/map?lat=${report.location.latitude}&lng=${report.location.longitude}`}>
                  <Button variant="secondary" size="sm">View on Map</Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-text mb-4">Report Status</h3>
            <div className="space-y-4">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </Select>
              <Button
                onClick={handleStatusUpdate}
                disabled={updating || status === report.status}
                className="w-full"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-text mb-4">Report Information</h3>
            <div className="space-y-3 text-sm">
              {report.createdAt && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock size={16} />
                  <span>Created: {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}
              {report.updatedAt && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock size={16} />
                  <span>Updated: {format(new Date(report.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}
              {report.userId && (
                <div>
                  <p className="text-text-secondary mb-1">User ID</p>
                  <p className="font-mono text-xs text-text break-all">{report.userId}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminReportDetails

