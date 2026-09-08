import { useState } from 'react'
import DebugOverlay from './components/DebugOverlay/DebugOverlay'
import SettingsPanel from './components/SettingsPanel/SettingsPanel'
import TargetLockOverlay from './components/TargetLockOverlay/TargetLockOverlay'
import WebcamFeed from './components/WebcamFeed/WebcamFeed'
import { useMediaSource, type MediaSourceMode } from './hooks/useMediaSource'
import { useHeadTracking } from './hooks/useHeadTracking'
import { useHudSettings } from './hooks/useHudSettings'
import { settingsToStyle } from './types/hudSettings'

const DETECTOR_LABEL: Record<string, string> = {
  uninitialized: 'IDLE',
  loading: 'LOADING MODEL',
  ready: 'READY',
  failed: 'ERROR',
}

const MODE_LABEL: Record<MediaSourceMode, string> = {
  none: 'NO SOURCE',
  camera: 'CAMERA',
  file: 'VIDEO FILE',
}

function App() {
  const { videoRef, mode, status, error, fileName, startCamera, uploadFile } =
    useMediaSource()
  const feedReady = status === 'ready'
  const {
    status: detectorStatus,
    faceRef,
    targetRef,
    locked,
    fps,
  } = useHeadTracking(videoRef, feedReady)
  const { settings, update, updateEffects, reset } = useHudSettings()
  const [configOpen, setConfigOpen] = useState(false)
  const [mirror, setMirror] = useState(true)

  return (
    <main className="flex h-full w-full items-center justify-center bg-hud-bg p-4">
      <div className="relative h-[70vh] max-h-[720px] w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/60">
        <WebcamFeed
          videoRef={videoRef}
          mode={mode}
          status={status}
          error={error}
          fileName={fileName}
          onStart={startCamera}
          onUpload={uploadFile}
          mirror={mirror}
        />

        <DebugOverlay
          faceRef={faceRef}
          videoRef={videoRef}
          visible={feedReady && locked}
          mirror={mirror}
        />

        <TargetLockOverlay
          targetRef={targetRef}
          videoRef={videoRef}
          visible={feedReady}
          style={settingsToStyle(settings)}
          effects={settings.effects}
          mirror={mirror}
        />

        <SettingsPanel
          open={configOpen}
          settings={settings}
          mirror={mirror}
          onToggle={() => setConfigOpen((value) => !value)}
          onUpdateStyle={update}
          onUpdateEffects={updateEffects}
          onToggleMirror={() => setMirror((value) => !value)}
          onReset={reset}
        />

        <header className="pointer-events-none absolute left-0 top-0 flex w-full items-center justify-between p-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-hud-primary">
              Shooter Focus
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Detector:{' '}
              <span
                className={
                  detectorStatus === 'ready'
                    ? 'text-hud-accent'
                    : detectorStatus === 'failed'
                      ? 'text-hud-secondary'
                      : 'text-white/60'
                }
              >
                {DETECTOR_LABEL[detectorStatus]}
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Source:{' '}
              <span className="text-hud-primary">{MODE_LABEL[mode]}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`font-mono text-[10px] uppercase tracking-widest ${
                fps >= 45 ? 'text-hud-accent' : 'text-hud-secondary'
              }`}
            >
              {fps} FPS
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                locked
                  ? 'bg-hud-accent shadow-[0_0_8px_2px_var(--color-hud-accent)]'
                  : 'bg-hud-secondary shadow-[0_0_8px_2px_var(--color-hud-secondary)]'
              }`}
            />
          </div>
        </header>
      </div>
    </main>
  )
}

export default App
