import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { FaceData } from '../types/face'
import { EMPTY_FACE } from '../types/face'
import {
  FaceDetectorService,
  type DetectorStatus,
} from '../services/FaceDetectorService'

const INIT_BACKOFF_MS = 2000

export interface FaceDetectionResult {
  status: DetectorStatus
  faceRef: RefObject<FaceData>
  detected: boolean
}

export function useFaceDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
): FaceDetectionResult {
  const serviceRef = useRef(FaceDetectorService.getInstance())
  const faceRef = useRef<FaceData>(EMPTY_FACE)
  const lastTimestamp = useRef(0)
  const lastDetected = useRef(false)
  const [detected, setDetected] = useState(false)
  const [status, setStatus] = useState<DetectorStatus>('uninitialized')
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  const initialize = useCallback(async () => {
    setStatus('loading')
    try {
      await serviceRef.current.initialize()
      setStatus('ready')
    } catch {
      setStatus('failed')
    }
  }, [])

  useEffect(() => {
    if (!active) return

    let rafId = 0
    let attempts = 0
    let disposed = false

    const ensureReady = () => {
      if (disposed) return
      initialize().catch(() => {
        attempts += 1
        if (attempts < 3) {
          window.setTimeout(ensureReady, INIT_BACKOFF_MS * attempts)
        }
      })
    }
    ensureReady()

    const loop = () => {
      const video = videoRef.current

      if (
        serviceRef.current.state.status === 'ready' &&
        video?.readyState === 4
      ) {
        const timestampMs = video.currentTime * 1000
        if (timestampMs > lastTimestamp.current) {
          try {
            faceRef.current = serviceRef.current.detectForVideo(
              video,
              timestampMs,
            )
            lastTimestamp.current = timestampMs

            if (faceRef.current.detected !== lastDetected.current) {
              lastDetected.current = faceRef.current.detected
              setDetected(faceRef.current.detected)
            }
          } catch {
            faceRef.current = { ...EMPTY_FACE, timestamp: timestampMs }
          }
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
    }
  }, [active, initialize, videoRef])

  return { status, faceRef, detected }
}
