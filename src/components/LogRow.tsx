import { AlertTriangle, Bird } from 'lucide-react'
import type { Language, Log, Translate } from '../types'
import { dateTime } from '../utils/dateHelpers'
import { eventTitle } from '../utils/logHelpers'

type Props = {
  log: Log
  language: Language
  t: Translate
}

export default function LogRow({ log, language, t }: Props) {
  const bird = log.event_type === 'bird_detected'

  return (
    <div className="log-row">
      <div className={`log-icon ${bird ? 'bird' : 'event'}`}>
        {bird ? <Bird size={18} /> : <AlertTriangle size={18} />}
      </div>

      <div className="row-main">
        <b>{eventTitle(log, t)}</b>
        <small>
          {log.devices?.name || t('unknown')} · {log.label}
        </small>
      </div>

      <time>{dateTime(log.created_at, language)}</time>
    </div>
  )
}