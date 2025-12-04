import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Loader, Filter, Navigation } from 'lucide-react'
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
import { getReports } from '../../services/reportService'
import { getDrains } from '../../services/drainService'
import { getCurrentLocation } from '../../services/locationService'
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
  const [userLocation, setUserLocation] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(true)
  const mapRef = useRef(null)

  // Get user location from URL params or default
  const urlLat = parseFloat(searchParams.get('lat'))
  const urlLng = parseFloat(searchParams.get('lng'))
  
  // Default center (Manila)
  const defaultCenter = { lat: 14.5995, lng: 120.9842 }
  
  // Determine initial center
  const [center, setCenter] = useState(
    urlLat && urlLng ? { lat: urlLat, lng: urlLng } : defaultCenter
  )

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyByXb-FgYHiNhVIsK00kM1jdXYr_OerV7Q',
    libraries
  })

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
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

  // Get user's current location
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const location = await getCurrentLocation()
        setUserLocation({
          lat: location.latitude,
          lng: location.longitude
        })
        // Only set center to user location if no URL params
        if (!urlLat || !urlLng) {
          setCenter({
            lat: location.latitude,
            lng: location.longitude
          })
        }
      } catch (error) {
        console.error('Error getting user location:', error)
        // Keep default center if location fails
      } finally {
        setGettingLocation(false)
      }
    }

    fetchUserLocation()
  }, [urlLat, urlLng])

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

  const createUserLocationIcon = () => {
    if (!window.google?.maps) return null
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4', // Google Blue
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 12,
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

  if (!isLoaded || gettingLocation) {
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
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={createUserLocationIcon()}
              title="Your Location"
              onClick={() => setSelectedMarker({ type: 'user', data: { position: userLocation } })}
            />
          )}

          {/* Report Markers - Show all reports (filtered by severity if needed) */}
          {filteredReports
            .filter(report => {
              // Filter out reports without location
              if (!report.location) return false
              // Check if location has valid coordinates
              const lat = report.location.latitude || report.location.lat
              const lng = report.location.longitude || report.location.lng
              return lat && lng && !isNaN(lat) && !isNaN(lng)
            })
            .map((report) => {
              const lat = report.location.latitude || report.location.lat
              const lng = report.location.longitude || report.location.lng
              return (
                <Marker
                  key={`report-${report.id}`}
                  position={{
                    lat: lat,
                    lng: lng
                  }}
                  icon={createMarkerIcon(getSeverityColor(report.severity))}
                  onClick={() => setSelectedMarker({ type: 'report', data: report })}
                />
              )
            })}

          {/* Drain/Sensor Markers - Show all drains */}
          {showDrains && drains
            .filter(drain => {
              // Check multiple possible location formats
              const lat = drain.location?.latitude || drain.location?.lat || drain.latitude
              const lng = drain.location?.longitude || drain.location?.lng || drain.longitude
              return lat && lng && !isNaN(lat) && !isNaN(lng)
            })
            .map((drain) => {
              const lat = drain.location?.latitude || drain.location?.lat || drain.latitude
              const lng = drain.location?.longitude || drain.location?.lng || drain.longitude

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
                lat: selectedMarker.type === 'user'
                  ? selectedMarker.data.position.lat
                  : selectedMarker.type === 'report'
                  ? (selectedMarker.data.location?.latitude || selectedMarker.data.location?.lat)
                  : (selectedMarker.data.location?.latitude || selectedMarker.data.location?.lat || selectedMarker.data.latitude),
                lng: selectedMarker.type === 'user'
                  ? selectedMarker.data.position.lng
                  : selectedMarker.type === 'report'
                  ? (selectedMarker.data.location?.longitude || selectedMarker.data.location?.lng)
                  : (selectedMarker.data.location?.longitude || selectedMarker.data.location?.lng || selectedMarker.data.longitude)
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 min-w-[200px]">
                {selectedMarker.type === 'user' ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Navigation size={16} className="text-blue-600" />
                      <h3 className="font-semibold text-sm">Your Location</h3>
                    </div>
                    <p className="text-xs text-gray-600">
                      {selectedMarker.data.position.lat.toFixed(6)}, {selectedMarker.data.position.lng.toFixed(6)}
                    </p>
                  </>
                ) : selectedMarker.type === 'report' ? (
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
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
            <span className="text-text-secondary">Your Location</span>
          </div>
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
