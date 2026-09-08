import { useCallback, useEffect, useRef, useState } from 'react'
import type { WebcamError, WebcamStatus } from '../types/webcam'
import type { CameraSettings } from '../types/webcam'

const DEFAULT_SETTINGS: CameraSettings = {
  width: 1280,
  height: 720,
  facingMode: 'user',
}

function mapError(error: unknown): WebcamError {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          name: 'not-allowed',
          message: 'Camera permission was denied. Allow access to continue.',
        }
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          name: 'not-found',
          message: 'No camera was found on this device.',
        }
      case 'NotReadableError':
      case 'TrackStartError':
        return {
          name: 'unavailable',
          message: 'The camera is currently in use by another application.',
        }
      case 'OverconstrainedError':
        return {
          name: 'unavailable',
          message: 'The requested camera settings are not supported.',
        }
      default:
        return {
          name: 'unknown',
          message: `Camera error: ${error.message}`,
        }
    }
  }
  return {
    name: 'unknown',
    message: error instanceof Error ? error.message : 'Unknown camera error',
  }
}

export function useWebcam(settings: CameraSettings = DEFAULT_SETTINGS) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<WebcamStatus>('idle')
  const [error, setError] = useState<WebcamError | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setStatus('permission')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: settings.width },
          height: { ideal: settings.height },
          facingMode: settings.facingMode,
        },
        audio: false,
      })

      stopStream()
      streamRef.current = stream

      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')
        await video.play()
      }

      setStatus('ready')
    } catch (caught) {
      stopStream()
      setError(mapError(caught))
      setStatus('error')
    }
  }, [settings, stopStream])

  const stop = useCallback(() => {
    stopStream()
    setStatus('idle')
    setError(null)
  }, [stopStream])

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [stopStream])

  return { videoRef, status, error, start, stop }
}
