import type { TargetLockStyle } from '../../types/hud'
import type { HudEffects } from '../../types/hud'
import type { HudSettings } from '../../types/hudSettings'
import { HUD_COLOR_PRESETS } from '../../types/hudSettings'
import { Section, Slider, Toggle } from './controls'

interface SettingsPanelProps {
  open: boolean
  settings: HudSettings
  onToggle: () => void
  onUpdateStyle: (patch: Partial<TargetLockStyle>) => void
  onUpdateEffects: (patch: Partial<HudEffects>) => void
  onReset: () => void
}

export default function SettingsPanel({
  open,
  settings,
  onToggle,
  onUpdateStyle,
  onUpdateEffects,
  onReset,
}: SettingsPanelProps) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="absolute right-2 top-12 z-20 rounded border border-white/20 bg-black/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/80 backdrop-blur transition hover:border-hud-primary/60 hover:text-hud-primary"
      >
        {open ? 'Close' : 'Config'}
      </button>

      <aside
        className={`absolute bottom-2 right-2 top-24 z-10 w-64 overflow-y-auto rounded border border-white/15 bg-black/60 p-3 backdrop-blur transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-hud-primary">
            Hud Config
          </span>
        </div>

        <Section title="Target">
          <Slider
            label="Circle Size"
            min={0.6}
            max={1.8}
            step={0.05}
            value={settings.sizeScale}
            format={(value) => `${Math.round(value * 100)}%`}
            onChange={(sizeScale) => onUpdateStyle({ sizeScale })}
          />
          <div className="flex flex-wrap gap-2 px-2 py-2">
            {HUD_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                title={preset.name}
                aria-label={`Color ${preset.name}`}
                onClick={() => onUpdateStyle({ color: preset.value })}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  settings.color === preset.value
                    ? 'border-white'
                    : 'border-white/20'
                }`}
                style={{
                  backgroundColor: preset.value,
                  boxShadow:
                    settings.color === preset.value
                      ? `0 0 10px 2px ${preset.value}`
                      : undefined,
                }}
              />
            ))}
          </div>
        </Section>

        <Section title="Overlay">
          <Toggle
            label="Ring"
            checked={settings.showRing}
            onChange={(showRing) => onUpdateStyle({ showRing })}
          />
          <Toggle
            label="Center Dot"
            checked={settings.showCenterDot}
            onChange={(showCenterDot) => onUpdateStyle({ showCenterDot })}
          />
          <Toggle
            label="Lock Animation"
            checked={settings.showLockAnimation}
            onChange={(showLockAnimation) =>
              onUpdateStyle({ showLockAnimation })
            }
          />
        </Section>

        <Section title="Effects">
          <Toggle
            label="Pulsing Ring"
            checked={settings.effects.pulse}
            onChange={(pulse) => onUpdateEffects({ pulse })}
          />
          <Toggle
            label="Scan"
            checked={settings.effects.scan}
            onChange={(scan) => onUpdateEffects({ scan })}
          />
          <Toggle
            label="Reticle"
            checked={settings.effects.reticle}
            onChange={(reticle) => onUpdateEffects({ reticle })}
          />
          <Toggle
            label="Glow"
            checked={settings.effects.vignette}
            onChange={(vignette) => onUpdateEffects({ vignette })}
          />
        </Section>

        <div className="mt-3 border-t border-white/10 px-2 pt-3">
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded border border-white/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/70 transition hover:border-hud-secondary/60 hover:text-hud-secondary"
          >
            Reset Defaults
          </button>
        </div>
      </aside>
    </>
  )
}
