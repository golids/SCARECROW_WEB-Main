import { Activity } from 'lucide-react'

export default function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Activity size={22} />
      <p>{text}</p>
    </div>
  )
}