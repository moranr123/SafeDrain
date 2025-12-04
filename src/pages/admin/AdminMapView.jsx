import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Loader, Filter } from 'lucide-react'
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
import { getReports } from '../../services/reportService'
import { getDrains } from '../../services/drainService'
import { subscribeToCollection } from '../../services/firestoreHelpers'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const libraries = ['places']

const AdminMapView = () => {
  const [searchParams] = useSearchParams()
  const [reports, setReports] = useState([])
  const [drains, setDrains] = useState([])
  const [showReports, setShowReports] = useState(true)
  const [showDrains, setShowDrains] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [selectedMarker, setSelectedMarker] = useState(null)
  const mapRef = useRef(null)

  const initialLat = parseFloat(searchParams.get('lat')) || 14.5995
  const initialLng = parseFloat(searchParams.get('lng')) || 120.9842

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyByXb-FgYHiNhVIsK00kM1jdXYr_OerV7Q',
    libraries
  })

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  }

  const center = {
    lat: initialLat,
    lng: initialLng
  }

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  }

  useEffect(() => {
    // Real-time listeners
    const unsubscribeReports = subscribeToCollection(
      'reports',
      (documents) => {
        setReports(documents)
      },
      [],
      'createdAt',
      'desc',
      1000
    )

    const unsubscribeDrains = subscribeToCollection(
      'drains',
      (documents) => {
        setDrains(documents)
      },
      [],
      'createdAt',
      'desc'
    )

    return () => {
      unsubscribeReports()
      unsubscribeDrains()
    }
  }, [])

  const onMapLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#ef4444'
      case 'high':
        return '#f97316'
      case 'medium':
        return '#eab308'
      case 'low':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#10a37f'
      case 'warning':
        return '#eab308'
      case 'critical':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const createMarkerIcon = (color) => {
    if (!window.google?.maps) return null
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
      anchor: new window.google.maps.Point(0, 0)
    }
  }

  const filteredReports = reports.filter(report => {
    if (!showReports) return false
    if (filterSeverity === 'all') return true
    return report.severity === filterSeverity
  })

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Card>
          <p className="text-red-600">Error loading maps. Please check your API key.</p>
        </Card>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-primary" size={32} />
          <p className="text-text-secondary">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Card padding="sm" className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showReports}
              onChange={(e) => setShowReports(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-text">Reports</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDrains}
              onChange={(e) => setShowDrains(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-text">Sensors</span>
          </label>
        </Card>

        {showReports && (
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-text-secondary" />
            {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
              <Button
                key={severity}
                variant={filterSeverity === severity ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilterSeverity(severity)}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative h-full rounded-xl overflow-hidden border border-border">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          center={center}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Report Markers */}
          {filteredReports
            .filter(report => report.location)
            .map((report) => (
              <Marker
                key={`report-${report.id}`}
                position={{
                  lat: report.location.latitude,
                  lng: report.location.longitude
                }}
                icon={createMarkerIcon(getSeverityColor(report.severity))}
                onClick={() => setSelectedMarker({ type: 'report', data: report })}
              />
            ))}

          {/* Drain/Sensor Markers */}
          {showDrains && drains
            .filter(drain => drain.location || (drain.latitude && drain.longitude))
            .map((drain) => {
              const lat = drain.location?.latitude || drain.latitude
              const lng = drain.location?.longitude || drain.longitude
              if (!lat || !lng) return null

              return (
                <Marker
                  key={`drain-${drain.id}`}
                  position={{ lat, lng }}
                  icon={createMarkerIcon(getStatusColor(drain.status || 'inactive'))}
                  onClick={() => setSelectedMarker({ type: 'drain', data: drain })}
                />
              )
            })}

          {/* Info Window */}
          {selectedMarker && (
            <InfoWindow
              position={{
                lat: selectedMarker.type === 'report'
                  ? selectedMarker.data.location.latitude
                  : selectedMarker.data.location?.latitude || selectedMarker.data.latitude,
                lng: selectedMarker.type === 'report'
                  ? selectedMarker.data.location.longitude
                  : selectedMarker.data.location?.longitude || selectedMarker.data.longitude
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 min-w-[200px]">
                {selectedMarker.type === 'report' ? (
                  <>
                    <h3 className="font-semibold text-sm mb-1">{selectedMarker.data.title}</h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {selectedMarker.data.severity} • {selectedMarker.data.status || 'pending'}
                    </p>
                    <Link
                      to={`/admin/reports/${selectedMarker.data.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Details →
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-sm mb-1">{selectedMarker.data.name || 'Sensor'}</h3>
                    <p className="text-xs text-gray-600 mb-2 capitalize">
                      Status: {selectedMarker.data.status || 'inactive'}
                    </p>
                    {selectedMarker.data.waterLevel !== undefined && (
                      <p className="text-xs text-gray-600">
                        Water Level: {selectedMarker.data.waterLevel}%
                      </p>
                    )}
                  </>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Legend */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow"></div>
            <span className="text-text-secondary">Active Sensors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
            <span className="text-text-secondary">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow"></div>
            <span className="text-text-secondary">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white shadow"></div>
            <span className="text-text-secondary">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
            <span className="text-text-secondary">Low</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AdminMapView
