export function GlassCard({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={`glass-card ${className}`}>{children}</div>
}