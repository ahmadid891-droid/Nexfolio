import { useId } from 'react'

interface Props {
  className?: string
}

export function BrandLogo({ className = '' }: Props) {
  const rawId = useId()
  const gradId = `brandX-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <span className={`brand-logo inline-flex items-center ${className}`}>
      <span className="brand-logo-word">Ne</span>
      <svg
        className="brand-logo-x"
        viewBox="0 0 32 32"
        role="img"
        aria-label="X"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path
          d="M7 7 L25 25 M25 7 L7 25"
          stroke={`url(#${gradId})`}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="2.4" fill="#a78bfa" />
      </svg>
      <span className="brand-logo-word">folio</span>
    </span>
  )
}
