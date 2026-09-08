import { useEffect, useRef, type RefObject } from 'react'
import type { FaceData } from '../../types/face'
import {
  computeCoverTransform,
  mapPointToView,
  type CoverTransform,
} from '../../utils/videoTransform'

const MAX_DPR = 2

interface DebugOverlayProps {
  faceRef: RefObject<FaceData>
  videoRef: RefObject<HTMLVideoElement | null>
  visible: boolean
  mirror?: boolean
}

export default function DebugOverlay({
  faceRef,
  videoRef,
  visible,
  mirror = true,
}: DebugOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visibleRef = useRef(visible)
  const mirrorRef = useRef(mirror)

  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  useEffect(() => {
    mirrorRef.current = mirror
  }, [mirror])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    let hasPainted = false
    let cachedSourceW = 0
    let cachedSourceH = 0
    let cachedW = 0
    let cachedH = 0
    let cachedTransform: CoverTransform | null = null

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cachedW = 0
      cachedH = 0
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const draw = () => {
      const face = faceRef.current
      const { width, height } = canvas.getBoundingClientRect()
      const video = videoRef.current
      const box = face.detected ? face.box : null

      if (!(visibleRef.current && box && video)) {
        if (hasPainted) {
          ctx.clearRect(0, 0, width, height)
          hasPainted = false
        }
        rafId = requestAnimationFrame(draw)
        return
      }

      const sourceWidth = video.videoWidth || 1280
      const sourceHeight = video.videoHeight || 720

      if (
        !cachedTransform ||
        sourceWidth !== cachedSourceW ||
        sourceHeight !== cachedSourceH ||
        width !== cachedW ||
        height !== cachedH
      ) {
        cachedSourceW = sourceWidth
        cachedSourceH = sourceHeight
        cachedW = width
        cachedH = height
        cachedTransform = computeCoverTransform(
          sourceWidth,
          sourceHeight,
          width,
          height,
        )
      }

      const transform = cachedTransform
      const activeMirror = mirrorRef.current

      ctx.clearRect(0, 0, width, height)

      const origin = mapPointToView(
        box.x,
        box.y,
        transform,
        width,
        activeMirror,
      )
      const boxWidth = box.width * transform.scale
      const boxHeight = box.height * transform.scale

      ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(origin.x, origin.y, boxWidth, boxHeight)

      ctx.fillStyle = 'rgba(255, 80, 80, 0.9)'
      for (const point of face.landmarks ?? []) {
        const mapped = mapPointToView(
          point.x,
          point.y,
          transform,
          width,
          activeMirror,
        )
        ctx.beginPath()
        ctx.arc(mapped.x, mapped.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      hasPainted = true
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
