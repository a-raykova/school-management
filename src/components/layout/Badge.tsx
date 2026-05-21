interface BadgeProps {
  variant: 'green' | 'red' | 'amber' | 'blue' | 'gray'
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeProps['variant'], string> = {
  green: 'bg-emerald-50 text-emerald-800',
  red:   'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-800',
  blue:  'bg-blue-50 text-blue-700',
  gray:  'bg-gray-100 text-gray-600',
}

export default function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
