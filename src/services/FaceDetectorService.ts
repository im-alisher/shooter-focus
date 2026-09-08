import {
  FaceDetector,
  FilesetResolver,
  type Detection,
  type ImageSource,
} from '@mediapipe/tasks-vision'
import type { FaceData, Point } from '../types/face'
import { EMPTY_FACE } from '../types/face'

const WASM_FILESET_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const FACE_DETECTOR_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

export type DetectorStatus = 'uninitialized' | 'loading' | 'ready' | 'failed'

interface DetectorState {
  status: DetectorStatus
  error: string | null
}

function toPoints(detection: Detection): Point[] {
  return detection.keypoints.map((keypoint) => ({
    x: keypoint.x,
    y: keypoint.y,
  }))
}

function toFaceData(detections: Detection[], timestamp: number): FaceData {
  const primary = detections[0]
  if (!primary?.boundingBox) {
    return { ...EMPTY_FACE, timestamp }
  }

  const box = primary.boundingBox
  const confidence = primary.categories[0]?.score ?? 0

  return {
    detected: true,
    box: {
      x: box.originX,
      y: box.originY,
      width: box.width,
      height: box.height,
    },
    landmarks: toPoints(primary),
    confidence,
    timestamp,
  }
}

export class FaceDetectorService {
  private static instance: FaceDetectorService | null = null

  private detector: FaceDetector | null = null
  private initPromise: Promise<void> | null = null
  private error: string | null = null

  static getInstance(): FaceDetectorService {
    if (!FaceDetectorService.instance) {
      FaceDetectorService.instance = new FaceDetectorService()
    }
    return FaceDetectorService.instance
  }

  get state(): DetectorState {
    if (this.error) {
      return { status: 'failed', error: this.error }
    }
    if (this.detector) {
      return { status: 'ready', error: null }
    }
    if (this.initPromise) {
      return { status: 'loading', error: null }
    }
    return { status: 'uninitialized', error: null }
  }

  async initialize(): Promise<void> {
    if (this.detector) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_FILESET_URL)
        this.detector = await FaceDetector.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: FACE_DETECTOR_MODEL_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        })
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : 'Failed to initialize face detector'
        this.initPromise = null
        throw new Error(this.error, { cause: error })
      }
    })()

    return this.initPromise
  }

  detectForVideo(video: ImageSource, timestamp: number): FaceData {
    if (!this.detector) {
      throw new Error('Face detector is not initialized')
    }
    const result = this.detector.detectForVideo(video, timestamp)
    return toFaceData(result.detections, timestamp)
  }

  dispose(): void {
    this.detector?.close()
    this.detector = null
    this.initPromise = null
    this.error = null
  }
}
