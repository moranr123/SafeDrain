import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Clock, AlertTriangle, ArrowLeft, Edit } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getReport } from '../../services/reportService'
import { format } from 'date-fns'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const ReportDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReport()
  }, [id])

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getReport(id)
      setReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading report...</div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error || 'Report not found'}</p>
            <Button onClick={() => navigate('/reports')}>Back to Reports</Button>
          </div>
        </Card>
      </div>
    )
  }

  const isOwner = currentUser && report.userId === currentUser.uid

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </Button>
        {isOwner && (
          <Button
            variant="secondary"
            onClick={() => navigate(`/reports/${id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit size={18} />
            Edit
          </Button>
        )}
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Status */}
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-text flex-1">{report.title}</h1>
              <div className="flex gap-2 flex-shrink-0">
                <span className={`px-3 py-1 text-xs rounded-xl border font-medium ${getSeverityColor(report.severity)}`}>
                  {report.severity}
                </span>
                <span className={`px-3 py-1 text-xs rounded-xl border font-medium ${getStatusColor(report.status || 'pending')}`}>
                  {report.status || 'pending'}
                </span>
              </div>
            </div>
            <p className="text-text-secondary whitespace-pre-wrap">{report.description}</p>
          </Card>

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <Card>
              <h2 className="font-semibold text-text mb-4">Photos ({report.photos.length})</h2>
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
            </Card>
          )}

          {/* Location */}
          {report.location && (
            <Card>
              <h2 className="font-semibold text-text mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Location
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-text-secondary">
                  {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                </p>
                {report.location.accuracy && (
                  <p className="text-xs text-text-muted">
                    Accuracy: ±{Math.round(report.location.accuracy)}m
                  </p>
                )}
                {report.address && (
                  <p className="text-sm text-text">{report.address}</p>
                )}
                <Link
                  to={`/map?lat=${report.location.latitude}&lng=${report.location.longitude}`}
                  className="inline-block"
                >
                  <Button variant="secondary" size="sm">
                    View on Map
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Report Info */}
          <Card>
            <h2 className="font-semibold text-text mb-4">Report Information</h2>
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
              {report.offline && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle size={16} />
                  <span>Submitted offline - pending sync</span>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          {isOwner && (
            <Card>
              <h2 className="font-semibold text-text mb-4">Actions</h2>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/reports/${id}/edit`)}
                >
                  Edit Report
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportDetails

