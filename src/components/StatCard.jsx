import Card from './ui/Card'

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => {
  return (
    <Card className="h-full p-3 sm:p-4">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs sm:text-sm text-text-secondary mb-0.5 sm:mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-text break-words leading-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5 sm:mt-1 line-clamp-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-1.5 sm:p-2 md:p-3 bg-primary/10 rounded-xl flex-shrink-0">
            <Icon className="text-primary" size={18} />
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className={`text-xs sm:text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
    </Card>
  )
}

export default StatCard

