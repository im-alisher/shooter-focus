import { useEffect, useRef, useState, type RefObject } from 'react'
import type { FaceData } from '../types/face'
import { EMPTY_FACE } from '../types/face'
import type { TrackedTarget, TrackingOptions } from '../types/tracking'
import { EMPTY_TARGET } from '../types/tracking'
import {
  FaceDetectorService,
  type DetectorStatus,
} from '../services/FaceDetectorService'
import { TrackingEngine } from '../services/TrackingEngine'
import { FpsTracker } from '../utils/fps'

const INIT_BACKOFF_MS = 2000
const FPS_UPDATE_INTERVAL_MS = 1000

export interface HeadTrackingResult {
  status: DetectorStatus
  faceRef: RefObject<FaceData>
  targetRef: RefObject<TrackedTarget>
  detected: boolean
  locked: boolean
  fps: number
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
  const lastVideoTime = useRef(-1)
  const lastDetected = useRef(false)
  const lastLocked = useRef(false)
  const fpsTrackerRef = useRef(new FpsTracker())
  const lastFpsUpdate = useRef(0)
  const [detected, setDetected] = useState(false)
  const [locked, setLocked] = useState(false)
  const [status, setStatus] = useState<DetectorStatus>('uninitialized')
  const [fps, setFps] = useState(0)
  useEffect(() => {
    optionsRef.current = options
    engineRef.current?.setOptions(options ?? {})
  }, [options])

  useEffect(() => {
    if (!active) return

    let rafId = 0
    let retryId: number | undefined
    let attempts = 0
    let disposed = false
    const model = options?.detectionMode ?? 'short'

    faceRef.current = EMPTY_FACE
    targetRef.current = EMPTY_TARGET
    lastVideoTime.current = -1
    engineRef.current = null

    const ensureReady = async () => {
      if (disposed) return
      setStatus('loading')
      try {
        await serviceRef.current.setModel(model)
        if (disposed) return
        engineRef.current = new TrackingEngine(optionsRef.current)
        setStatus('ready')
      } catch (error) {
        if (disposed) return
        setStatus('failed')
        console.error('Face detector initialization failed:', error)
        attempts += 1
        if (attempts < 3) {
          retryId = window.setTimeout(() => {
            void ensureReady()
          }, INIT_BACKOFF_MS * attempts)
        }
      }
    }
    void ensureReady()

    const loop = () => {
      const video = videoRef.current
      const nowMs = performance.now()
      const fpsNow = fpsTrackerRef.current.tick(nowMs)

      if (nowMs - lastFpsUpdate.current >= FPS_UPDATE_INTERVAL_MS) {
        lastFpsUpdate.current = nowMs
        setFps(Math.round(fpsNow))
      }

      if (
        !document.hidden &&
        serviceRef.current.state.status === 'ready' &&
        video?.readyState === 4
      ) {
        const videoTime = video.currentTime
        if (videoTime !== lastVideoTime.current) {
          lastVideoTime.current = videoTime
          const detectTimestamp = performance.now()
          try {
            faceRef.current = serviceRef.current.detectForVideo(
              video,
              detectTimestamp,
            )

            if (faceRef.current.detected !== lastDetected.current) {
              lastDetected.current = faceRef.current.detected
              setDetected(faceRef.current.detected)
            }
          } catch {
            faceRef.current = { ...EMPTY_FACE, timestamp: detectTimestamp }
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
      window.clearTimeout(retryId)
      cancelAnimationFrame(rafId)
    }
  }, [active, options?.detectionMode, videoRef])

  return { status, faceRef, targetRef, detected, locked, fps }
}
