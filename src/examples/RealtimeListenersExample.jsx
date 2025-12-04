import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeToDocument,
  subscribeToCollection
} from '../services/firestoreHelpers'
import Card from '../components/ui/Card'

/**
 * Example component showing real-time Firestore listeners
 */
const RealtimeListenersExample = () => {
  const { currentUser } = useAuth()
  const [singleDoc, setSingleDoc] = useState(null)
  const [collectionDocs, setCollectionDocs] = useState([])
  const [updates, setUpdates] = useState([])

  // Example 1: Real-time listener for a single document
  useEffect(() => {
    if (!currentUser) return

    // Subscribe to a specific document (e.g., user profile)
    const unsubscribe = subscribeToDocument(
      'users',
      currentUser.uid,
      (doc, error) => {
        if (error) {
          console.error('Error in document listener:', error)
          return
        }

        if (doc) {
          setSingleDoc(doc)
          setUpdates(prev => [
            ...prev,
            { type: 'document', timestamp: new Date(), data: doc }
          ])
        }
      }
    )

    return () => unsubscribe()
  }, [currentUser])

  // Example 2: Real-time listener for a collection with filters
  useEffect(() => {
    if (!currentUser) return

    // Subscribe to a collection with filters
    const unsubscribe = subscribeToCollection(
      'drains',
      (documents, error) => {
        if (error) {
          console.error('Error in collection listener:', error)
          return
        }

        setCollectionDocs(documents)
        setUpdates(prev => [
          ...prev,
          { type: 'collection', timestamp: new Date(), count: documents.length }
        ])
      },
      [
        // Filter: only active drains
        { field: 'status', operator: '==', value: 'active' }
      ],
      'createdAt',
      'desc',
      10 // Limit to 10 documents
    )

    return () => unsubscribe()
  }, [currentUser])

  // Example 3: Real-time listener for readings (time-series data)
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToCollection(
      'readings',
      (documents) => {
        console.log('New readings received:', documents.length)
        // Process real-time sensor readings
        if (documents.length > 0) {
          const latest = documents[0]
          setUpdates(prev => [
            ...prev,
            {
              type: 'reading',
              timestamp: new Date(),
              drainId: latest.drainId,
              value: latest.waterLevel
            }
          ])
        }
      },
      [],
      'timestamp',
      'desc',
      50 // Last 50 readings
    )

    return () => unsubscribe()
  }, [currentUser])

  // Example 4: Real-time listener for alerts
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToCollection(
      'alerts',
      (documents) => {
        // Filter unread alerts
        const unread = documents.filter(alert => !alert.read)
        if (unread.length > 0) {
          console.log('New unread alerts:', unread.length)
          setUpdates(prev => [
            ...prev,
            {
              type: 'alert',
              timestamp: new Date(),
              count: unread.length,
              alerts: unread
            }
          ])
        }
      },
      [
        { field: 'read', operator: '==', value: false }
      ],
      'createdAt',
      'desc'
    )

    return () => unsubscribe()
  }, [currentUser])

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-text mb-4">Real-time Listeners Example</h2>

        <div className="space-y-6">
          {/* Single Document */}
          <div>
            <h3 className="font-semibold text-text mb-2">Single Document Listener</h3>
            {singleDoc ? (
              <div className="p-4 bg-bg rounded-xl">
                <pre className="text-xs text-text-secondary overflow-auto">
                  {JSON.stringify(singleDoc, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-text-muted text-sm">No document data yet</p>
            )}
          </div>

          {/* Collection */}
          <div>
            <h3 className="font-semibold text-text mb-2">
              Collection Listener ({collectionDocs.length} items)
            </h3>
            {collectionDocs.length > 0 ? (
              <div className="space-y-2">
                {collectionDocs.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="p-3 bg-bg rounded-xl text-sm">
                    <p className="font-medium text-text">{doc.name || doc.id}</p>
                    <p className="text-text-secondary text-xs">
                      Status: {doc.status || 'N/A'}
                    </p>
                  </div>
                ))}
                {collectionDocs.length > 5 && (
                  <p className="text-text-muted text-xs">
                    ... and {collectionDocs.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No collection data yet</p>
            )}
          </div>

          {/* Updates Log */}
          <div>
            <h3 className="font-semibold text-text mb-2">
              Real-time Updates ({updates.length})
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {updates.length === 0 ? (
                <p className="text-text-muted text-sm">No updates yet</p>
              ) : (
                updates.slice(-10).reverse().map((update, index) => (
                  <div
                    key={index}
                    className="p-3 bg-bg rounded-xl text-xs border-l-4 border-l-primary"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text capitalize">
                        {update.type}
                      </span>
                      <span className="text-text-muted">
                        {update.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {update.count !== undefined && (
                      <p className="text-text-secondary">Count: {update.count}</p>
                    )}
                    {update.value !== undefined && (
                      <p className="text-text-secondary">Value: {update.value}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 font-semibold mb-2">💡 How it works:</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>All listeners automatically update when data changes in Firestore</li>
              <li>No need to manually refresh - changes appear instantly</li>
              <li>Listeners are automatically cleaned up when component unmounts</li>
              <li>Use filters to subscribe to specific data subsets</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RealtimeListenersExample

