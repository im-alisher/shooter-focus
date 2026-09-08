export interface CoverTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export function computeCoverTransform(
  sourceWidth: number,
  sourceHeight: number,
  viewWidth: number,
  viewHeight: number,
): CoverTransform {
  const scale = Math.max(viewWidth / sourceWidth, viewHeight / sourceHeight)
  return {
    scale,
    offsetX: (viewWidth - sourceWidth * scale) / 2,
    offsetY: (viewHeight - sourceHeight * scale) / 2,
  }
}

export function mapPointToView(
  x: number,
  y: number,
  transform: CoverTransform,
  viewWidth?: number,
  mirror = false,
): { x: number; y: number } {
  const mappedX = transform.offsetX + x * transform.scale
  const mirroredX =
    mirror && viewWidth !== undefined ? viewWidth - mappedX : mappedX
  return {
    x: mirroredX,
    y: transform.offsetY + y * transform.scale,
  }
}

export function mapSizeToView(size: number, transform: CoverTransform): number {
  return size * transform.scale
}
