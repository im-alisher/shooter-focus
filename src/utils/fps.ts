export class FpsTracker {
  private lastFrameTime = 0
  private smoothedFps = 0

  tick(now: number): number {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = now
      return this.smoothedFps
    }

    const dtMs = now - this.lastFrameTime
    this.lastFrameTime = now

    if (dtMs <= 0) {
      return this.smoothedFps
    }

    const instant = 1000 / dtMs
    this.smoothedFps =
      this.smoothedFps === 0 ? instant : this.smoothedFps * 0.9 + instant * 0.1

    return this.smoothedFps
  }

  reset(): void {
    this.lastFrameTime = 0
    this.smoothedFps = 0
  }
}
