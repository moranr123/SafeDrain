const Card = ({ 
  children, 
  className = '',
  hover = false,
  padding = 'default',
  ...props 
}) => {
  const baseStyles = 'bg-bg-surface rounded-xl border border-border shadow-chat'
  
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  }
  
  const hoverStyles = hover ? 'hover:shadow-chat-md transition-shadow duration-200 cursor-pointer' : ''
  
  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card

