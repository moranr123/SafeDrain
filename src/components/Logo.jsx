import logo from '../assets/logo.png'

const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  return (
    <img 
      src={logo} 
      alt="Safe Drain" 
      className={`${sizes[size]} object-contain ${className}`}
    />
  )
}

export default Logo

