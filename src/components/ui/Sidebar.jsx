import { Link, useLocation } from 'react-router-dom'
import Logo from '../Logo'

const Sidebar = ({ 
  items = [],
  title = 'Safe Drain',
  isOpen = true,
  onClose,
  className = '' 
}) => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          w-[280px] sm:w-64 bg-bg-surface border-r border-border
          z-[60] lg:z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
      >
        <div className="p-4 sm:p-6 h-full flex flex-col overflow-y-auto">
          {/* Mobile Header */}
          <div className="flex items-center gap-3 mb-6 lg:mb-8 lg:hidden pb-4 border-b border-border">
            <Logo size="md" />
            <h1 className="text-xl font-bold text-text">
              {title}
            </h1>
          </div>
          
          {/* Desktop Header */}
          <div className="flex items-center gap-3 mb-8 hidden lg:flex">
            <Logo size="lg" />
            <h1 className="text-2xl font-bold text-text">
              {title}
            </h1>
          </div>
          
          <nav className="space-y-2 flex-1">
            {items.map((item, index) => {
              if (item.type === 'divider') {
                return <div key={`divider-${index}`} className="h-px bg-border my-2" />
              }
              
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl
                    transition-all duration-200 font-medium text-sm sm:text-base
                    touch-manipulation
                    ${
                      active
                        ? 'bg-primary text-white shadow-chat'
                        : 'text-text-secondary hover:bg-bg hover:text-text active:bg-bg'
                    }
                  `}
                >
                  {Icon && <Icon size={20} className="flex-shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

