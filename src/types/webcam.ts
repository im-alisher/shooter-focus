export type WebcamStatus = 'idle' | 'permission' | 'ready' | 'error'

export type WebcamErrorName =
  'not-allowed' | 'not-found' | 'unavailable' | 'unsupported' | 'unknown'

export interface WebcamError {
  name: WebcamErrorName
  message: string
}

export interface CameraSettings {
  width: number
  height: number
  facingMode: 'user' | 'environment'
}
