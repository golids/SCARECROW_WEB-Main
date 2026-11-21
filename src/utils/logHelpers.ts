import type { Log } from '../types'

export function eventTitle(
  log: Log,
  t: (key: string) => string
) {
  if (log.event_type === 'bird_detected') {
    return log.species || log.label || t('birdDetected')
  }

  return (log.event_type || 'event')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, x => x.toUpperCase())
}