import type { HudEffects } from './hud'
import { DEFAULT_HUD_EFFECTS } from './hud'

export interface HudSettings {
  color: string
  sizeScale: number
  showRing: boolean
  showCenterDot: boolean
  showLockAnimation: boolean
  showDebugBox: boolean
  effects: HudEffects
}

export const DEFAULT_HUD_SETTINGS: HudSettings = {
  color: '#00ffd5',
  sizeScale: 1,
  showRing: true,
  showCenterDot: true,
  showLockAnimation: true,
  showDebugBox: false,
  effects: { ...DEFAULT_HUD_EFFECTS },
}

export const HUD_COLOR_PRESETS = [
  { name: 'Cyan', value: '#00ffd5' },
  { name: 'Magenta', value: '#ff3bd5' },
  { name: 'Lime', value: '#7bff3b' },
  { name: 'Amber', value: '#ffb03b' },
  { name: 'Ice', value: '#5fd4ff' },
  { name: 'Red', value: '#ff4b4b' },
] as const

export function settingsToStyle(settings: HudSettings) {
  return {
    color: settings.color,
    sizeScale: settings.sizeScale,
    showRing: settings.showRing,
    showCenterDot: settings.showCenterDot,
    showLockAnimation: settings.showLockAnimation,
  }
}
