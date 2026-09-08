import { useEffect, useRef, type RefObject } from 'react'
import type { TrackedTarget } from '../../types/tracking'
import type { HudEffects, TargetLockStyle } from '../../types/hud'
import { DEFAULT_HUD_EFFECTS, DEFAULT_TARGET_LOCK_STYLE } from '../../types/hud'
import {
  computeCoverTransform,
  mapPointToView,
  mapSizeToView,
  type CoverTransform,
} from '../../utils/videoTransform'

interface TargetLockOverlayProps {
  targetRef: RefObject<TrackedTarget>
  videoRef: RefObject<HTMLVideoElement | null>
  visible: boolean
  style?: TargetLockStyle
  effects?: HudEffects
  mirror?: boolean
}

const ARC_SWEEP = (Math.PI * 2) / 4
const ARC_CENTERS = [
  Math.PI / 4,
  (3 * Math.PI) / 4,
  (5 * Math.PI) / 4,
  (7 * Math.PI) / 4,
]
const TICK_SPACING = 0.06
const SCAN_PERIOD_MS = 1400
const SCAN_TRAIL_STEPS = 6
const MAX_DPR = 2

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

function drawScan(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  now: number,
) {
  const scanRadius = radius * 0.8
  const sweepAngle = ((now % SCAN_PERIOD_MS) / SCAN_PERIOD_MS) * Math.PI * 2
  const step = 0.05

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.lineCap = 'round'

  for (let i = SCAN_TRAIL_STEPS; i >= 0; i -= 1) {
    const angle = sweepAngle - i * step
    const trailAlpha = 0.16 * (1 - i / (SCAN_TRAIL_STEPS + 1))

    ctx.strokeStyle = 'currentColor'
    ctx.globalAlpha = alpha * trailAlpha
    ctx.lineWidth = 1.5

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(
      x + Math.cos(angle) * scanRadius,
      y + Math.sin(angle) * scanRadius,
    )
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(
      x + Math.cos(angle) * scanRadius,
      y + Math.sin(angle) * scanRadius,
      Math.max(1.5, radius * 0.015),
      0,
      Math.PI * 2,
    )
    ctx.fillStyle = 'currentColor'
    ctx.fill()
  }

  ctx.restore()
}

function drawReticleCorners(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) {
  const outer = radius + radius * 0.18
  const arm = radius * 0.16

  ctx.save()
  ctx.strokeStyle = 'currentColor'
  ctx.globalAlpha = alpha * 0.8
  ctx.lineWidth = Math.max(1.5, radius * 0.025)
  ctx.lineCap = 'round'

  for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const dirX = Math.cos(angle)
    const dirY = Math.sin(angle)
    const perpX = -dirY
    const perpY = dirX

    const cx = x + dirX * outer
    const cy = y + dirY * outer

    ctx.beginPath()
    ctx.moveTo(cx + dirX * arm, cy + dirY * arm)
    ctx.lineTo(cx - dirX * arm * 0.4, cy - dirY * arm * 0.4)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(cx + perpX * arm * 0.6, cy + perpY * arm * 0.6)
    ctx.lineTo(cx - perpX * arm * 0.6, cy - perpY * arm * 0.6)
    ctx.stroke()
  }

  ctx.restore()
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) {
  const glowRadius = radius * 2.1
  const gradient = ctx.createRadialGradient(x, y, radius, x, y, glowRadius)

  ctx.save()
  gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.06})`)
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
  ctx.fill()
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
  effects = DEFAULT_HUD_EFFECTS,
  mirror = true,
}: TargetLockOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const styleRef = useRef(style)
  const effectsRef = useRef(effects)
  const visibleRef = useRef(visible)
  const mirrorRef = useRef(mirror)
  const lockProgress = useRef(0)
  const lastFrameTime = useRef(0)
  const wasLocked = useRef(false)

  useEffect(() => {
    styleRef.current = style
  }, [style])

  useEffect(() => {
    effectsRef.current = effects
  }, [effects])

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

    const draw = (timeMs: number) => {
      const now = timeMs
      const dt = lastFrameTime.current === 0 ? 16 : now - lastFrameTime.current
      lastFrameTime.current = now

      const target = targetRef.current
      const { width, height } = canvas.getBoundingClientRect()
      const video = videoRef.current
      const activeStyle = styleRef.current
      const activeEffects = effectsRef.current

      const shouldTrack = visibleRef.current && target.locked
      const shouldDraw = shouldTrack || lockProgress.current > 0

      if (!shouldDraw || !video) {
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

      const pos = mapPointToView(
        target.x,
        target.y,
        transform,
        width,
        activeMirror,
      )
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
      const pulseFactor = activeEffects.pulse
        ? 1 + 0.035 * Math.sin(now / 260)
        : 1
      const radius = Math.max(baseRadius * scale * pulseFactor, 18)

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

        if (activeStyle.showRing) {
          if (activeEffects.scan) {
            drawScan(ctx, pos.x, pos.y, radius, alpha, now)
          }
          if (activeEffects.reticle) {
            drawReticleCorners(ctx, pos.x, pos.y, radius, alpha)
          }
        }

        if (activeEffects.vignette) {
          drawGlow(ctx, pos.x, pos.y, radius, alpha)
        }

        hasPainted = true
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
