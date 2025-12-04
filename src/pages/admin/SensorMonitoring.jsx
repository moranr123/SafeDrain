import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Activity, Droplet, Thermometer, Gauge, MapPin, Navigation, Loader, Search } from 'lucide-react'
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api'
import { getDrains, addDrain, updateDrain, deleteDrain } from '../../services/drainService'
import { subscribeToCollection } from '../../services/firestoreHelpers'
import { exportSensorsToCSV } from '../../services/exportService'
import { getCurrentLocation, geocodeLatLng } from '../../services/locationService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

const libraries = ['places']

const SensorMonitoring = () => {
  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSensor, setEditingSensor] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    location: '', // Text address
    locationCoords: null, // { latitude, longitude }
    description: '',
    status: 'active',
    waterLevel: '',
    flowRate: '',
    temperature: ''
  })
  const [showMap, setShowMap] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 })
  const [gettingLocation, setGettingLocation] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const mapRef = useRef(null)
  const autocompleteRef = useRef(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyByXb-FgYHiNhVIsK00kM1jdXYr_OerV7Q',
    libraries
  })

  useEffect(() => {
    // Real-time listener
    const unsubscribe = subscribeToCollection(
      'drains',
      (documents) => {
        setSensors(documents)
        setLoading(false)
      },
      [],
      'createdAt',
      'desc'
    )

    return () => unsubscribe()
  }, [])

  // Get user's current location for map centering
  useEffect(() => {
    if (showModal && !editingSensor) {
      const fetchUserLocation = async () => {
        try {
          const loc = await getCurrentLocation()
          setUserLocation({
            lat: loc.latitude,
            lng: loc.longitude
          })
          setMapCenter({
            lat: loc.latitude,
            lng: loc.longitude
          })
        } catch (error) {
          console.error('Error getting user location for map:', error)
        }
      }
      fetchUserLocation()
    }
  }, [showModal, editingSensor])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGetLocation = async () => {
    setGettingLocation(true)
    try {
      const loc = await getCurrentLocation()
      const address = await geocodeLatLng(loc.latitude, loc.longitude)
      setFormData(prev => ({
        ...prev,
        location: address,
        locationCoords: {
          latitude: loc.latitude,
          longitude: loc.longitude
        }
      }))
      setMapCenter({
        lat: loc.latitude,
        lng: loc.longitude
      })
      setShowMap(true)
    } catch (error) {
      console.error('Error getting location:', error)
      alert('Failed to get location: ' + error.message)
    } finally {
      setGettingLocation(false)
    }
  }

  const onMapClick = useCallback(async (e) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      try {
        const address = await geocodeLatLng(lat, lng)
        setFormData(prev => ({
          ...prev,
          location: address,
          locationCoords: {
            latitude: lat,
            longitude: lng
          }
        }))
        setMapCenter({ lat, lng })
      } catch (error) {
        console.error('Error geocoding location:', error)
        setFormData(prev => ({
          ...prev,
          location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          locationCoords: {
            latitude: lat,
            longitude: lng
          }
        }))
        setMapCenter({ lat, lng })
      }
    }
  }, [])

  const onMapLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  const onPlaceSelect = useCallback(async () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace()
      
      if (place.geometry) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address || place.name || ''
        
        setFormData(prev => ({
          ...prev,
          location: address,
          locationCoords: {
            latitude: lat,
            longitude: lng
          }
        }))
        
        setMapCenter({ lat, lng })
        setShowMap(true)
        
        // Pan map to selected location
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng })
          mapRef.current.setZoom(15)
        }
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const sensorData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        waterLevel: formData.waterLevel ? parseFloat(formData.waterLevel) : undefined,
        flowRate: formData.flowRate ? parseFloat(formData.flowRate) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        // Store location as object with address and coordinates
        location: formData.locationCoords ? {
          latitude: formData.locationCoords.latitude,
          longitude: formData.locationCoords.longitude,
          address: formData.location || `${formData.locationCoords.latitude.toFixed(6)}, ${formData.locationCoords.longitude.toFixed(6)}`
        } : (formData.location || ''),
        // Also store as top-level fields for compatibility
        ...(formData.locationCoords && {
          latitude: formData.locationCoords.latitude,
          longitude: formData.locationCoords.longitude
        })
      }

      if (editingSensor) {
        await updateDrain(editingSensor.id, sensorData)
      } else {
        await addDrain(sensorData)
      }

      setShowModal(false)
      setEditingSensor(null)
      setShowMap(false)
      setFormData({
        name: '',
        location: '',
        locationCoords: null,
        description: '',
        status: 'active',
        waterLevel: '',
        flowRate: '',
        temperature: ''
      })
    } catch (error) {
      console.error('Error saving sensor:', error)
      alert('Failed to save sensor')
    }
  }

  const handleEdit = (sensor) => {
    setEditingSensor(sensor)
    const locationCoords = (sensor.latitude && sensor.longitude) 
      ? { latitude: sensor.latitude, longitude: sensor.longitude }
      : (sensor.location?.latitude && sensor.location?.longitude)
      ? { latitude: sensor.location.latitude, longitude: sensor.location.longitude }
      : null
    
    const locationText = typeof sensor.location === 'string' 
      ? sensor.location 
      : (sensor.location?.address || (locationCoords 
        ? `${locationCoords.latitude.toFixed(6)}, ${locationCoords.longitude.toFixed(6)}`
        : ''))
    
    setFormData({
      name: sensor.name || '',
      location: locationText,
      locationCoords,
      description: sensor.description || '',
      status: sensor.status || 'active',
      waterLevel: sensor.waterLevel?.toString() || '',
      flowRate: sensor.flowRate?.toString() || '',
      temperature: sensor.temperature?.toString() || ''
    })
    
    // Set map center to sensor location if available
    if (locationCoords) {
      setMapCenter({
        lat: locationCoords.latitude,
        lng: locationCoords.longitude
      })
      setShowMap(true)
    } else if (userLocation) {
      setMapCenter(userLocation)
    } else {
      // Try to get user location for map centering
      getCurrentLocation()
        .then(loc => {
          setUserLocation({ lat: loc.latitude, lng: loc.longitude })
          setMapCenter({ lat: loc.latitude, lng: loc.longitude })
        })
        .catch(() => {
          // Keep default center
        })
    }
    
    setShowModal(true)
  }

  const handleDelete = async (sensorId) => {
    if (!confirm('Are you sure you want to delete this sensor?')) return

    try {
      await deleteDrain(sensorId)
    } catch (error) {
      console.error('Error deleting sensor:', error)
      alert('Failed to delete sensor')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleSearch = () => {
    setSearchQuery(searchInput.trim())
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  const filteredSensors = sensors.filter(sensor => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = (sensor.name || '').toLowerCase()
    const description = (sensor.description || '').toLowerCase()
    const location = typeof sensor.location === 'string' 
      ? sensor.location.toLowerCase()
      : (sensor.location?.address || '').toLowerCase()
    const status = (sensor.status || '').toLowerCase()
    
    return name.includes(query) || 
           description.includes(query) || 
           location.includes(query) ||
           status.includes(query)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Sensor Monitoring</h1>
          <p className="text-text-secondary">Manage and monitor drain sensors</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => exportSensorsToCSV(sensors)}
            className="flex items-center gap-2"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditingSensor(null)
              setFormData({
                name: '',
                location: '',
                locationCoords: null,
                description: '',
                status: 'active',
                waterLevel: '',
                flowRate: '',
                temperature: ''
              })
              setShowMap(false)
              setShowModal(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Search size={18} className="text-text-secondary flex-shrink-0" />
            <Input
              type="text"
              placeholder="Search sensors by name, location, description, or status..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              className="flex items-center gap-2"
            >
              <Search size={18} />
              Search
            </Button>
            {searchQuery && (
              <Button
                variant="secondary"
                onClick={handleClearSearch}
                className="flex items-center gap-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-text-secondary">
            Showing {filteredSensors.length} of {sensors.length} sensors matching "{searchQuery}"
          </div>
        )}
      </Card>

      {/* Sensors Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading sensors...</div>
        </div>
      ) : sensors.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">No sensors registered</p>
          <Button onClick={() => setShowModal(true)}>Add First Sensor</Button>
        </Card>
      ) : filteredSensors.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">
            {searchQuery ? `No sensors found matching "${searchQuery}"` : 'No sensors registered'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowModal(true)}>Add First Sensor</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map((sensor) => (
            <Card key={sensor.id} hover>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text mb-1">
                      {sensor.name || 'Unnamed Sensor'}
                    </h3>
                    {sensor.location && (
                      <p className="text-sm text-text-secondary">
                        {typeof sensor.location === 'string' 
                          ? sensor.location 
                          : (sensor.location?.address || 
                             (sensor.location?.latitude && sensor.location?.longitude
                               ? `${sensor.location.latitude.toFixed(6)}, ${sensor.location.longitude.toFixed(6)}`
                               : 'Location set'))}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-xl border font-medium ${getStatusColor(sensor.status || 'inactive')}`}>
                    {sensor.status || 'inactive'}
                  </span>
                </div>

                {/* Sensor Readings */}
                <div className="grid grid-cols-2 gap-3">
                  {sensor.waterLevel !== undefined && (
                    <div className="p-3 bg-bg rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplet size={16} className="text-primary" />
                        <span className="text-xs text-text-secondary">Water Level</span>
                      </div>
                      <p className="text-lg font-bold text-text">{sensor.waterLevel}%</p>
                    </div>
                  )}
                  {sensor.flowRate !== undefined && (
                    <div className="p-3 bg-bg rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge size={16} className="text-primary" />
                        <span className="text-xs text-text-secondary">Flow Rate</span>
                      </div>
                      <p className="text-lg font-bold text-text">{sensor.flowRate} L/min</p>
                    </div>
                  )}
                  {sensor.temperature !== undefined && (
                    <div className="p-3 bg-bg rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer size={16} className="text-primary" />
                        <span className="text-xs text-text-secondary">Temperature</span>
                      </div>
                      <p className="text-lg font-bold text-text">{sensor.temperature}°C</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(sensor)}
                    className="flex-1"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(sensor.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingSensor(null)
          setShowMap(false)
          setFormData({
            name: '',
            location: '',
            locationCoords: null,
            description: '',
            status: 'active',
            waterLevel: '',
            flowRate: '',
            temperature: ''
          })
        }}
        title={editingSensor ? 'Edit Sensor' : 'Add New Sensor'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Sensor Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          {/* Location Section */}
          <Card padding="sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
              <label className="text-sm font-medium text-text flex items-center gap-2">
                <MapPin size={16} />
                Location
              </label>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowMap(!showMap)
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm"
                >
                  <MapPin size={14} />
                  <span className="hidden xs:inline">{showMap ? 'Hide' : 'Show'} Map</span>
                  <span className="xs:hidden">Map</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleGetLocation()
                  }}
                  disabled={gettingLocation}
                  className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm"
                >
                  {gettingLocation ? (
                    <>
                      <Loader className="animate-spin" size={14} />
                      <span className="hidden xs:inline">Getting...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={14} />
                      <span className="hidden xs:inline">Use GPS</span>
                      <span className="xs:hidden">GPS</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Map */}
            {showMap && (
              <div className="mb-3">
                {!isLoaded ? (
                  <div className="h-48 sm:h-64 rounded-xl border border-border flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Loader className="animate-spin mx-auto mb-2 text-primary" size={24} />
                      <p className="text-sm text-text-secondary">Loading map...</p>
                    </div>
                  </div>
                ) : loadError ? (
                  <div className="h-48 sm:h-64 rounded-xl border border-border flex items-center justify-center bg-red-50">
                    <div className="text-center">
                      <p className="text-sm text-red-600">Error loading map</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 rounded-xl overflow-hidden border border-border relative">
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={mapCenter}
                      zoom={15}
                      onClick={onMapClick}
                      onLoad={onMapLoad}
                      options={{
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                      }}
                    >
                      {/* User Location Marker */}
                      {userLocation && (
                        <Marker
                          position={userLocation}
                          icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeWeight: 3,
                            strokeColor: '#ffffff',
                            scale: 10,
                          }}
                          title="Your Location"
                        />
                      )}
                      
                      {/* Selected/Pinned Location Marker */}
                      {formData.locationCoords && (
                        <Marker
                          position={{
                            lat: formData.locationCoords.latitude,
                            lng: formData.locationCoords.longitude
                          }}
                          icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#10a37f',
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: '#ffffff',
                            scale: 8,
                          }}
                          title="Sensor Location"
                        />
                      )}
                    </GoogleMap>
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs text-text shadow-sm">
                      <span className="hidden sm:inline">Click on the map to pin location</span>
                      <span className="sm:hidden">Tap to pin</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Location Search with Autocomplete */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text">
                Location Address
              </label>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) => {
                    autocompleteRef.current = autocomplete
                  }}
                  onPlaceChanged={onPlaceSelect}
                  options={{
                    types: ['geocode', 'establishment'],
                    componentRestrictions: { country: 'ph' } // Restrict to Philippines
                  }}
                >
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Search for a location..."
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </Autocomplete>
              ) : (
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Address or coordinates"
                  required
                  disabled
                />
              )}
            </div>
            
            {/* Coordinates Display */}
            {formData.locationCoords && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs text-text-secondary mb-1">Coordinates:</p>
                <p className="text-xs font-mono text-text">
                  {formData.locationCoords.latitude.toFixed(6)}, {formData.locationCoords.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </Card>
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
          />
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </Select>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Water Level (%)"
              type="number"
              name="waterLevel"
              value={formData.waterLevel}
              onChange={handleInputChange}
              min="0"
              max="100"
            />
            <Input
              label="Flow Rate (L/min)"
              type="number"
              name="flowRate"
              value={formData.flowRate}
              onChange={handleInputChange}
              min="0"
            />
            <Input
              label="Temperature (°C)"
              type="number"
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              {editingSensor ? 'Update' : 'Add'} Sensor
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingSensor(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SensorMonitoring

