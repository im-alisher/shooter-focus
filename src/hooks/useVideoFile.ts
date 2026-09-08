import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { WebcamError } from '../types/webcam'

export type VideoFileStatus = 'idle' | 'loading' | 'playing' | 'error'

interface UseVideoFileResult {
  status: VideoFileStatus
  fileName: string | null
  error: WebcamError | null
  load: (file: File) => void
  stop: () => void
}

function clearMediaStream(video: HTMLVideoElement): void {
  const stream = video.srcObject
  if (stream instanceof MediaStream) {
    stream.getTracks().forEach((track) => track.stop())
  }
  video.srcObject = null
}

export function useVideoFile(
  videoRef: RefObject<HTMLVideoElement | null>,
): UseVideoFileResult {
  const [status, setStatus] = useState<VideoFileStatus>('idle')
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<WebcamError | null>(null)
  const urlRef = useRef<string | null>(null)

  const stop = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }

    const video = videoRef.current
    if (video) {
      clearMediaStream(video)
      video.pause()
      video.removeAttribute('controls')
      video.removeAttribute('src')
      video.load()
    }

    setStatus('idle')
    setFileName(null)
    setError(null)
  }, [videoRef])

  const load = useCallback(
    (file: File) => {
      if (!file.type.startsWith('video/')) {
        setError({
          name: 'unsupported',
          message: `"${file.name}" is not a supported video file.`,
        })
        setStatus('error')
        return
      }

      stop()

      const url = URL.createObjectURL(file)
      urlRef.current = url
      setFileName(file.name)
      setStatus('loading')

      const video = videoRef.current
      if (!video) {
        setError({ name: 'unknown', message: 'Video element is not ready.' })
        setStatus('error')
        return
      }

      clearMediaStream(video)
      video.src = url
      video.loop = true
      video.muted = true
      video.setAttribute('playsinline', 'true')

      video.play().then(
        () => setStatus('playing'),
        () => {
          setError({
            name: 'unavailable',
            message:
              'Unable to play this video. The browser may not support its codec.',
          })
          setStatus('error')
        },
      )
    },
    [stop, videoRef],
  )

  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }
    }
  }, [])

  return { status, fileName, error, load, stop }
}
