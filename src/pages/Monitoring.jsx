import { useState, useEffect } from 'react'
import { Droplet, MapPin, Clock, Activity, Thermometer, Search } from 'lucide-react'
import { format } from 'date-fns'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { getDrains, subscribeToDrain } from '../services/drainService'

const Monitoring = () => {
  const [drains, setDrains] = useState([])
  const [selectedDrain, setSelectedDrain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

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

  const handleSearch = () => {
    setSearchQuery(searchInput.trim())
  }

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  const filteredDrains = drains.filter(drain => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = (drain.name || '').toLowerCase()
    const description = (drain.description || '').toLowerCase()
    const location = typeof drain.location === 'string' 
      ? drain.location.toLowerCase()
      : (drain.location?.address || '').toLowerCase()
    const status = (drain.status || '').toLowerCase()
    
    return name.includes(query) || 
           description.includes(query) || 
           location.includes(query) ||
           status.includes(query)
  })

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

      {/* Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col gap-2 sm:gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Search size={16} className="text-text-secondary flex-shrink-0 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder="Search drains..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="flex-1 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleSearch}
              className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5"
            >
              <Search size={16} className="sm:w-5 sm:h-5" />
              <span>Search</span>
            </Button>
            {searchQuery && (
              <Button
                variant="secondary"
                onClick={handleClearSearch}
                className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5"
              >
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
        {searchQuery && (
          <div className="mt-2 text-xs sm:text-sm text-text-secondary">
            Showing {filteredDrains.length} of {drains.length} drains matching "{searchQuery}"
          </div>
        )}
      </Card>

      {/* Drains List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading drains...</div>
        </div>
      ) : filteredDrains.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">
            {searchQuery ? `No drains found matching "${searchQuery}"` : 'No drains registered yet'}
          </p>
          {!searchQuery && drains.length === 0 && (
            <p className="text-sm text-text-muted">Drains will appear here once they are registered</p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDrains.map((drain) => (
            <Card 
              key={drain.id} 
              hover 
              className="transition-all cursor-pointer"
              onClick={() => handleDrainClick(drain)}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                    <h3 className="font-semibold text-text text-sm sm:text-base truncate">{drain.name || 'Unnamed Drain'}</h3>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-xl border font-medium flex-shrink-0 ${getStatusColor(drain.status || 'inactive')}`}>
                      {drain.status || 'inactive'}
                    </span>
                  </div>
                  {drain.location && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary mb-1.5 sm:mb-2">
                      <MapPin size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span className="truncate">{typeof drain.location === 'string' ? drain.location : `${drain.location.latitude?.toFixed(4)}, ${drain.location.longitude?.toFixed(4)}`}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 sm:gap-4 text-xs text-text-muted flex-wrap">
                    {drain.waterLevel !== undefined && (
                      <div className="flex items-center gap-1">
                        <Droplet size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">Water: {drain.waterLevel}%</span>
                      </div>
                    )}
                    {drain.flowRate !== undefined && (
                      <div className="flex items-center gap-1">
                        <Activity size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">Flow: {drain.flowRate} L/min</span>
                      </div>
                    )}
                    {drain.temperature !== undefined && (
                      <div className="flex items-center gap-1">
                        <Thermometer size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">Temp: {drain.temperature}°C</span>
                      </div>
                    )}
                    {drain.updatedAt && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="truncate">
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
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              <div className="p-2.5 sm:p-3 md:p-4 bg-bg rounded-xl">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Droplet className="text-primary" size={14} />
                  <span className="text-xs sm:text-sm font-medium text-text-secondary">Water Level</span>
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-text">
                  {selectedDrain.waterLevel !== undefined 
                    ? `${selectedDrain.waterLevel}%` 
                    : 'N/A'}
                </p>
              </div>

              <div className="p-2.5 sm:p-3 md:p-4 bg-bg rounded-xl">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Activity className="text-primary" size={14} />
                  <span className="text-xs sm:text-sm font-medium text-text-secondary">Flow Rate</span>
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-text">
                  {selectedDrain.flowRate !== undefined 
                    ? `${selectedDrain.flowRate} L/min` 
                    : 'N/A'}
                </p>
              </div>

              <div className="p-2.5 sm:p-3 md:p-4 bg-bg rounded-xl">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Thermometer className="text-primary" size={14} />
                  <span className="text-xs sm:text-sm font-medium text-text-secondary">Temperature</span>
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-text">
                  {selectedDrain.temperature !== undefined 
                    ? `${selectedDrain.temperature}°C` 
                    : 'N/A'}
                </p>
              </div>

              <div className="p-2.5 sm:p-3 md:p-4 bg-bg rounded-xl">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Clock className="text-primary" size={14} />
                  <span className="text-xs sm:text-sm font-medium text-text-secondary">Last Update</span>
                </div>
                <p className="text-xs sm:text-sm text-text break-words">
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

