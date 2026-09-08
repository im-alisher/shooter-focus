export interface TargetLockStyle {
  color: string
  sizeScale: number
  showRing: boolean
  showCenterDot: boolean
  showLockAnimation: boolean
}

export const DEFAULT_TARGET_LOCK_STYLE: TargetLockStyle = {
  color: '#00ffd5',
  sizeScale: 1,
  showRing: true,
  showCenterDot: true,
  showLockAnimation: true,
}
