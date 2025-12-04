import { AlertTriangle, Info, X } from 'lucide-react'
import { format } from 'date-fns'
import Card from './ui/Card'

const AlertCard = ({ alert, onDismiss }) => {
  const getIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="text-red-600" size={20} />
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={20} />
      case 'info':
        return <Info className="text-blue-600" size={20} />
      default:
        return <Info className="text-text-muted" size={20} />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-50/50'
      case 'warning':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50/50'
      case 'info':
        return 'border-l-4 border-l-blue-500 bg-blue-50/50'
      default:
        return 'border-l-4 border-l-border'
    }
  }

  return (
    <Card className={getSeverityColor(alert.severity)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getIcon(alert.severity)}
          <div className="flex-1">
            <h3 className="font-semibold text-text mb-1">{alert.title}</h3>
            <p className="text-sm text-text-secondary mb-2">{alert.message}</p>
            <p className="text-xs text-text-muted">
              {alert.createdAt && format(alert.createdAt, 'MMM d, yyyy h:mm a')}
            </p>
            {alert.drainId && (
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-bg-surface rounded-xl border border-border">
                Drain: {alert.drainId}
              </span>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1 hover:bg-bg rounded-xl transition-colors"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        )}
      </div>
    </Card>
  )
}

export default AlertCard

