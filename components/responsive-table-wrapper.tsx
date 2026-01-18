'use client'

import { ReactNode } from 'react'

interface ResponsiveTableWrapperProps {
  desktopContent: ReactNode
  mobileContent: ReactNode
}

export function ResponsiveTableWrapper({ desktopContent, mobileContent }: ResponsiveTableWrapperProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        {desktopContent}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {mobileContent}
      </div>
    </>
  )
}

