import { useState, useEffect } from 'react'
import { Droplet, MapPin, Clock, Activity, Thermometer } from 'lucide-react'
import { format } from 'date-fns'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import { getDrains, subscribeToDrain } from '../services/drainService'

const Monitoring = () => {
  const [drains, setDrains] = useState([])
  const [selectedDrain, setSelectedDrain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchDrains = async () => {
      try {
        const drainsData = await getDrains()
        setDrains(drainsData)
      } catch (error) {
        console.error('Error fetching drains:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDrains()
  }, [])

  // Subscribe to real-time updates for all drains
  useEffect(() => {
    const unsubscribes = drains.map(drain => {
      return subscribeToDrain(drain.id, (drainData) => {
        setDrains(prev => prev.map(d => d.id === drainData.id ? drainData : d))
      })
    })

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe())
    }
  }, [drains.length]) // Only re-subscribe when number of drains changes

  const handleDrainClick = (drain) => {
    setSelectedDrain(drain)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedDrain(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-bg text-text-secondary border-border'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1 sm:mb-2">Monitoring</h1>
        <p className="text-sm sm:text-base text-text-secondary">Real-time drain monitoring and status</p>
      </div>

      {/* Drains List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading drains...</div>
        </div>
      ) : drains.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary">No drains registered yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {drains.map((drain) => (
            <Card 
              key={drain.id} 
              hover 
              className="transition-all cursor-pointer"
              onClick={() => handleDrainClick(drain)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-text">{drain.name || 'Unnamed Drain'}</h3>
                    <span className={`px-2 py-1 text-xs rounded-xl border font-medium ${getStatusColor(drain.status || 'inactive')}`}>
                      {drain.status || 'inactive'}
                    </span>
                  </div>
                  {drain.location && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                      <MapPin size={14} />
                      <span>{typeof drain.location === 'string' ? drain.location : `${drain.location.latitude?.toFixed(4)}, ${drain.location.longitude?.toFixed(4)}`}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                    {drain.waterLevel !== undefined && (
                      <div className="flex items-center gap-1">
                        <Droplet size={14} />
                        <span>Water: {drain.waterLevel}%</span>
                      </div>
                    )}
                    {drain.flowRate !== undefined && (
                      <div className="flex items-center gap-1">
                        <Activity size={14} />
                        <span>Flow: {drain.flowRate} L/min</span>
                      </div>
                    )}
                    {drain.temperature !== undefined && (
                      <div className="flex items-center gap-1">
                        <Thermometer size={14} />
                        <span>Temp: {drain.temperature}°C</span>
                      </div>
                    )}
                    {drain.updatedAt && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>
                          {format(
                            drain.updatedAt instanceof Date 
                              ? drain.updatedAt 
                              : drain.updatedAt.toDate?.() || new Date(drain.updatedAt),
                            'MMM d, yyyy h:mm a'
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Drain Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedDrain?.name || 'Drain Details'}
        size="xl"
      >
        {selectedDrain && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs rounded-xl border font-medium ${getStatusColor(selectedDrain.status || 'inactive')}`}>
                {selectedDrain.status || 'inactive'}
              </span>
            </div>

            {/* Location */}
            {selectedDrain.location && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                  <MapPin size={18} />
                  Location
                </h3>
                <p className="text-sm text-text-secondary">
                  {typeof selectedDrain.location === 'string' 
                    ? selectedDrain.location 
                    : `${selectedDrain.location.latitude?.toFixed(6)}, ${selectedDrain.location.longitude?.toFixed(6)}`}
                </p>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="p-3 sm:p-4 bg-bg rounded-xl">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Droplet className="text-primary" size={16} />
                  <span className="text-xs sm:text-sm font-medium text-text-secondary">Water Level</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-text">
                  {selectedDrain.waterLevel !== undefined 
                    ? `${selectedDrain.waterLevel}%` 
                    : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-bg rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="text-primary" size={20} />
                  <span className="text-sm font-medium text-text-secondary">Flow Rate</span>
                </div>
                <p className="text-2xl font-bold text-text">
                  {selectedDrain.flowRate !== undefined 
                    ? `${selectedDrain.flowRate} L/min` 
                    : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-bg rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="text-primary" size={20} />
                  <span className="text-sm font-medium text-text-secondary">Temperature</span>
                </div>
                <p className="text-2xl font-bold text-text">
                  {selectedDrain.temperature !== undefined 
                    ? `${selectedDrain.temperature}°C` 
                    : 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-bg rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-primary" size={20} />
                  <span className="text-sm font-medium text-text-secondary">Last Update</span>
                </div>
                <p className="text-sm text-text">
                  {selectedDrain.updatedAt 
                    ? format(
                        selectedDrain.updatedAt instanceof Date 
                          ? selectedDrain.updatedAt 
                          : selectedDrain.updatedAt.toDate?.() || new Date(selectedDrain.updatedAt),
                        'MMM d, yyyy h:mm a'
                      )
                    : 'Never'}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedDrain.description && (
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-text mb-2">Description</h3>
                <p className="text-text-secondary">{selectedDrain.description}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-text mb-3">Additional Information</h3>
              <div className="space-y-2 text-sm">
                {selectedDrain.id && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className="font-medium">ID:</span>
                    <span className="font-mono text-xs">{selectedDrain.id}</span>
                  </div>
                )}
                {selectedDrain.createdAt && (
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock size={16} />
                    <span>
                      Created: {format(
                        selectedDrain.createdAt instanceof Date 
                          ? selectedDrain.createdAt 
                          : selectedDrain.createdAt.toDate?.() || new Date(selectedDrain.createdAt),
                        'MMM d, yyyy h:mm a'
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Monitoring

