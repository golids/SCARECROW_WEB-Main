import { ChevronRight } from 'lucide-react'

type Props = {
  title: string
  sub?: string
  action?: string
  onAction?: () => void
}

export default function PanelTitle({
  title,
  sub,
  action,
  onAction,
}: Props) {
  return (
    <div className="panel-title">
      <div>
        <h3>{title}</h3>
        {sub && <p>{sub}</p>}
      </div>

      {action && (
        <button className="text-btn" onClick={onAction}>
          {action}
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  )
}