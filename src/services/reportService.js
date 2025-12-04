import { addDocument, getDocuments, getDocument, updateDocument } from './firestoreHelpers'
import { uploadImage, compressImage } from './storageHelpers'
import { queueOperation, syncPendingOperations, isOnline } from './offlineService'

/**
 * Report Service - Handles report creation, retrieval, and offline sync
 */

// Create a new report
export const createReport = async (reportData, photos = [], userId) => {
  try {
    // Upload photos if any
    const photoUrls = []
    if (photos.length > 0 && isOnline()) {
      for (const photo of photos) {
        try {
          // Compress image before upload
          const compressedPhoto = await compressImage(photo, 1920, 1080, 0.8)
          const result = await uploadImage(
            compressedPhoto,
            'reports',
            userId,
            { metadata: { reportId: reportData.id || 'pending' } }
          )
          photoUrls.push(result.url)
        } catch (error) {
          console.error('Error uploading photo:', error)
          // Continue with other photos even if one fails
        }
      }
    }

    // Prepare report data
    const report = {
      ...reportData,
      userId,
      photos: photoUrls,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (isOnline()) {
      // Save directly to Firestore
      const reportId = await addDocument('reports', report)
      return { id: reportId, ...report, synced: true }
    } else {
      // Queue for offline sync
      const operationId = await queueOperation({
        type: 'createReport',
        data: report
      })
      return { id: `offline_${operationId}`, ...report, synced: false, offline: true }
    }
  } catch (error) {
    console.error('Error creating report:', error)
    throw error
  }
}

// Get all reports
export const getReports = async (filters = [], limitCount = 50) => {
  try {
    return await getDocuments('reports', filters, 'createdAt', 'desc', limitCount)
  } catch (error) {
    console.error('Error getting reports:', error)
    throw error
  }
}

// Get user's reports
export const getUserReports = async (userId, limitCount = 50) => {
  try {
    return await getDocuments(
      'reports',
      [{ field: 'userId', operator: '==', value: userId }],
      'createdAt',
      'desc',
      limitCount
    )
  } catch (error) {
    console.error('Error getting user reports:', error)
    throw error
  }
}

// Get single report
export const getReport = async (reportId) => {
  try {
    return await getDocument('reports', reportId)
  } catch (error) {
    console.error('Error getting report:', error)
    throw error
  }
}

// Update report
export const updateReport = async (reportId, updates) => {
  try {
    if (isOnline()) {
      await updateDocument('reports', reportId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
    } else {
      await queueOperation({
        type: 'updateReport',
        reportId,
        data: updates
      })
    }
  } catch (error) {
    console.error('Error updating report:', error)
    throw error
  }
}

// Sync pending reports
export const syncPendingReports = async (userId) => {
  return await syncPendingOperations(async (operation) => {
    if (operation.type === 'createReport') {
      // Upload photos if they weren't uploaded
      const reportData = { ...operation.data }
      
      if (reportData.photos && reportData.photos.length > 0) {
        // Check if photos are already URLs or need upload
        // This is simplified - in production, you'd need to store photo blobs
      }

      const reportId = await addDocument('reports', reportData)
      return reportId
    } else if (operation.type === 'updateReport') {
      await updateDocument('reports', operation.reportId, operation.data)
      return operation.reportId
    }
  })
}

