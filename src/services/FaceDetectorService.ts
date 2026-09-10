import {
  FaceDetector,
  FilesetResolver,
  type Detection,
  type ImageSource,
} from '@mediapipe/tasks-vision'
import type { FaceData, Point } from '../types/face'
import { EMPTY_FACE } from '../types/face'
import type { DetectorModel } from '../types/tracking'

const WASM_FILESET_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const FACE_DETECTOR_MODEL_URLS: Record<DetectorModel, string> = {
  short:
    'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  full: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_full_range/float16/1/blaze_face_full_range.tflite',
}
const DEFAULT_DETECTOR_MODEL: DetectorModel = 'short'

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
  private currentModel: DetectorModel = DEFAULT_DETECTOR_MODEL
  private loadToken = 0

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

  get model(): DetectorModel {
    return this.currentModel
  }

  setModel(model: DetectorModel): Promise<void> {
    if (this.currentModel === model) {
      if (this.detector) return Promise.resolve()
      if (this.initPromise) return this.initPromise
    }

    const token = ++this.loadToken
    this.detector?.close()
    this.detector = null
    this.initPromise = null
    this.error = null
    this.currentModel = model

    this.initPromise = (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(WASM_FILESET_URL)
        const detector = await FaceDetector.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: FACE_DETECTOR_MODEL_URLS[model],
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        })
        if (token !== this.loadToken) {
          detector.close()
          return
        }
        this.detector = detector
      } catch (error) {
        if (token !== this.loadToken) return
        this.error =
          error instanceof Error
            ? error.message
            : 'Failed to initialize face detector'
        throw new Error(this.error, { cause: error })
      } finally {
        if (token === this.loadToken) {
          this.initPromise = null
        }
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
    this.loadToken += 1
    this.detector?.close()
    this.detector = null
    this.initPromise = null
    this.error = null
    this.currentModel = DEFAULT_DETECTOR_MODEL
  }
}
