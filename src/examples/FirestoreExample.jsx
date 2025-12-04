import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  subscribeToDocument
} from '../services/firestoreHelpers'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

/**
 * Example component showing how to use Firestore helpers
 */
const FirestoreExample = () => {
  const { currentUser } = useAuth()
  const [items, setItems] = useState([])
  const [itemName, setItemName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Example: Get all documents
  const fetchItems = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Get all items (you can add filters, ordering, etc.)
      const data = await getDocuments('items', [], 'createdAt', 'desc')
      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Example: Add a new document
  const addItem = async (e) => {
    e.preventDefault()
    if (!itemName.trim()) return

    setLoading(true)
    setError('')

    try {
      await addDocument('items', {
        name: itemName,
        userId: currentUser?.uid || 'anonymous',
        completed: false
      })
      setItemName('')
      await fetchItems() // Refresh list
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Example: Update a document
  const toggleItem = async (itemId, currentStatus) => {
    try {
      await updateDocument('items', itemId, {
        completed: !currentStatus
      })
      await fetchItems() // Refresh list
    } catch (err) {
      setError(err.message)
    }
  }

  // Example: Delete a document
  const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await deleteDocument('items', itemId)
      await fetchItems() // Refresh list
    } catch (err) {
      setError(err.message)
    }
  }

  // Example: Real-time listener for collection
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = subscribeToCollection(
      'items',
      (documents) => {
        console.log('Real-time update:', documents)
        setItems(documents)
      },
      [
        { field: 'userId', operator: '==', value: currentUser.uid }
      ],
      'createdAt',
      'desc'
    )

    return () => unsubscribe()
  }, [currentUser])

  // Example: Real-time listener for a single document
  useEffect(() => {
    if (items.length === 0) return

    const firstItemId = items[0].id
    const unsubscribe = subscribeToDocument('items', firstItemId, (doc) => {
      if (doc) {
        console.log('Single document update:', doc)
        // Update the item in the list
        setItems(prev => prev.map(item => 
          item.id === doc.id ? doc : item
        ))
      }
    })

    return () => unsubscribe()
  }, [items.length > 0 ? items[0].id : null])

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-text mb-4">Firestore Example</h2>
        
        <form onSubmit={addItem} className="space-y-4 mb-6">
          <Input
            label="Item Name"
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Enter item name"
          />
          <Button type="submit" disabled={loading}>
            Add Item
          </Button>
        </form>

        <Button variant="secondary" onClick={fetchItems} disabled={loading}>
          Refresh List
        </Button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-text mb-2">Items ({items.length})</h3>
          {items.length === 0 ? (
            <p className="text-text-secondary">No items yet. Add one above!</p>
          ) : (
            items.map((item) => (
              <Card key={item.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed || false}
                      onChange={() => toggleItem(item.id, item.completed)}
                      className="rounded"
                    />
                    <span className={item.completed ? 'line-through text-text-muted' : 'text-text'}>
                      {item.name}
                    </span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export default FirestoreExample

