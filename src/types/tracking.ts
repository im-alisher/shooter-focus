export interface TrackedTarget {
  locked: boolean
  lost: boolean
  x: number
  y: number
  radius: number
  confidence: number
  timestamp: number
  lastUpdate: number
}

export type DetectorModel = 'short' | 'full'

export interface TrackingOptions {
  minCutoff: number
  beta: number
  sizeMinCutoff: number
  lossTimeoutMs: number
  detectionMode: DetectorModel
}

export const EMPTY_TARGET: TrackedTarget = {
  locked: false,
  lost: false,
  x: 0,
  y: 0,
  radius: 0,
  confidence: 0,
  timestamp: 0,
  lastUpdate: 0,
}

export const DEFAULT_TRACKING_OPTIONS: TrackingOptions = {
  minCutoff: 1.2,
  beta: 0.4,
  sizeMinCutoff: 0.6,
  lossTimeoutMs: 400,
  detectionMode: 'short',
}
