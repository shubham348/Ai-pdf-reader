import { useEffect, useState } from 'react'

function CollapsiblePanel({
  actions = null,
  bodyClassName = '',
  children,
  className = '',
  defaultDesktopOpen = true,
  defaultMobileOpen = true,
  onOpenChange,
  open,
  showToggleOnDesktop = false,
  title,
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 980)
  const [isOpen, setIsOpen] = useState(() =>
    window.innerWidth <= 980 ? defaultMobileOpen : defaultDesktopOpen,
  )

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 980
      const nextOpen = mobile ? defaultMobileOpen : defaultDesktopOpen
      setIsMobile(mobile)
      setIsOpen(nextOpen)
      onOpenChange?.(nextOpen, mobile)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [defaultDesktopOpen, defaultMobileOpen, onOpenChange])

  const showBody = open ?? isOpen
  const shouldShowToggle = isMobile || showToggleOnDesktop

  return (
    <section
      className={`collapsible-panel ${className} ${showBody ? 'is-open' : 'is-collapsed'}`.trim()}
    >
      <div className="collapsible-header">
        <div className="collapsible-title-group">
          <h2 className="collapsible-title">{title}</h2>
          {actions ? <div className="collapsible-actions">{actions}</div> : null}
        </div>
        {shouldShowToggle ? (
          <button
            type="button"
            className="collapsible-toggle"
            onClick={() => {
              setIsOpen((open) => {
                const currentOpen = open ?? isOpen
                const nextOpen = !currentOpen
                onOpenChange?.(nextOpen, isMobile)
                return nextOpen
              })
            }}
            aria-expanded={showBody}
            aria-label={showBody ? `Collapse ${title}` : `Expand ${title}`}
            title={showBody ? `Collapse ${title}` : `Expand ${title}`}
          >
            <span className="collapsible-toggle-icon" aria-hidden="true">
              {showBody ? '−' : '+'}
            </span>
          </button>
        ) : null}
      </div>
      {showBody ? <div className={bodyClassName}>{children}</div> : null}
    </section>
  )
}

export default CollapsiblePanel
