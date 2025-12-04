import Card from './ui/Card'

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-text-secondary mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-text break-words">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1 line-clamp-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0 ml-2">
            <Icon className="text-primary" size={20} />
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

