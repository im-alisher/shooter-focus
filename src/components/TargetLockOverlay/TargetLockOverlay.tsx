import { useEffect, useRef, type RefObject } from 'react'
import type { TrackedTarget } from '../../types/tracking'
import type { TargetLockStyle } from '../../types/hud'
import { DEFAULT_TARGET_LOCK_STYLE } from '../../types/hud'
import {
  computeCoverTransform,
  mapPointToView,
  mapSizeToView,
} from '../../utils/videoTransform'

interface TargetLockOverlayProps {
  targetRef: RefObject<TrackedTarget>
  videoRef: RefObject<HTMLVideoElement | null>
  visible: boolean
  style?: TargetLockStyle
}

const ARC_SWEEP = (Math.PI * 2) / 4
const ARC_CENTERS = [
  Math.PI / 4,
  (3 * Math.PI) / 4,
  (5 * Math.PI) / 4,
  (7 * Math.PI) / 4,
]
const TICK_SPACING = 0.06

function drawQuadrantArcs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) {
  ctx.save()
  ctx.strokeStyle = 'currentColor'
  ctx.globalAlpha = alpha
  ctx.lineWidth = Math.max(2, radius * 0.045)
  ctx.lineCap = 'round'

  for (const center of ARC_CENTERS) {
    const start = center - ARC_SWEEP / 2
    const end = center + ARC_SWEEP / 2

    ctx.beginPath()
    ctx.arc(x, y, radius, start, end)
    ctx.stroke()

    for (const endAngle of [start, end]) {
      ctx.beginPath()
      ctx.moveTo(
        x + Math.cos(endAngle) * radius,
        y + Math.sin(endAngle) * radius,
      )
      ctx.lineTo(
        x + Math.cos(endAngle) * (radius + TICK_SPACING * radius),
        y + Math.sin(endAngle) * (radius + TICK_SPACING * radius),
      )
      ctx.stroke()
    }
  }

  ctx.restore()
}

function drawInnerRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) {
  ctx.save()
  ctx.strokeStyle = 'currentColor'
  ctx.globalAlpha = alpha * 0.55
  ctx.lineWidth = 1
  ctx.setLineDash([radius * 0.14, radius * 0.12])
  ctx.beginPath()
  ctx.arc(x, y, radius * 0.72, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawCenterDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) {
  const dotRadius = Math.max(2.5, radius * 0.045)
  const crossLength = radius * 0.24

  ctx.save()
  ctx.fillStyle = 'currentColor'
  ctx.strokeStyle = 'currentColor'
  ctx.globalAlpha = alpha
  ctx.lineWidth = 1.5

  ctx.beginPath()
  ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
  ctx.fill()

  for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(angle) * dotRadius, y + Math.sin(angle) * dotRadius)
    ctx.lineTo(
      x + Math.cos(angle) * (dotRadius + crossLength),
      y + Math.sin(angle) * (dotRadius + crossLength),
    )
    ctx.stroke()
  }

  ctx.restore()
}

function drawLockOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  color: string,
  style: TargetLockStyle,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color

  if (style.showRing) {
    drawQuadrantArcs(ctx, x, y, radius, alpha)
    drawInnerRing(ctx, x, y, radius, alpha)
  }
  if (style.showCenterDot) {
    drawCenterDot(ctx, x, y, radius, alpha)
  }

  ctx.restore()
}

export default function TargetLockOverlay({
  targetRef,
  videoRef,
  visible,
  style = DEFAULT_TARGET_LOCK_STYLE,
}: TargetLockOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const styleRef = useRef(style)
  const visibleRef = useRef(visible)
  const lockProgress = useRef(0)
  const lastFrameTime = useRef(0)
  const wasLocked = useRef(false)

  useEffect(() => {
    styleRef.current = style
  }, [style])

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

    const draw = (timeMs: number) => {
      const now = timeMs
      const dt = lastFrameTime.current === 0 ? 16 : now - lastFrameTime.current
      lastFrameTime.current = now

      const target = targetRef.current
      const { width, height } = canvas.getBoundingClientRect()
      const video = videoRef.current
      const activeStyle = styleRef.current

      ctx.clearRect(0, 0, width, height)

      const shouldTrack = visibleRef.current && target.locked
      const shouldDraw = shouldTrack || lockProgress.current > 0

      if (shouldDraw && video) {
        const sourceWidth = video.videoWidth || 1280
        const sourceHeight = video.videoHeight || 720
        const transform = computeCoverTransform(
          sourceWidth,
          sourceHeight,
          width,
          height,
        )

        const pos = mapPointToView(target.x, target.y, transform)
        const baseRadius = mapSizeToView(target.radius, transform)

        if (shouldTrack) {
          if (activeStyle.showLockAnimation) {
            if (!wasLocked.current && target.locked) {
              lockProgress.current = 0
            }
            const step = Math.min(1, dt / 240)
            lockProgress.current += (1 - lockProgress.current) * step
          } else {
            lockProgress.current = 1
          }
        } else {
          const step = Math.min(1, dt / 160)
          lockProgress.current -= lockProgress.current * step
        }

        wasLocked.current = shouldTrack

        const progress = lockProgress.current
        const scale = 1.4 - 0.4 * progress
        const radius = Math.max(baseRadius * scale, 18)

        let alpha = progress
        if (target.lost && shouldTrack) {
          alpha *= 0.55 + 0.45 * Math.sin((now / 120) * Math.PI)
        }

        if (alpha > 0.01) {
          drawLockOverlay(
            ctx,
            pos.x,
            pos.y,
            radius,
            alpha,
            activeStyle.color,
            activeStyle,
          )
        }
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [targetRef, videoRef])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
