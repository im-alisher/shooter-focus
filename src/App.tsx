import WebcamFeed from './components/WebcamFeed/WebcamFeed'
import { useWebcam } from './hooks/useWebcam'

function App() {
  const { videoRef, status, error, start } = useWebcam()

  return (
    <main className="flex h-full w-full items-center justify-center bg-hud-bg p-4">
      <div className="relative h-[70vh] max-h-[720px] w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/60">
        <WebcamFeed
          videoRef={videoRef}
          status={status}
          error={error}
          onStart={start}
        />
        <header className="pointer-events-none absolute left-0 top-0 flex w-full items-center justify-between p-4">
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-hud-primary">
            Shooter Focus
          </span>
          <span className="h-2 w-2 rounded-full bg-hud-secondary shadow-[0_0_8px_2px_var(--color-hud-secondary)]" />
        </header>
      </div>
    </main>
  )
}

export default App
