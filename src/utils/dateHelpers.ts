import type { Language } from '../types'

export function ago(
  value: string | null,
  t: (key: string) => string
) {
  if (!value) return t('never')

  const sec = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  )

  if (sec < 60) return t('justNow')
  if (sec < 3600) return `${Math.floor(sec / 60)} ${t('minAgo')}`
  if (sec < 86400) return `${Math.floor(sec / 3600)} ${t('hrAgo')}`

  return `${Math.floor(sec / 86400)} ${t('daysAgo')}`
}

export function dateTime(value: string, language: Language) {
  return new Date(value).toLocaleString(
    language === 'ceb' ? 'en-PH' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  )
}