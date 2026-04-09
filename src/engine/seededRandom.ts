/**
 * Deterministic seeded RNG using a linear congruential generator.
 * Using the same seed always produces the same simulation output.
 */
export class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed >>> 0
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.seed = Math.imul(this.seed ^ (this.seed >>> 16), 0x45d9f3b)
    this.seed = Math.imul(this.seed ^ (this.seed >>> 16), 0x45d9f3b)
    this.seed = this.seed ^ (this.seed >>> 16)
    return (this.seed >>> 0) / 0x100000000
  }

  /** Returns a float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** Returns true with the given probability */
  bool(probability: number): boolean {
    return this.next() < probability
  }

  /** Returns a random integer in [min, max] */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }
}
