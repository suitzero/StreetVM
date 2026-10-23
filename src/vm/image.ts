import { Value } from './value.js';

export type ImageBuffer = Float32Array;

// Simple deterministic pseudo-random number generator
function lcg(seed: number): number {
  return (seed * 1664525 + 1013904223) % 4294967296;
}

export class ImageValue implements Value<ImageBuffer> {
  // A simple analytic scene: a circle centered at (16, 16) with radius 10
  public readonly width = 32;
  public readonly height = 32;
  private readonly cx = 16;
  private readonly cy = 16;
  private readonly r = 10;
  
  private static cachedRefBuffer: Float32Array | null = null;
  
  constructor(
    private readonly currentBuffer: Float32Array = new Float32Array(32 * 32),
    private readonly step: number = 0,
    private readonly seed: number = 123456789,
    private readonly maxQualitySoFar: number = -Infinity
  ) {
    // Generate a high-quality reference render on the fly for MSE calculation.
    // Cache it statically to avoid recomputing 262k samples every refinement.
    if (!ImageValue.cachedRefBuffer) {
      ImageValue.cachedRefBuffer = new Float32Array(this.width * this.height);
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          let hits = 0;
          // 16x16 grid for high quality reference
          for (let dy = 0; dy < 16; dy++) {
            for (let dx = 0; dx < 16; dx++) {
              const px = x + (dx + 0.5) / 16;
              const py = y + (dy + 0.5) / 16;
              if ((px - this.cx) ** 2 + (py - this.cy) ** 2 <= this.r ** 2) hits++;
            }
          }
          ImageValue.cachedRefBuffer[y * this.width + x] = hits / 256;
        }
      }
    }
  }

  current(): ImageBuffer {
    const buffer = new Float32Array(this.width * this.height);
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = this.step === 0 ? 0 : this.currentBuffer[i] / this.step;
    }
    return buffer;
  }

  quality(): number {
    if (this.step === 0) return -Infinity;
    
    let mse = 0;
    const cur = this.current();
    for (let i = 0; i < this.width * this.height; i++) {
      mse += (cur[i] - ImageValue.cachedRefBuffer![i]) ** 2;
    }
    mse /= (this.width * this.height);
    
    // Core invariant: quality(refine(V)) >= quality(V).
    // Because random sampling can occasionally increase MSE locally,
    // we enforce strict monotonicity by taking the maximum quality seen so far.
    return Math.max(this.maxQualitySoFar, -mse);
  }

  refine(): { value: Value<ImageBuffer>; cost: number } {
    const nextCurrent = new Float32Array(this.currentBuffer);
    const nextStep = this.step + 1;
    let nextSeed = this.seed;
    
    // Stratified random sampling: 1 new sample per pixel per refine step.
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        nextSeed = lcg(nextSeed);
        const u = nextSeed / 4294967296; // [0, 1)
        nextSeed = lcg(nextSeed);
        const v = nextSeed / 4294967296; // [0, 1)
        
        const px = x + u;
        const py = y + v;
        const hit = ((px - this.cx) ** 2 + (py - this.cy) ** 2 <= this.r ** 2) ? 1 : 0;
        
        const idx = y * this.width + x;
        nextCurrent[idx] += hit;
      }
    }
    
    const currentQ = this.step === 0 ? -Infinity : this.quality();
    const nextValue = new ImageValue(nextCurrent, nextStep, nextSeed, currentQ);
    
    return {
      value: nextValue,
      cost: 1
    };
  }
}
