/**
 * Location Service - GPS and geolocation utilities
 */

// Get current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        })
      },
      (error) => {
        let errorMessage = 'Failed to get location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS settings.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.'
            break
          default:
            errorMessage = error.message || 'An unknown error occurred while getting your location.'
        }
        
        reject(new Error(errorMessage))
      },
      options
    )
  })
}

// Watch location (continuous updates)
export const watchLocation = (callback, errorCallback) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation is not supported'))
    return null
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      })
    },
    errorCallback,
    options
  )

  return watchId
}

// Stop watching location
export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
}

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

// Format coordinates for display
export const formatCoordinates = (latitude, longitude, decimals = 6) => {
  return {
    lat: latitude.toFixed(decimals),
    lng: longitude.toFixed(decimals),
    formatted: `${latitude.toFixed(decimals)}, ${longitude.toFixed(decimals)}`
  }
}

// Check if location permission is granted
export const checkLocationPermission = async () => {
  if (!navigator.permissions) {
    return 'unknown'
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state // 'granted', 'denied', or 'prompt'
  } catch (error) {
    return 'unknown'
  }
}

// Reverse geocode: Convert coordinates to address using Google Maps Geocoding API
export const geocodeLatLng = async (latitude, longitude) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'))
      return
    }

    const geocoder = new window.google.maps.Geocoder()
    const latlng = {
      lat: latitude,
      lng: longitude
    }

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          resolve(results[0].formatted_address)
        } else {
          resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
        }
      } else {
        // If geocoding fails, return coordinates as fallback
        resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      }
    })
  })
}

