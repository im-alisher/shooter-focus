import { useRef, type RefObject } from 'react'
import type { WebcamError } from '../../types/webcam'
import type { MediaSourceMode } from '../../hooks/useMediaSource'
import type { MediaSourceStatus } from '../../hooks/useMediaSource'

interface WebcamFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>
  mode: MediaSourceMode
  status: MediaSourceStatus
  error: WebcamError | null
  fileName: string | null
  onStart: () => void
  onUpload: (file: File) => void
  mirror?: boolean
}

interface FeedPromptProps {
  mode: MediaSourceMode
  status: MediaSourceStatus
  error: WebcamError | null
  onStart: () => void
  onUpload: (file: File) => void
}

function FeedPrompt({
  mode,
  status,
  error,
  onStart,
  onUpload,
}: FeedPromptProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pickFile = () => {
    fileInputRef.current?.click()
  }

  if (status === 'error' && error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <span className="font-mono text-sm uppercase tracking-widest text-hud-secondary">
          Source Error
        </span>
        <p className="max-w-xs text-sm text-white/70">{error.message}</p>
        <button
          type="button"
          onClick={mode === 'camera' ? onStart : pickFile}
          className="rounded border border-hud-primary/60 px-5 py-2 font-mono text-xs uppercase tracking-widest text-hud-primary transition hover:bg-hud-primary/10"
        >
          {mode === 'camera' ? 'Retry Camera' : 'Choose Another File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onUpload(file)
            event.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <span className="font-mono text-sm uppercase tracking-widest text-hud-primary">
        {status === 'loading' ? 'Loading Source...' : 'Shooter Focus'}
      </span>
      <p className="max-w-xs text-sm text-white/70">
        {status === 'loading'
          ? 'Starting video source — hold still.'
          : 'Track your head in real time, or rig a video to lock onto characters.'}
      </p>
      {status === 'idle' ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="rounded border border-hud-primary/60 px-5 py-2 font-mono text-xs uppercase tracking-widest text-hud-primary transition hover:bg-hud-primary/10"
          >
            Start Camera
          </button>
          <button
            type="button"
            onClick={pickFile}
            className="rounded border border-hud-secondary/60 px-5 py-2 font-mono text-xs uppercase tracking-widest text-hud-secondary transition hover:bg-hud-secondary/10"
          >
            Upload Video
          </button>
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onUpload(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}

export default function WebcamFeed({
  videoRef,
  mode,
  status,
  error,
  fileName,
  onStart,
  onUpload,
  mirror = true,
}: WebcamFeedProps) {
  const isActive = status === 'ready' && mode !== 'none'
  const isFile = mode === 'file'
  const showPrompt = !isActive

  return (
    <div className="relative h-full w-full overflow-hidden bg-black/60">
      <video
        ref={videoRef}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          isActive ? 'opacity-100' : 'opacity-0'
        } ${mirror ? '-scale-x-100' : ''}`}
        muted
        playsInline
        autoPlay
        controls={isFile}
      />

      <div
        className={`absolute inset-0 flex items-center justify-center ${
          showPrompt ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <FeedPrompt
          mode={mode}
          status={status}
          error={error}
          onStart={onStart}
          onUpload={onUpload}
        />
      </div>

      {isFile && fileName && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded border border-white/15 bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 backdrop-blur">
          {fileName}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-hud-primary/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-hud-primary/80 to-transparent" />
    </div>
  )
}
