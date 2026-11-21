import { Smartphone } from 'lucide-react'
import type { Device, Language, Translate } from '../types'
import { alive } from '../utils/deviceHelpers'
import { ago } from '../utils/dateHelpers'
import Status from './Status'

type Props = {
  device: Device
  language: Language
  t: Translate
}

export default function DeviceRow({ device, language, t }: Props) {
  return (
    <div className="device-row">
      <div className="device-icon">
        <Smartphone size={19} />
      </div>

      <div className="row-main">
        <b>{device.name}</b>
        <small>
          {device.location || t('locationMissing')} · {ago(device.last_seen, t)}
        </small>
      </div>

      <Status online={alive(device.last_seen)} language={language} />
    </div>
  )
}