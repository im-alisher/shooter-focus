import type { FaceData } from '../types/face'
import type { TrackedTarget, TrackingOptions } from '../types/tracking'
import { DEFAULT_TRACKING_OPTIONS, EMPTY_TARGET } from '../types/tracking'
import { OneEuroFilter } from '../utils/oneEuro'

export class TrackingEngine {
  private options: TrackingOptions
  private xFilter: OneEuroFilter
  private yFilter: OneEuroFilter
  private sizeFilter: OneEuroFilter
  private current: TrackedTarget = EMPTY_TARGET

  constructor(options: Partial<TrackingOptions> = {}) {
    this.options = { ...DEFAULT_TRACKING_OPTIONS, ...options }
    this.xFilter = new OneEuroFilter({
      minCutoff: this.options.minCutoff,
      beta: this.options.beta,
      dCutoff: 1,
    })
    this.yFilter = new OneEuroFilter({
      minCutoff: this.options.minCutoff,
      beta: this.options.beta,
      dCutoff: 1,
    })
    this.sizeFilter = new OneEuroFilter({
      minCutoff: this.options.sizeMinCutoff,
      beta: 0,
      dCutoff: 1,
    })
  }

  setOptions(options: Partial<TrackingOptions>): void {
    this.options = { ...this.options, ...options }
    this.xFilter.reset()
    this.yFilter.reset()
    this.sizeFilter.reset()
  }

  reset(): void {
    this.xFilter.reset()
    this.yFilter.reset()
    this.sizeFilter.reset()
    this.current = EMPTY_TARGET
  }

  update(face: FaceData, nowMs: number): TrackedTarget {
    if (face.detected && face.box) {
      const box = face.box
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      const radius = Math.max(box.width, box.height) / 2

      const smoothedX = this.xFilter.filter(centerX, nowMs)
      const smoothedY = this.yFilter.filter(centerY, nowMs)
      const smoothedRadius = this.sizeFilter.filter(radius, nowMs)

      this.current = {
        locked: true,
        lost: false,
        x: smoothedX,
        y: smoothedY,
        radius: smoothedRadius,
        confidence: face.confidence,
        timestamp: nowMs,
        lastUpdate: nowMs,
      }
      return this.current
    }

    if (this.current.locked && this.current.lastUpdate > 0) {
      const ageMs = nowMs - this.current.lastUpdate
      if (ageMs <= this.options.lossTimeoutMs) {
        this.current = {
          ...this.current,
          lost: true,
          confidence: 0,
          timestamp: nowMs,
        }
        return this.current
      }
      this.current = { ...EMPTY_TARGET, lastUpdate: nowMs }
      return this.current
    }

    this.current = { ...EMPTY_TARGET, lastUpdate: nowMs }
    return this.current
  }

  get currentTarget(): TrackedTarget {
    return this.current
  }
}
