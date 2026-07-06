import { useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import type { RosterList } from '@/types'
import { decodeRosterFromQr } from '@/core/utils/rosterQrCode'

interface Props {
  onScan: (decoded: Omit<RosterList, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

export function RosterQrScanModal({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(() =>
    window.isSecureContext ? null : 'El escáner de cámara requiere una conexión segura (HTTPS).',
  )

  useEffect(() => {
    if (!window.isSecureContext) return
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    const scanner = new QrScanner(
      video,
      result => {
        try {
          const roster = decodeRosterFromQr(result.data)
          onScan(roster)
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Error al leer el código QR')
        }
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      },
    )

    scanner.start().catch((err: unknown) => {
      if (cancelled) return
      const name = err instanceof Error ? err.name : ''
      if (name === 'NotAllowedError') setError('Permiso de cámara denegado.')
      else if (name === 'NotFoundError') setError('No se encontró ninguna cámara.')
      else setError('No se pudo acceder a la cámara.')
    })

    return () => {
      cancelled = true
      scanner.stop()
      scanner.destroy()
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface-2 border border-rim-bright w-full max-w-sm max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-crimson shrink-0" />
        <div className="px-4 py-3 border-b border-rim-bright shrink-0">
          <p className="text-[14px] font-display uppercase tracking-[2px] text-parchment">
            Escanear QR
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center gap-3">
          <video ref={videoRef} playsInline muted className="w-full bg-black" />
          {error && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-crimson-bright text-center">
              {error}
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
