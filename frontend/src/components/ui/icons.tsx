export type IconProps = { className?: string }

function base({ className = 'w-5 h-5' }: IconProps) {
  return {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  } as const
}

export function ShoppingBagIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1.5 13h9L18 7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 10a3.5 3.5 0 1 1-7 0" />
    </svg>
  )
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path strokeLinecap="round" d="M3 10h18" />
    </svg>
  )
}

export function GiftIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16v10H4zM4 10h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v14" />
      <path strokeLinecap="round" d="M12 7c-1.5-3-4-3-4-1s1.5 2.5 4 3M12 7c1.5-3 4-3 4-1s-1.5 2.5-4 3" />
    </svg>
  )
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
      />
    </svg>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  )
}

export function FolderIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7z"
      />
    </svg>
  )
}

export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path strokeLinecap="round" d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function CheckBadgeIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m-3-7 2.1 1.9 2.8-.3.8 2.7 2.5 1.3-1 2.6 1 2.6-2.5 1.3-.8 2.7-2.8-.3L12 21l-2.1-1.9-2.8.3-.8-2.7L3.8 15l1-2.6-1-2.6 2.5-1.3.8-2.7 2.8.3z"
      />
    </svg>
  )
}

export function XCircleIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M9 9l6 6M15 9l-6 6" />
    </svg>
  )
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5.5h11v11H3zM14 9h4l3 3v4.5h-7zM7 19.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5zM18 19.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z"
      />
    </svg>
  )
}

export function BanknotesIcon({ className }: IconProps) {
  return (
    <svg {...base({ className })}>
      <rect x="3" y="7" width="18" height="11" rx="2" />
      <circle cx="12" cy="12.5" r="2.5" />
      <path strokeLinecap="round" d="M6.5 10.5v4M17.5 10.5v4" />
    </svg>
  )
}