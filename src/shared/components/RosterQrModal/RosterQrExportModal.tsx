import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { RosterList } from '@/types'
import { useGameDataContext } from '@/infrastructure/data/GameDataContext'
import { exportRosterToText } from '@/core/utils/rosterExport'
import { encodeRosterForQr, QR_PAYLOAD_WARN_THRESHOLD } from '@/core/utils/rosterQrCode'

interface Props {
  roster: RosterList
  onClose: () => void
}

export function RosterQrExportModal({ roster, onClose }: Props) {
  const { datasheets, factions, detachments, enhancements } = useGameDataContext()
  const [copyState, setCopyState] = useState<'pending' | 'copied' | 'failed'>('pending')

  const text = useMemo(
    () => exportRosterToText(roster, datasheets, factions, detachments, enhancements),
    [roster, datasheets, factions, detachments, enhancements],
  )
  const qrValue = useMemo(() => encodeRosterForQr(roster), [roster])
  const large = qrValue.length > QR_PAYLOAD_WARN_THRESHOLD

  useEffect(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => setCopyState('copied'))
      .catch(() => setCopyState('failed'))
  }, [text])

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface-2 border border-rim-bright w-full max-w-sm max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-crimson shrink-0" />
        <div className="px-4 py-3 border-b border-rim-bright shrink-0">
          <p className="text-[14px] font-display uppercase tracking-[2px] text-parchment truncate">
            {roster.name}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center gap-3">
          <div className="bg-white p-3">
            <QRCodeSVG value={qrValue} size={220} level="M" marginSize={2} />
          </div>

          {copyState === 'copied' && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-parchment-dim text-center">
              ¡Copiado al portapapeles!
            </p>
          )}
          {copyState === 'failed' && (
            <div className="w-full">
              <p className="text-[10px] font-mono uppercase tracking-widest text-crimson-bright text-center mb-2">
                No se pudo copiar — copia el texto manualmente
              </p>
              <textarea
                readOnly
                value={text}
                rows={6}
                onClick={e => e.currentTarget.select()}
                className="w-full bg-surface-3 border border-rim-bright text-parchment text-[10px] font-mono px-2 py-1.5 resize-y"
              />
            </div>
          )}
          {large && (
            <p className="text-[9px] font-mono uppercase tracking-widest text-parchment-dim text-center">
              Lista grande: si el QR no escanea bien, usa el texto ya copiado
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-rim-bright flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 border border-rim-bright text-parchment-dim hover:text-parchment hover:border-crimson transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
