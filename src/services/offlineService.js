/**
 * Offline Service - Queue data and sync when online
 * Uses IndexedDB for local storage
 */

const DB_NAME = 'SafeDrainOfflineDB'
const DB_VERSION = 1
const STORE_NAME = 'pendingOperations'

let db = null

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// Check if online
export const isOnline = () => {
  return navigator.onLine
}

// Listen for online/offline events
export const onOnlineStatusChange = (callback) => {
  window.addEventListener('online', () => callback(true))
  window.addEventListener('offline', () => callback(false))
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

// Queue an operation for later sync
export const queueOperation = async (operation) => {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const queuedOp = {
      ...operation,
      timestamp: new Date().toISOString(),
      synced: false
    }

    await store.add(queuedOp)
    return queuedOp.id
  } catch (error) {
    console.error('Error queueing operation:', error)
    throw error
  }
}

// Get all pending operations
export const getPendingOperations = async () => {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const operations = request.result.filter(op => !op.synced)
        resolve(operations)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error getting pending operations:', error)
    return []
  }
}

// Mark operation as synced
export const markAsSynced = async (operationId) => {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const getRequest = store.get(operationId)
      getRequest.onsuccess = () => {
        const operation = getRequest.result
        if (operation) {
          operation.synced = true
          operation.syncedAt = new Date().toISOString()
          const putRequest = store.put(operation)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  } catch (error) {
    console.error('Error marking operation as synced:', error)
    throw error
  }
}

// Delete synced operation
export const deleteOperation = async (operationId) => {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    await store.delete(operationId)
  } catch (error) {
    console.error('Error deleting operation:', error)
    throw error
  }
}

// Sync all pending operations
export const syncPendingOperations = async (syncFunction) => {
  if (!isOnline()) {
    console.log('Offline - cannot sync')
    return { synced: 0, failed: 0 }
  }

  try {
    const pendingOps = await getPendingOperations()
    let synced = 0
    let failed = 0

    for (const operation of pendingOps) {
      try {
        await syncFunction(operation)
        await markAsSynced(operation.id)
        synced++
      } catch (error) {
        console.error('Error syncing operation:', error)
        failed++
      }
    }

    // Clean up old synced operations (older than 7 days)
    const database = await initDB()
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const allOps = await new Promise((resolve) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
    })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    for (const op of allOps) {
      if (op.synced && op.syncedAt) {
        const syncedDate = new Date(op.syncedAt)
        if (syncedDate < sevenDaysAgo) {
          await deleteOperation(op.id)
        }
      }
    }

    return { synced, failed }
  } catch (error) {
    console.error('Error syncing operations:', error)
    return { synced: 0, failed: 0 }
  }
}

// Get sync status
export const getSyncStatus = async () => {
  const pending = await getPendingOperations()
  return {
    isOnline: isOnline(),
    pendingCount: pending.length,
    hasPending: pending.length > 0
  }
}

