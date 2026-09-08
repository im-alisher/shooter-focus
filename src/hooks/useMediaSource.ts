import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { WebcamError, WebcamStatus } from '../types/webcam'
import { useWebcam } from './useWebcam'
import { useVideoFile, type VideoFileStatus } from './useVideoFile'

export type MediaSourceMode = 'none' | 'camera' | 'file'

export type MediaSourceStatus = 'idle' | 'loading' | 'ready' | 'error'

interface UseMediaSourceResult {
  videoRef: RefObject<HTMLVideoElement | null>
  mode: MediaSourceMode
  status: MediaSourceStatus
  error: WebcamError | null
  fileName: string | null
  startCamera: () => void
  uploadFile: (file: File) => void
  stop: () => void
}

function toUnifiedStatus(
  mode: MediaSourceMode,
  webcamStatus: WebcamStatus | null,
  fileStatus: VideoFileStatus,
): MediaSourceStatus {
  if (mode === 'camera') {
    if (webcamStatus === 'ready') return 'ready'
    if (webcamStatus === 'error') return 'error'
    return 'loading'
  }
  if (mode === 'file') {
    if (fileStatus === 'playing') return 'ready'
    if (fileStatus === 'error') return 'error'
    return 'loading'
  }
  return 'idle'
}

export function useMediaSource(): UseMediaSourceResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const {
    status: webcamStatus,
    error: webcamError,
    start,
    stop: stopWebcam,
  } = useWebcam(undefined, videoRef)
  const {
    status: fileStatus,
    fileName,
    error: fileError,
    load,
    stop: stopFile,
  } = useVideoFile(videoRef)

  const [mode, setMode] = useState<MediaSourceMode>('none')

  const startCamera = useCallback(() => {
    setMode('camera')
    start()
  }, [start])

  const uploadFile = useCallback(
    (file: File) => {
      setMode('file')
      load(file)
    },
    [load],
  )

  const stop = useCallback(() => {
    stopWebcam()
    stopFile()
    setMode('none')
  }, [stopWebcam, stopFile])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  const status = toUnifiedStatus(mode, webcamStatus, fileStatus)
  const error =
    mode === 'camera' ? webcamError : mode === 'file' ? fileError : null

  return {
    videoRef,
    mode,
    status,
    error,
    fileName,
    startCamera,
    uploadFile,
    stop,
  }
}
