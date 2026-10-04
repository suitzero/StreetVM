import { Value } from './value.js';

// Simple deterministic pseudo-random number generator (Linear Congruential Generator)
// to ensure deterministic refine() as required by "Same input + same budget -> same result".
function lcg(seed: number): number {
  return (seed * 1664525 + 1013904223) % 4294967296;
}

export class MonteCarloPi implements Value<number> {
  constructor(
    private readonly inside: number = 0,
    private readonly total: number = 0,
    private readonly seed: number = 123456789,
    private readonly samplesPerRefine: number = 10000
  ) {}

  current(): number {
    if (this.total === 0) return 0;
    return 4 * (this.inside / this.total);
  }

  quality(): number {
    if (this.total === 0) return -Infinity;
    // Quality improves (increases) as total samples increase.
    // Negative variance is proportional to -1/total.
    return -1 / this.total;
  }

  refine(): { value: Value<number>; cost: number } {
    let currentSeed = this.seed;
    let newInside = 0;
    
    for (let i = 0; i < this.samplesPerRefine; i++) {
      currentSeed = lcg(currentSeed);
      const x = currentSeed / 4294967296; // [0, 1)
      
      currentSeed = lcg(currentSeed);
      const y = currentSeed / 4294967296; // [0, 1)
      
      if (x * x + y * y <= 1) {
        newInside++;
      }
    }

    return {
      value: new MonteCarloPi(
        this.inside + newInside, 
        this.total + this.samplesPerRefine, 
        currentSeed, 
        this.samplesPerRefine
      ),
      cost: 1
    };
  }
}
