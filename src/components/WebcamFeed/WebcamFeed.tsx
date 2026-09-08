import type { RefObject } from 'react'
import type { WebcamError, WebcamStatus } from '../../types/webcam'

interface WebcamFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>
  status: WebcamStatus
  error: WebcamError | null
  onStart: () => void
}

function StatusPrompt({
  status,
  error,
  onStart,
}: Pick<WebcamFeedProps, 'status' | 'error' | 'onStart'>) {
  if (status === 'error' && error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <span className="font-mono text-sm uppercase tracking-widest text-hud-secondary">
          Camera Error
        </span>
        <p className="max-w-xs text-sm text-white/70">{error.message}</p>
        <button
          type="button"
          onClick={onStart}
          className="rounded border border-hud-primary/60 px-5 py-2 font-mono text-xs uppercase tracking-widest text-hud-primary transition hover:bg-hud-primary/10"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <span className="font-mono text-sm uppercase tracking-widest text-hud-primary">
        {status === 'permission' ? 'Requesting Camera...' : 'Camera Offline'}
      </span>
      <p className="max-w-xs text-sm text-white/70">
        {status === 'permission'
          ? 'Allow camera access to begin head tracking.'
          : 'Start the camera to lock on targets.'}
      </p>
      <button
        type="button"
        onClick={onStart}
        disabled={status === 'permission'}
        className="rounded border border-hud-primary/60 px-5 py-2 font-mono text-xs uppercase tracking-widest text-hud-primary transition enabled:hover:bg-hud-primary/10 disabled:opacity-50"
      >
        {status === 'permission' ? 'Starting...' : 'Start Camera'}
      </button>
    </div>
  )
}

export default function WebcamFeed({
  videoRef,
  status,
  error,
  onStart,
}: WebcamFeedProps) {
  const isActive = status === 'ready'

  return (
    <div className="relative h-full w-full overflow-hidden bg-black/60">
      <video
        ref={videoRef}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
        muted
        playsInline
        autoPlay
      />

      <div
        className={`absolute inset-0 flex items-center justify-center ${
          isActive ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <StatusPrompt status={status} error={error} onStart={onStart} />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-hud-primary/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-hud-primary/80 to-transparent" />
      </div>
    </div>
  )
}
