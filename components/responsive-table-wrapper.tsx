'use client'

import { ReactNode } from 'react'

interface ResponsiveTableWrapperProps {
  desktopTable: ReactNode
  mobileCards: ReactNode
}

export function ResponsiveTableWrapper({ desktopTable, mobileCards }: ResponsiveTableWrapperProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        {desktopTable}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {mobileCards}
      </div>
    </>
  )
}

