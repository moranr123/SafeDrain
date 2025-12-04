import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  uploadImage,
  uploadImageWithProgress,
  deleteFile,
  compressImage
} from '../services/storageHelpers'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

/**
 * Example component showing how to upload images to Firebase Storage
 */
const StorageExample = () => {
  const { currentUser } = useAuth()
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [error, setError] = useState('')
  const [useCompression, setUseCompression] = useState(true)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      setSelectedFile(file)
      setError('')
      setUploadedImage(null)
    }
  }

  // Example: Simple image upload
  const handleSimpleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      let fileToUpload = selectedFile

      // Compress image if enabled
      if (useCompression) {
        fileToUpload = await compressImage(selectedFile, 1920, 1080, 0.8)
      }

      const result = await uploadImage(
        fileToUpload,
        'drain-images',
        currentUser?.uid,
        {
          metadata: {
            description: 'Drain monitoring image'
          }
        }
      )

      setUploadedImage(result)
      setSelectedFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  // Example: Image upload with progress tracking
  const handleUploadWithProgress = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      let fileToUpload = selectedFile

      // Compress image if enabled
      if (useCompression) {
        fileToUpload = await compressImage(selectedFile, 1920, 1080, 0.8)
      }

      const result = await uploadImageWithProgress(
        fileToUpload,
        'drain-images',
        currentUser?.uid,
        (progressValue) => {
          setProgress(progressValue)
        },
        {
          metadata: {
            description: 'Drain monitoring image with progress'
          }
        }
      )

      setUploadedImage(result)
      setSelectedFile(null)
      setProgress(0)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  // Example: Delete uploaded image
  const handleDelete = async () => {
    if (!uploadedImage) return

    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      await deleteFile(uploadedImage.path)
      setUploadedImage(null)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-text mb-4">Storage Example</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Select Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-text-secondary
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-white
                hover:file:bg-primary-hover
                file:cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="compress"
              checked={useCompression}
              onChange={(e) => setUseCompression(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="compress" className="text-sm text-text-secondary">
              Compress image before upload
            </label>
          </div>

          {selectedFile && (
            <div className="p-4 bg-bg rounded-xl">
              <p className="text-sm text-text-secondary mb-2">Selected file:</p>
              <p className="font-medium text-text">{selectedFile.name}</p>
              <p className="text-xs text-text-muted">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSimpleUpload}
              disabled={!selectedFile || uploading}
            >
              Upload (Simple)
            </Button>
            <Button
              variant="secondary"
              onClick={handleUploadWithProgress}
              disabled={!selectedFile || uploading}
            >
              Upload (With Progress)
            </Button>
          </div>

          {uploading && progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-bg rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {uploadedImage && (
            <Card padding="sm">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text mb-2">Uploaded Image</h3>
                  <img
                    src={uploadedImage.url}
                    alt="Uploaded"
                    className="max-w-full h-auto rounded-xl border border-border"
                  />
                </div>
                <div className="text-sm text-text-secondary space-y-1">
                  <p><strong>URL:</strong> {uploadedImage.url}</p>
                  <p><strong>Path:</strong> {uploadedImage.path}</p>
                  <p><strong>Name:</strong> {uploadedImage.name}</p>
                </div>
                <Button variant="danger" onClick={handleDelete}>
                  Delete Image
                </Button>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  )
}

export default StorageExample

