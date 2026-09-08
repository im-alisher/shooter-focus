interface OneEuroOptions {
  minCutoff: number
  beta: number
  dCutoff: number
}

const DEFAULT_OPTIONS: OneEuroOptions = {
  minCutoff: 1.2,
  beta: 0.4,
  dCutoff: 1.0,
}

function smoothingFactor(cutoff: number, dtSeconds: number): number {
  const tau = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + tau / dtSeconds)
}

function exponentialSmoothing(
  previous: number,
  current: number,
  alpha: number,
): number {
  return alpha * current + (1 - alpha) * previous
}

export class OneEuroFilter {
  private options: OneEuroOptions
  private previousValue: number | null = null
  private previousDerivative: number | null = null
  private previousTime = 0

  constructor(options: OneEuroOptions = DEFAULT_OPTIONS) {
    this.options = options
  }

  reset(): void {
    this.previousValue = null
    this.previousDerivative = null
    this.previousTime = 0
  }

  filter(value: number, timestampMs: number): number {
    const dtSeconds =
      this.previousTime === 0
        ? 1 / 60
        : (timestampMs - this.previousTime) / 1000
    this.previousTime = timestampMs

    if (this.previousDerivative === null) {
      this.previousValue = value
      this.previousDerivative = 0
      return value
    }

    const { minCutoff, beta, dCutoff } = this.options

    const rawDerivative =
      (value - (this.previousValue ?? value)) / Math.max(dtSeconds, 1e-6)
    const derivativeAlpha = smoothingFactor(dCutoff, dtSeconds)
    const smoothedDerivative = exponentialSmoothing(
      this.previousDerivative,
      rawDerivative,
      derivativeAlpha,
    )

    const cutoff = minCutoff + beta * Math.abs(smoothedDerivative)
    const valueAlpha = smoothingFactor(cutoff, dtSeconds)
    const smoothedValue = exponentialSmoothing(
      this.previousValue ?? value,
      value,
      valueAlpha,
    )

    this.previousValue = smoothedValue
    this.previousDerivative = smoothedDerivative

    return smoothedValue
  }
}
