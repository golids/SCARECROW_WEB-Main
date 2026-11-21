import type { Language } from '../types'

type Props = {
  online: boolean
  language: Language
}

export default function Status({ online }: Props) {
  return (
    <span className={`status ${online ? 'online' : 'offline'}`}>
      <i />
      {online ? 'Online' : 'Offline'}
    </span>
  )
}