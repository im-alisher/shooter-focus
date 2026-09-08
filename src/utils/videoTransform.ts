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
): { x: number; y: number } {
  return {
    x: transform.offsetX + x * transform.scale,
    y: transform.offsetY + y * transform.scale,
  }
}

export function mapSizeToView(size: number, transform: CoverTransform): number {
  return size * transform.scale
}
