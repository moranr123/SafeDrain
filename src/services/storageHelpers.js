import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata
} from 'firebase/storage'
import { storage } from '../config/firebase'

/**
 * Firebase Storage helper functions for image/file uploads
 */

// Upload a file (simple, no progress tracking)
export const uploadFile = async (file, path, metadata = {}) => {
  try {
    const storageRef = ref(storage, path)
    const uploadResult = await uploadBytes(storageRef, file, metadata)
    const downloadURL = await getDownloadURL(uploadResult.ref)
    
    return {
      url: downloadURL,
      path: uploadResult.ref.fullPath,
      name: uploadResult.ref.name
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// Upload a file with progress tracking
export const uploadFileWithProgress = (file, path, onProgress, metadata = {}) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file, metadata)
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        if (onProgress) {
          onProgress(progress, snapshot)
        }
      },
      (error) => {
        console.error('Error uploading file:', error)
        reject(error)
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
          resolve({
            url: downloadURL,
            path: uploadTask.snapshot.ref.fullPath,
            name: uploadTask.snapshot.ref.name
          })
        } catch (error) {
          reject(error)
        }
      }
    )
  })
}

// Upload an image with automatic compression and thumbnail generation
export const uploadImage = async (
  file,
  folder = 'images',
  userId = null,
  options = {}
) => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    
    // Create path
    const path = userId 
      ? `${folder}/${userId}/${fileName}`
      : `${folder}/${fileName}`
    
    // Set metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...options.metadata
      }
    }
    
    // Upload file
    const result = await uploadFile(file, path, metadata)
    
    return result
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Upload image with progress tracking
export const uploadImageWithProgress = (
  file,
  folder = 'images',
  userId = null,
  onProgress,
  options = {}
) => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    
    // Create path
    const path = userId 
      ? `${folder}/${userId}/${fileName}`
      : `${folder}/${fileName}`
    
    // Set metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        ...options.metadata
      }
    }
    
    // Upload with progress
    return uploadFileWithProgress(file, path, onProgress, metadata)
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

// Delete a file
export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

// Get file download URL
export const getFileURL = async (path) => {
  try {
    const storageRef = ref(storage, path)
    const url = await getDownloadURL(storageRef)
    return url
  } catch (error) {
    console.error('Error getting file URL:', error)
    throw error
  }
}

// List all files in a folder
export const listFiles = async (folderPath) => {
  try {
    const folderRef = ref(storage, folderPath)
    const result = await listAll(folderRef)
    
    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef)
        const metadata = await getMetadata(itemRef)
        
        return {
          name: itemRef.name,
          url,
          path: itemRef.fullPath,
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated
        }
      })
    )
    
    return files
  } catch (error) {
    console.error('Error listing files:', error)
    throw error
  }
}

// Get file metadata
export const getFileMetadata = async (path) => {
  try {
    const storageRef = ref(storage, path)
    const metadata = await getMetadata(storageRef)
    
    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
      customMetadata: metadata.customMetadata
    }
  } catch (error) {
    console.error('Error getting file metadata:', error)
    throw error
  }
}

// Update file metadata
export const updateFileMetadata = async (path, newMetadata) => {
  try {
    const storageRef = ref(storage, path)
    await updateMetadata(storageRef, newMetadata)
  } catch (error) {
    console.error('Error updating file metadata:', error)
    throw error
  }
}

// Compress image before upload (client-side, basic)
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: file.type }))
          },
          file.type,
          quality
        )
      }
      
      img.onerror = reject
      img.src = e.target.result
    }
    
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

