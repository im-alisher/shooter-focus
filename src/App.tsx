import DebugOverlay from './components/DebugOverlay/DebugOverlay'
import TargetLockOverlay from './components/TargetLockOverlay/TargetLockOverlay'
import WebcamFeed from './components/WebcamFeed/WebcamFeed'
import { useWebcam } from './hooks/useWebcam'
import { useHeadTracking } from './hooks/useHeadTracking'

const DETECTOR_LABEL: Record<string, string> = {
  uninitialized: 'IDLE',
  loading: 'LOADING MODEL',
  ready: 'READY',
  failed: 'ERROR',
}

function App() {
  const { videoRef, status, error, start } = useWebcam()
  const cameraReady = status === 'ready'
  const {
    status: detectorStatus,
    faceRef,
    targetRef,
    locked,
  } = useHeadTracking(videoRef, cameraReady)

  return (
    <main className="flex h-full w-full items-center justify-center bg-hud-bg p-4">
      <div className="relative h-[70vh] max-h-[720px] w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/60">
        <WebcamFeed
          videoRef={videoRef}
          status={status}
          error={error}
          onStart={start}
        />

        <DebugOverlay
          faceRef={faceRef}
          videoRef={videoRef}
          visible={cameraReady && locked}
        />

        <TargetLockOverlay
          targetRef={targetRef}
          videoRef={videoRef}
          visible={cameraReady}
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
          </div>
          <span
            className={`h-2 w-2 rounded-full ${
              locked
                ? 'bg-hud-accent shadow-[0_0_8px_2px_var(--color-hud-accent)]'
                : 'bg-hud-secondary shadow-[0_0_8px_2px_var(--color-hud-secondary)]'
            }`}
          />
        </header>
      </div>
    </main>
  )
}

export default App
