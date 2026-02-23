'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number
  onChange: (value: number) => void
  currency?: string
}

/**
 * Pul miqdori inputi: foydalanuvchiga bo'shliqli ko'rinishda ko'rsatadi
 * (masalan "8 500 000"), lekin ichida toza raqam saqlaydi.
 * Foydlanuvchi istalgan formatda (bo'shliq, vergul, nuqta) kiritishi mumkin.
 */
export function CurrencyInput({
  value,
  onChange,
  currency,
  className,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>(
    value > 0 ? formatDisplay(value) : ''
  )
  const [focused, setFocused] = React.useState(false)

  // Agar tashqi value o'zgarganda (masalan reset) — display yangilansin
  React.useEffect(() => {
    if (!focused) {
      setDisplayValue(value > 0 ? formatDisplay(value) : '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Faqat raqam va ajratuvchi belgilarni qoldirish
    const clean = raw.replace(/[^0-9]/g, '')
    const num = clean === '' ? 0 : parseInt(clean, 10)
    setDisplayValue(raw)
    onChange(isNaN(num) ? 0 : num)
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setFocused(false)
    // Blur bo'lganda formatlangan ko'rinishga o'tkazish
    setDisplayValue(value > 0 ? formatDisplay(value) : '')
    props.onBlur?.(e)
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setFocused(true)
    // Focus bo'lganda faqat toza raqam ko'rsatish (osonroq tahrirlash uchun)
    setDisplayValue(value > 0 ? String(value) : '')
    props.onFocus?.(e)
  }

  return (
    <div className="relative flex items-center">
      <input
        {...props}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          currency && 'pr-14',
          className
        )}
      />
      {currency && (
        <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none select-none">
          {currency}
        </span>
      )}
    </div>
  )
}

function formatDisplay(num: number): string {
  return num.toLocaleString('uz-UZ')
}
