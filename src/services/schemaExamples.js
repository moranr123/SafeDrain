/**
 * Firestore Schema Examples
 * Use these as templates when creating documents
 */

// Example: Create a user
export const createUserExample = {
  email: 'user@example.com',
  displayName: 'John Doe',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  profile: {
    phone: '+1234567890',
    organization: 'City Maintenance',
    avatar: null
  },
  preferences: {
    notifications: true,
    emailAlerts: true,
    theme: 'light'
  },
  stats: {
    reportsSubmitted: 0,
    reportsResolved: 0
  }
}

// Example: Create a report
export const createReportExample = {
  userId: 'user123',
  title: 'Blocked Drain on Main Street',
  description: 'Drain is completely blocked with debris.',
  severity: 'high',
  status: 'pending',
  location: {
    latitude: 14.5995,
    longitude: 120.9842,
    accuracy: 10,
    address: '123 Main Street'
  },
  photos: [],
  assignedTo: null,
  priority: 7,
  category: 'blockage',
  tags: ['urgent', 'main-street'],
  createdAt: new Date(),
  updatedAt: new Date(),
  resolvedAt: null,
  resolvedBy: null,
  resolutionNotes: null,
  offline: false,
  synced: true
}

// Example: Create a sensor
export const createSensorExample = {
  name: 'Drain Sensor #001',
  location: {
    latitude: 14.5995,
    longitude: 120.9842,
    address: 'Building A, Floor 1'
  },
  status: 'active',
  type: 'multi',
  readings: {
    waterLevel: 75,
    flowRate: 12.5,
    temperature: 25,
    lastReadingAt: new Date()
  },
  thresholds: {
    waterLevel: {
      warning: 80,
      critical: 95
    },
    flowRate: {
      min: 5,
      max: 20
    }
  },
  metadata: {
    installationDate: new Date(),
    lastMaintenance: new Date(),
    batteryLevel: 85,
    signalStrength: 92
  },
  createdAt: new Date(),
  updatedAt: new Date()
}

// Example: Create an alert
export const createAlertExample = {
  type: 'sensor',
  severity: 'critical',
  title: 'High Water Level Alert',
  message: 'Sensor detected water level at 96%',
  source: {
    type: 'sensor',
    id: 'sensor001'
  },
  read: false,
  readBy: null,
  readAt: null,
  acknowledged: false,
  acknowledgedBy: null,
  acknowledgedAt: null,
  resolved: false,
  resolvedBy: null,
  resolvedAt: null,
  createdAt: new Date(),
  expiresAt: null,
  metadata: {
    sensorName: 'Drain Sensor #001',
    waterLevel: 96,
    threshold: 95
  }
}

// Example: Create activity log
export const createActivityLogExample = {
  userId: 'user123',
  action: 'create_report',
  resourceType: 'report',
  resourceId: 'report456',
  details: {
    title: 'Blocked Drain',
    severity: 'high'
  },
  ipAddress: '192.168.1.100',
  userAgent: navigator.userAgent,
  timestamp: new Date(),
  success: true,
  errorMessage: null
}

// Example: Create offline queue item
export const createOfflineQueueExample = {
  userId: 'user123',
  operationType: 'create',
  collection: 'reports',
  data: {
    title: 'Blocked Drain',
    description: 'Drain is blocked',
    severity: 'high'
  },
  documentId: null,
  timestamp: new Date(),
  synced: false,
  syncedAt: null,
  retryCount: 0,
  error: null,
  priority: 5
}

