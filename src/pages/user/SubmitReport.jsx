import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, AlertTriangle, Upload, X, Loader, Navigation } from 'lucide-react'
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import { useAuth } from '../../contexts/AuthContext'
import { createReport } from '../../services/reportService'
import { getCurrentLocation } from '../../services/locationService'
import { compressImage } from '../../services/storageHelpers'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

const libraries = ['places']

const SubmitReport = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const [photos, setPhotos] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [showMap, setShowMap] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 })
  const mapRef = useRef(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyByXb-FgYHiNhVIsK00kM1jdXYr_OerV7Q',
    libraries
  })

  // Get location on mount
  useEffect(() => {
    handleGetLocation()
  }, [])

  // Update map center when location changes
  useEffect(() => {
    if (location) {
      setMapCenter({
        lat: location.latitude,
        lng: location.longitude
      })
    }
  }, [location])

  const handleGetLocation = async () => {
    setGettingLocation(true)
    setLocationError('')
    setError('') // Clear any previous errors

    try {
      const loc = await getCurrentLocation()
      setLocation(loc)
      setMapCenter({
        lat: loc.latitude,
        lng: loc.longitude
      })
      setLocationError('') // Clear any previous errors on success
      setShowMap(true) // Show map after getting location
    } catch (err) {
      const errorMessage = err.message || 'Failed to get location'
      setLocationError(errorMessage)
      console.error('Location error:', err)
      
      // Also show a more visible error message
      setError(errorMessage)
      
      // Clear the error message after 5 seconds
      setTimeout(() => {
        setError('')
      }, 5000)
    } finally {
      setGettingLocation(false)
    }
  }

  const onMapClick = useCallback((e) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      
      setLocation({
        latitude: lat,
        longitude: lng,
        accuracy: null,
        address: null
      })
      setMapCenter({ lat, lng })
      setLocationError('')
      setError('')
    }
  }, [])

  const onMapLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  const handleShowMap = () => {
    setShowMap(true)
    // If no location, try to get it first
    if (!location) {
      handleGetLocation()
    }
  }

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      setError('Please select image files only')
      return
    }

    try {
      // Compress images
      const compressedPhotos = await Promise.all(
        imageFiles.map(file => compressImage(file, 1920, 1080, 0.8))
      )

      setPhotos(prev => [...prev, ...compressedPhotos])
      setError('')
    } catch (err) {
      setError('Error processing images: ' + err.message)
    }
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    if (!location) {
      setError('Please enable location access')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const reportData = {
        title: title.trim(),
        description: description.trim(),
        severity,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        },
        address: location.address || 'Location not available'
      }

      const report = await createReport(reportData, photos, currentUser?.uid)
      
      setSuccess(true)
      
      // Reset form
      setTitle('')
      setDescription('')
      setSeverity('medium')
      setPhotos([])
      
      // Navigate to report details after 2 seconds
      setTimeout(() => {
        navigate(`/reports/${report.id}`)
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Submit Report</h1>
        <p className="text-text-secondary">Report a drain issue or concern</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the issue"
          required
        />

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide detailed information about the issue..."
          rows="5"
          required
        />

        {/* Severity */}
        <Select
          label="Severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="low">Low - Minor issue</option>
          <option value="medium">Medium - Needs attention</option>
          <option value="high">High - Urgent</option>
          <option value="critical">Critical - Immediate action required</option>
        </Select>

        {/* Location */}
        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-text flex items-center gap-2">
              <MapPin size={16} />
              Location
            </label>
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
              className="flex items-center gap-2"
            >
              {gettingLocation ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Getting...
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  {location ? 'Update' : 'Get'} Location
                </>
              )}
            </Button>
          </div>
          
          {location ? (
            <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text mb-1">
                    Coordinates
                  </p>
                  <p className="text-sm text-text-secondary font-mono">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                  {location.accuracy && (
                    <p className="text-xs text-text-secondary mt-2">
                      Accuracy: ±{Math.round(location.accuracy)}m
                    </p>
                  )}
                </div>
                <div className="text-green-600">
                  <MapPin size={20} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-text-muted">
                {gettingLocation ? 'Getting your location...' : 'No location set. Click "Get Location" to enable GPS.'}
              </p>
              {locationError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">Error:</p>
                  <p className="text-xs text-red-600">{locationError}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Photos (Optional)
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="block w-full text-sm text-text-secondary
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-white
                hover:file:bg-primary-hover
                file:cursor-pointer"
            />
            
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
            Report submitted successfully! Redirecting...
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !location}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader className="animate-spin mr-2" size={18} />
                Submitting...
              </>
            ) : (
              <>
                <Upload size={18} className="mr-2" />
                Submit Report
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/reports')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SubmitReport

