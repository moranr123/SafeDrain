import { Menu, X } from 'lucide-react'
import Logo from '../Logo'

const Navbar = ({ 
  title = 'Safe Drain',
  onMenuClick,
  menuOpen = false,
  children,
  className = '' 
}) => {
  return (
    <header className={`
      bg-bg-surface border-b border-border sticky top-0 z-50 lg:z-50
      ${className}
    `}>
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <h1 className="text-xl font-semibold text-text hidden sm:block">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {children}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl hover:bg-bg active:bg-bg transition-colors text-text-secondary lg:hidden touch-manipulation"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar

