import { useState, useEffect } from 'react'
import { Droplet, MapPin, Clock, Activity } from 'lucide-react'
import { format } from 'date-fns'
import Card from '../components/ui/Card'
import { getDrains, subscribeToDrain } from '../services/drainService'

const Monitoring = () => {
  const [drains, setDrains] = useState([])
  const [selectedDrain, setSelectedDrain] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDrains = async () => {
      try {
        const drainsData = await getDrains()
        setDrains(drainsData)
        if (drainsData.length > 0) {
          setSelectedDrain(drainsData[0].id)
        }
      } catch (error) {
        console.error('Error fetching drains:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDrains()
  }, [])

  useEffect(() => {
    if (!selectedDrain) return

    const unsubscribe = subscribeToDrain(selectedDrain, (drainData) => {
      setDrains(prev => prev.map(d => d.id === drainData.id ? drainData : d))
    })

    return () => unsubscribe()
  }, [selectedDrain])

  const currentDrain = drains.find(d => d.id === selectedDrain)

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Monitoring</h1>
        <p className="text-text-secondary">Real-time drain monitoring and status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drain List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-semibold text-text mb-4">Drains</h2>
          {drains.length > 0 ? (
            drains.map((drain) => (
              <button
                key={drain.id}
                onClick={() => setSelectedDrain(drain.id)}
                className="w-full text-left"
              >
                <Card className={selectedDrain === drain.id ? 'ring-2 ring-primary' : ''} hover>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-text">{drain.name || 'Unnamed Drain'}</h3>
                    <span className={`px-2 py-1 text-xs rounded-xl border ${getStatusColor(drain.status || 'inactive')}`}>
                      {drain.status || 'inactive'}
                    </span>
                  </div>
                  {drain.location && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin size={14} />
                      <span>{drain.location}</span>
                    </div>
                  )}
                </Card>
              </button>
            ))
          ) : (
            <Card className="text-center py-8 text-text-muted">
              No drains registered yet
            </Card>
          )}
        </div>

        {/* Drain Details */}
        <div className="lg:col-span-2">
          {currentDrain ? (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-text mb-1">
                      {currentDrain.name || 'Unnamed Drain'}
                    </h2>
                    {currentDrain.location && (
                      <p className="text-text-secondary flex items-center gap-2">
                        <MapPin size={16} />
                        {currentDrain.location}
                      </p>
                    )}
                  </div>
                  <span className={`px-4 py-2 rounded-xl border font-medium ${getStatusColor(currentDrain.status || 'inactive')}`}>
                    {currentDrain.status || 'inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-bg rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplet className="text-primary" size={20} />
                      <span className="text-sm font-medium text-text-secondary">Water Level</span>
                    </div>
                    <p className="text-2xl font-bold text-text">
                      {currentDrain.waterLevel !== undefined 
                        ? `${currentDrain.waterLevel}%` 
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 bg-bg rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="text-primary" size={20} />
                      <span className="text-sm font-medium text-text-secondary">Flow Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-text">
                      {currentDrain.flowRate !== undefined 
                        ? `${currentDrain.flowRate} L/min` 
                        : 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 bg-bg rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-primary" size={20} />
                      <span className="text-sm font-medium text-text-secondary">Last Update</span>
                    </div>
                    <p className="text-sm text-text">
                      {currentDrain.updatedAt 
                        ? format(currentDrain.updatedAt.toDate(), 'MMM d, yyyy h:mm a')
                        : 'Never'}
                    </p>
                  </div>

                  <div className="p-4 bg-bg rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="text-primary" size={20} />
                      <span className="text-sm font-medium text-text-secondary">Temperature</span>
                    </div>
                    <p className="text-2xl font-bold text-text">
                      {currentDrain.temperature !== undefined 
                        ? `${currentDrain.temperature}°C` 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              {currentDrain.description && (
                <Card>
                  <h3 className="font-semibold text-text mb-2">Description</h3>
                  <p className="text-text-secondary">{currentDrain.description}</p>
                </Card>
              )}
            </div>
          ) : (
            <Card className="text-center py-12 text-text-muted">
              Select a drain to view details
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Monitoring

