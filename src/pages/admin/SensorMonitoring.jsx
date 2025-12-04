import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Activity, Droplet, Thermometer, Gauge } from 'lucide-react'
import { getDrains, addDrain, updateDrain, deleteDrain } from '../../services/drainService'
import { subscribeToCollection } from '../../services/firestoreHelpers'
import { exportSensorsToCSV } from '../../services/exportService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'

const SensorMonitoring = () => {
  const [sensors, setSensors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSensor, setEditingSensor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    status: 'active',
    waterLevel: '',
    flowRate: '',
    temperature: ''
  })

  useEffect(() => {
    // Real-time listener
    const unsubscribe = subscribeToCollection(
      'drains',
      (documents) => {
        setSensors(documents)
        setLoading(false)
      },
      [],
      'createdAt',
      'desc'
    )

    return () => unsubscribe()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const sensorData = {
        ...formData,
        waterLevel: formData.waterLevel ? parseFloat(formData.waterLevel) : undefined,
        flowRate: formData.flowRate ? parseFloat(formData.flowRate) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined
      }

      if (editingSensor) {
        await updateDrain(editingSensor.id, sensorData)
      } else {
        await addDrain(sensorData)
      }

      setShowModal(false)
      setEditingSensor(null)
      setFormData({
        name: '',
        location: '',
        description: '',
        status: 'active',
        waterLevel: '',
        flowRate: '',
        temperature: ''
      })
    } catch (error) {
      console.error('Error saving sensor:', error)
      alert('Failed to save sensor')
    }
  }

  const handleEdit = (sensor) => {
    setEditingSensor(sensor)
    setFormData({
      name: sensor.name || '',
      location: sensor.location || '',
      description: sensor.description || '',
      status: sensor.status || 'active',
      waterLevel: sensor.waterLevel?.toString() || '',
      flowRate: sensor.flowRate?.toString() || '',
      temperature: sensor.temperature?.toString() || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (sensorId) => {
    if (!confirm('Are you sure you want to delete this sensor?')) return

    try {
      await deleteDrain(sensorId)
    } catch (error) {
      console.error('Error deleting sensor:', error)
      alert('Failed to delete sensor')
    }
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
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Sensor Monitoring</h1>
          <p className="text-text-secondary">Manage and monitor drain sensors</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => exportSensorsToCSV(sensors)}
            className="flex items-center gap-2"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditingSensor(null)
              setFormData({
                name: '',
                location: '',
                description: '',
                status: 'active',
                waterLevel: '',
                flowRate: '',
                temperature: ''
              })
              setShowModal(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Sensors Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading sensors...</div>
        </div>
      ) : sensors.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary mb-4">No sensors registered</p>
          <Button onClick={() => setShowModal(true)}>Add First Sensor</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => (
            <Card key={sensor.id} hover>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text mb-1">
                      {sensor.name || 'Unnamed Sensor'}
                    </h3>
                    {sensor.location && (
                      <p className="text-sm text-text-secondary">{sensor.location}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-xl border font-medium ${getStatusColor(sensor.status || 'inactive')}`}>
                    {sensor.status || 'inactive'}
                  </span>
                </div>

                {/* Sensor Readings */}
                <div className="grid grid-cols-2 gap-3">
                  {sensor.waterLevel !== undefined && (
                    <div className="p-3 bg-bg rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplet size={16} className="text-primary" />
                        <span className="text-xs text-text-secondary">Water Level</span>
                      </div>
                      <p className="text-lg font-bold text-text">{sensor.waterLevel}%</p>
                    </div>
                  )}
                  {sensor.flowRate !== undefined && (
                    <div className="p-3 bg-bg rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge size={16} className="text-primary" />
                        <span className="text-xs text-text-secondary">Flow Rate</span>
                      </div>
                      <p className="text-lg font-bold text-text">{sensor.flowRate} L/min</p>
                    </div>
                  )}
                  {sensor.temperature !== undefined && (
                    <div className="p-3 bg-bg rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer size={16} className="text-primary" />
                        <span className="text-xs text-text-secondary">Temperature</span>
                      </div>
                      <p className="text-lg font-bold text-text">{sensor.temperature}°C</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(sensor)}
                    className="flex-1"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(sensor.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingSensor(null)
        }}
        title={editingSensor ? 'Edit Sensor' : 'Add New Sensor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Sensor Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
          />
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </Select>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Water Level (%)"
              type="number"
              name="waterLevel"
              value={formData.waterLevel}
              onChange={handleInputChange}
              min="0"
              max="100"
            />
            <Input
              label="Flow Rate (L/min)"
              type="number"
              name="flowRate"
              value={formData.flowRate}
              onChange={handleInputChange}
              min="0"
            />
            <Input
              label="Temperature (°C)"
              type="number"
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              {editingSensor ? 'Update' : 'Add'} Sensor
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingSensor(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SensorMonitoring

