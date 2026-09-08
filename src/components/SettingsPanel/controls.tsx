import type { ReactNode } from 'react'

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left transition hover:bg-white/5"
    >
      <span className="font-mono text-[11px] uppercase tracking-wider text-white/70">
        {label}
      </span>
      <span
        className={`relative h-4 w-8 shrink-0 rounded-full border transition-colors ${
          checked
            ? 'border-hud-primary bg-hud-primary/30'
            : 'border-white/20 bg-white/5'
        }`}
      >
        <span
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all ${
            checked
              ? 'left-[calc(100%-14px)] bg-hud-primary shadow-[0_0_6px_1px_var(--color-hud-primary)]'
              : 'left-[3px] bg-white/40'
          }`}
        />
      </span>
    </button>
  )
}

interface SliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  format?: (value: number) => string
  onChange: (next: number) => void
}

export function Slider({
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: SliderProps) {
  return (
    <label className="flex flex-col gap-1.5 px-2 py-1.5">
      <span className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-white/70">
          {label}
        </span>
        <span className="font-mono text-[11px] text-hud-primary">
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-hud-primary"
      />
    </label>
  )
}

interface SectionProps {
  title: string
  children: ReactNode
}

export function Section({ title, children }: SectionProps) {
  return (
    <fieldset className="border-t border-white/10 px-2 pt-3 first:border-t-0 first:pt-0">
      <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.25em] text-hud-primary/80">
        {title}
      </legend>
      <div className="mt-1 flex flex-col gap-0.5">{children}</div>
    </fieldset>
  )
}
