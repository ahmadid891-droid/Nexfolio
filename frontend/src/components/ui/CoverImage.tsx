interface Props {
  src?: string | null
  alt: string
  className?: string
  markClassName?: string
}

export function CoverImage({
  src,
  alt,
  className = '',
  markClassName = 'w-12 h-12 opacity-90',
}: Props) {
  if (src) {
    return <img src={src} alt={alt} className={className} />
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-cyan-900/40`}
    >
      <img src="/favicon.svg" alt="Nexfolio" className={markClassName} />
    </div>
  )
}
