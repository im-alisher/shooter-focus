import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { FaceData } from '../types/face'
import { EMPTY_FACE } from '../types/face'
import type { TrackedTarget, TrackingOptions } from '../types/tracking'
import { EMPTY_TARGET } from '../types/tracking'
import {
  FaceDetectorService,
  type DetectorStatus,
} from '../services/FaceDetectorService'
import { TrackingEngine } from '../services/TrackingEngine'

const INIT_BACKOFF_MS = 2000

export interface HeadTrackingResult {
  status: DetectorStatus
  faceRef: RefObject<FaceData>
  targetRef: RefObject<TrackedTarget>
  detected: boolean
  locked: boolean
}

export function useHeadTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
  options?: Partial<TrackingOptions>,
): HeadTrackingResult {
  const serviceRef = useRef(FaceDetectorService.getInstance())
  const engineRef = useRef<TrackingEngine | null>(null)
  const optionsRef = useRef<Partial<TrackingOptions>>(options)
  const faceRef = useRef<FaceData>(EMPTY_FACE)
  const targetRef = useRef<TrackedTarget>(EMPTY_TARGET)
  const lastTimestamp = useRef(0)
  const lastDetected = useRef(false)
  const lastLocked = useRef(false)
  const [detected, setDetected] = useState(false)
  const [locked, setLocked] = useState(false)
  const [status, setStatus] = useState<DetectorStatus>('uninitialized')
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    optionsRef.current = options
    engineRef.current?.setOptions(options ?? {})
  }, [options])

  const initialize = useCallback(async () => {
    setStatus('loading')
    try {
      await serviceRef.current.initialize()
      engineRef.current = new TrackingEngine(optionsRef.current)
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
      const nowMs = performance.now()

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

      if (engineRef.current) {
        targetRef.current = engineRef.current.update(faceRef.current, nowMs)
        if (targetRef.current.locked !== lastLocked.current) {
          lastLocked.current = targetRef.current.locked
          setLocked(targetRef.current.locked)
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

  return { status, faceRef, targetRef, detected, locked }
}
