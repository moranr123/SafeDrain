import { AlertTriangle, Info, X, Droplet, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
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
    <Card className={`${getSeverityColor(alert.severity)} p-3 sm:p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(alert.severity)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-text mb-1 break-words">{alert.title}</h3>
            <p className="text-xs sm:text-sm text-text-secondary mb-2 break-words">{alert.message}</p>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-2">
              <p className="text-xs text-text-muted">
                {alert.createdAt && format(
                  alert.createdAt instanceof Date 
                    ? alert.createdAt 
                    : alert.createdAt.toDate?.() || new Date(alert.createdAt),
                  'MMM d, yyyy h:mm a'
                )}
              </p>
              {alert.drainId && (
                <Link
                  to="/monitoring"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-bg-surface rounded-xl border border-border hover:bg-bg transition-colors touch-manipulation"
                >
                  <Droplet size={12} />
                  <span className="truncate max-w-[120px] sm:max-w-none">{alert.drainName || `Drain: ${alert.drainId.slice(0, 8)}...`}</span>
                  <ExternalLink size={10} />
                </Link>
              )}
              {alert.type === 'drain-status-change' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-xl border border-primary/20">
                  <Droplet size={12} />
                  Drain Alert
                </span>
              )}
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1.5 sm:p-1 hover:bg-bg rounded-xl transition-colors flex-shrink-0 touch-manipulation"
            aria-label="Dismiss alert"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        )}
      </div>
    </Card>
  )
}

export default AlertCard

