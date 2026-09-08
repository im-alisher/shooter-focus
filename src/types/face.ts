export interface Point {
  x: number
  y: number
}

export interface Box extends Point {
  width: number
  height: number
}

export interface FaceData {
  detected: boolean
  box: Box | null
  landmarks: Point[] | null
  confidence: number
  timestamp: number
}

export const EMPTY_FACE: FaceData = {
  detected: false,
  box: null,
  landmarks: null,
  confidence: 0,
  timestamp: 0,
}
