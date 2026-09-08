import { useEffect, useRef, type RefObject } from 'react'
import type { FaceData } from '../../types/face'
import {
  computeCoverTransform,
  mapPointToView,
} from '../../utils/videoTransform'

interface DebugOverlayProps {
  faceRef: RefObject<FaceData>
  videoRef: RefObject<HTMLVideoElement | null>
  visible: boolean
}

export default function DebugOverlay({
  faceRef,
  videoRef,
  visible,
}: DebugOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visibleRef = useRef(visible)

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const draw = () => {
      const face = faceRef.current
      const { width, height } = canvas.getBoundingClientRect()
      const video = videoRef.current

      ctx.clearRect(0, 0, width, height)

      if (visibleRef.current && face.detected && face.box && video) {
        const sourceWidth = video.videoWidth || 1280
        const sourceHeight = video.videoHeight || 720

        const transform = computeCoverTransform(
          sourceWidth,
          sourceHeight,
          width,
          height,
        )

        const origin = mapPointToView(face.box.x, face.box.y, transform)
        const boxWidth = face.box.width * transform.scale
        const boxHeight = face.box.height * transform.scale

        ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)'
        ctx.lineWidth = 1.5
        ctx.strokeRect(origin.x, origin.y, boxWidth, boxHeight)

        ctx.fillStyle = 'rgba(255, 80, 80, 0.9)'
        for (const point of face.landmarks ?? []) {
          const mapped = mapPointToView(point.x, point.y, transform)
          ctx.beginPath()
          ctx.arc(mapped.x, mapped.y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [faceRef, videoRef])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
