import { useCallback, useState } from 'react'
import type { HudEffects } from '../types/hud'
import type { HudSettings } from '../types/hudSettings'
import { DEFAULT_HUD_SETTINGS } from '../types/hudSettings'

export interface UseHudSettingsResult {
  settings: HudSettings
  update: (patch: Partial<HudSettings>) => void
  updateEffects: (patch: Partial<HudEffects>) => void
  reset: () => void
}

export function useHudSettings(
  initial?: Partial<HudSettings>,
): UseHudSettingsResult {
  const [settings, setSettings] = useState<HudSettings>({
    ...DEFAULT_HUD_SETTINGS,
    ...initial,
    effects: { ...DEFAULT_HUD_SETTINGS.effects, ...initial?.effects },
  })

  const update = useCallback((patch: Partial<HudSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateEffects = useCallback((patch: Partial<HudEffects>) => {
    setSettings((prev) => ({ ...prev, effects: { ...prev.effects, ...patch } }))
  }, [])

  const reset = useCallback(() => {
    setSettings(DEFAULT_HUD_SETTINGS)
  }, [])

  return { settings, update, updateEffects, reset }
}
