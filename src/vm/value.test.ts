import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Value } from './value.js';
import { trace } from './trace.js';

class ToyNumberValue implements Value<number> {
  constructor(private estimate: number, private error: number) {}

  current(): number {
    return this.estimate;
  }

  quality(): number {
    // Quality convention: higher = better. Error-type measures are converted.
    return -this.error;
  }

  refine(): { value: Value<number>; cost: number } {
    // Simulating a refinement that halves the error and moves estimate closer to 42
    // If error is already 0, we can't improve it.
    const nextError = this.error / 2;
    const diff = 42 - this.estimate;
    const nextEstimate = this.estimate + diff / 2;
    return {
      value: new ToyNumberValue(nextEstimate, nextError),
      cost: 1
    };
  }
}

describe('Value', () => {
  it('core invariant: quality(refine(v)) >= quality(v)', () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true }), 
        fc.double({ min: 0, noNaN: true }), 
        (estimate, error) => {
          let v: Value<number> = new ToyNumberValue(estimate, error);
          
          for (let i = 0; i < 10; i++) {
            const refined = v.refine();
            expect(refined.value.quality()).toBeGreaterThanOrEqual(v.quality());
            v = refined.value;
          }
        }
      )
    );
  });
});

describe('trace', () => {
  it('returns exactly n steps of refinement', () => {
    const v = new ToyNumberValue(0, 100);
    const steps = trace(v, 3);
    
    expect(steps.length).toBe(3);
    
    // First step
    expect(steps[0].current).toBe(21);
    expect(steps[0].quality).toBe(-50);
    expect(steps[0].cost).toBe(1);
    
    // Second step
    expect(steps[1].current).toBe(31.5);
    expect(steps[1].quality).toBe(-25);
    expect(steps[1].cost).toBe(1);
    
    // Third step
    expect(steps[2].current).toBe(36.75);
    expect(steps[2].quality).toBe(-12.5);
    expect(steps[2].cost).toBe(1);
  });
});
