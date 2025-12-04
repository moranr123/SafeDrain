import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'

const DRAINS_COLLECTION = 'drains'
const READINGS_COLLECTION = 'readings'
const ALERTS_COLLECTION = 'alerts'

// Drain Management
export const getDrains = async () => {
  try {
    const q = query(collection(db, DRAINS_COLLECTION), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching drains:', error)
    throw error
  }
}

export const getDrain = async (drainId) => {
  try {
    const docRef = doc(db, DRAINS_COLLECTION, drainId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error) {
    console.error('Error fetching drain:', error)
    throw error
  }
}

export const addDrain = async (drainData) => {
  try {
    const docRef = await addDoc(collection(db, DRAINS_COLLECTION), {
      ...drainData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding drain:', error)
    throw error
  }
}

export const updateDrain = async (drainId, updateData) => {
  try {
    const docRef = doc(db, DRAINS_COLLECTION, drainId)
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error updating drain:', error)
    throw error
  }
}

export const deleteDrain = async (drainId) => {
  try {
    await deleteDoc(doc(db, DRAINS_COLLECTION, drainId))
  } catch (error) {
    console.error('Error deleting drain:', error)
    throw error
  }
}

// Real-time drain monitoring
export const subscribeToDrain = (drainId, callback) => {
  const docRef = doc(db, DRAINS_COLLECTION, drainId)
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() })
    }
  })
}

// Sensor Readings
export const getReadings = async (drainId, limitCount = 100) => {
  try {
    const q = query(
      collection(db, READINGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }))
      .filter(reading => !drainId || reading.drainId === drainId)
  } catch (error) {
    console.error('Error fetching readings:', error)
    throw error
  }
}

export const addReading = async (readingData) => {
  try {
    const docRef = await addDoc(collection(db, READINGS_COLLECTION), {
      ...readingData,
      timestamp: Timestamp.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding reading:', error)
    throw error
  }
}

// Real-time readings subscription
export const subscribeToReadings = (drainId, callback) => {
  const q = query(
    collection(db, READINGS_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(50)
  )
  return onSnapshot(q, (querySnapshot) => {
    const readings = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }))
      .filter(reading => !drainId || reading.drainId === drainId)
    callback(readings)
  })
}

// Alerts
export const getAlerts = async () => {
  try {
    const q = query(collection(db, ALERTS_COLLECTION), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }))
  } catch (error) {
    console.error('Error fetching alerts:', error)
    throw error
  }
}

export const addAlert = async (alertData) => {
  try {
    const docRef = await addDoc(collection(db, ALERTS_COLLECTION), {
      ...alertData,
      createdAt: Timestamp.now(),
      read: false
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding alert:', error)
    throw error
  }
}

export const markAlertAsRead = async (alertId) => {
  try {
    const docRef = doc(db, ALERTS_COLLECTION, alertId)
    await updateDoc(docRef, { read: true })
  } catch (error) {
    console.error('Error marking alert as read:', error)
    throw error
  }
}

