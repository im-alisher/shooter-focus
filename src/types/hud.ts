export interface TargetLockStyle {
  color: string
  sizeScale: number
  showRing: boolean
  showCenterDot: boolean
  showLockAnimation: boolean
}

export const DEFAULT_TARGET_LOCK_STYLE: TargetLockStyle = {
  color: '#ff4b4b',
  sizeScale: 1,
  showRing: true,
  showCenterDot: true,
  showLockAnimation: true,
}

export interface HudEffects {
  pulse: boolean
  scan: boolean
  reticle: boolean
  vignette: boolean
}

export const DEFAULT_HUD_EFFECTS: HudEffects = {
  pulse: true,
  scan: true,
  reticle: true,
  vignette: true,
}
