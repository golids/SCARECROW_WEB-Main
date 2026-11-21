import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  label: string
  value: number
  note: string
  tone?: string
}

export default function Stat({
  icon: Icon,
  label,
  value,
  note,
  tone = 'default',
}: Props) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}