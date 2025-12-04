import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Generic Firestore helper functions
 */

// Get a single document
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        // Convert Firestore timestamps to dates
        ...(docSnap.data().createdAt && {
          createdAt: docSnap.data().createdAt.toDate()
        }),
        ...(docSnap.data().updatedAt && {
          updatedAt: docSnap.data().updatedAt.toDate()
        })
      }
    }
    return null
  } catch (error) {
    console.error(`Error getting document ${docId}:`, error)
    throw error
  }
}

// Get all documents from a collection
export const getDocuments = async (
  collectionName,
  filters = [],
  orderByField = null,
  orderDirection = 'desc',
  limitCount = null
) => {
  try {
    let q = collection(db, collectionName)
    
    // Apply filters
    if (filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value))
      })
    }
    
    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection))
    }
    
    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to dates
      ...(doc.data().createdAt && {
        createdAt: doc.data().createdAt.toDate()
      }),
      ...(doc.data().updatedAt && {
        updatedAt: doc.data().updatedAt.toDate()
      })
    }))
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error)
    throw error
  }
}

// Add a new document
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error)
    throw error
  }
}

// Update a document
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error(`Error updating document ${docId}:`, error)
    throw error
  }
}

// Delete a document
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(`Error deleting document ${docId}:`, error)
    throw error
  }
}

// Real-time listener for a single document
export const subscribeToDocument = (collectionName, docId, callback) => {
  const docRef = doc(db, collectionName, docId)
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = {
        id: docSnap.id,
        ...docSnap.data(),
        ...(docSnap.data().createdAt && {
          createdAt: docSnap.data().createdAt.toDate()
        }),
        ...(docSnap.data().updatedAt && {
          updatedAt: docSnap.data().updatedAt.toDate()
        })
      }
      callback(data)
    } else {
      callback(null)
    }
  }, (error) => {
    console.error(`Error in document subscription:`, error)
    callback(null, error)
  })
}

// Real-time listener for a collection
export const subscribeToCollection = (
  collectionName,
  callback,
  filters = [],
  orderByField = null,
  orderDirection = 'desc',
  limitCount = null
) => {
  let q = collection(db, collectionName)
  
  // Apply filters
  if (filters.length > 0) {
    filters.forEach(filter => {
      q = query(q, where(filter.field, filter.operator, filter.value))
    })
  }
  
  // Apply ordering
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection))
  }
  
  // Apply limit
  if (limitCount) {
    q = query(q, limit(limitCount))
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      ...(doc.data().createdAt && {
        createdAt: doc.data().createdAt.toDate()
      }),
      ...(doc.data().updatedAt && {
        updatedAt: doc.data().updatedAt.toDate()
      })
    }))
    callback(documents)
  }, (error) => {
    console.error(`Error in collection subscription:`, error)
    callback([], error)
  })
}

// Batch write operations
export const batchWrite = async (operations) => {
  try {
    const batch = writeBatch(db)
    
    operations.forEach(operation => {
      const { type, collectionName, docId, data } = operation
      const docRef = doc(db, collectionName, docId)
      
      switch (type) {
        case 'set':
          batch.set(docRef, data)
          break
        case 'update':
          batch.update(docRef, data)
          break
        case 'delete':
          batch.delete(docRef)
          break
        default:
          throw new Error(`Unknown operation type: ${type}`)
      }
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error in batch write:', error)
    throw error
  }
}

// Increment a numeric field
export const incrementField = async (collectionName, docId, field, amount = 1) => {
  try {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, {
      [field]: increment(amount)
    })
  } catch (error) {
    console.error(`Error incrementing field ${field}:`, error)
    throw error
  }
}

// Pagination helper
export const getDocumentsPaginated = async (
  collectionName,
  pageSize = 10,
  lastDoc = null,
  filters = [],
  orderByField = 'createdAt',
  orderDirection = 'desc'
) => {
  try {
    let q = collection(db, collectionName)
    
    // Apply filters
    if (filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value))
      })
    }
    
    // Apply ordering
    q = query(q, orderBy(orderByField, orderDirection))
    
    // Apply pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    q = query(q, limit(pageSize))
    
    const querySnapshot = await getDocs(q)
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      ...(doc.data().createdAt && {
        createdAt: doc.data().createdAt.toDate()
      }),
      ...(doc.data().updatedAt && {
        updatedAt: doc.data().updatedAt.toDate()
      })
    }))
    
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
    
    return {
      documents,
      lastDoc: lastVisible,
      hasMore: querySnapshot.docs.length === pageSize
    }
  } catch (error) {
    console.error('Error in paginated query:', error)
    throw error
  }
}

