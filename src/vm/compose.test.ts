import { describe, it, expect } from 'vitest';
import { add, mul, compose } from './compose.js';
import { Value } from './value.js';
import { Interval } from './pi.js';

class MockIntervalValue implements Value<Interval> {
  constructor(
    public readonly lo: number,
    public readonly hi: number,
    public readonly refinementLo: number,
    public readonly refinementHi: number,
    public readonly cost: number = 1
  ) {}

  current(): Interval {
    return { lo: this.lo, hi: this.hi };
  }

  quality(): number {
    return -(this.hi - this.lo);
  }

  refine(): { value: Value<Interval>; cost: number } {
    if (this.lo === this.refinementLo && this.hi === this.refinementHi) {
      return { value: this, cost: 0 };
    }
    return {
      value: new MockIntervalValue(this.refinementLo, this.refinementHi, this.refinementLo, this.refinementHi, this.cost),
      cost: this.cost
    };
  }
}

describe('COMPOSE', () => {
  it('chooses the refinement that yields the best quality gain for add', () => {
    // x = 10 ± 5 -> [5, 15]
    // refined x = 10 ± 1 -> [9, 11]
    const x = new MockIntervalValue(5, 15, 9, 11);
    
    // y = 100 ± 0.001 -> [99.999, 100.001]
    // refined y = 100 ± 0 -> [100, 100]
    const y = new MockIntervalValue(99.999, 100.001, 100, 100);

    const sum = compose(add, x, y);
    
    // Initial: [5 + 99.999, 15 + 100.001] = [104.999, 115.001] -> width 10.002, quality -10.002
    expect(sum.quality()).toBeCloseTo(-10.002);

    const choices = sum.getChoices();
    expect(choices.length).toBe(2);

    const xChoice = choices.find(c => c.child === 'x')!;
    const yChoice = choices.find(c => c.child === 'y')!;

    // Refining x: [9 + 99.999, 11 + 100.001] = [108.999, 111.001] -> width 2.002, quality -2.002. Gain = 8
    expect(xChoice.gain).toBeCloseTo(8);
    // Refining y: [5 + 100, 15 + 100] = [105, 115] -> width 10, quality -10. Gain = 0.002
    expect(yChoice.gain).toBeCloseTo(0.002);

    // Expect refining to pick x
    const refined = sum.refine();
    expect(refined.cost).toBe(1); // cost of refining x
    expect(refined.value.quality()).toBeCloseTo(-2.002);
    expect((refined.value as any).x.current().lo).toBe(9);
  });

  it('chooses the refinement that yields the best quality gain for mul', () => {
    // x = 10 ± 5 -> [5, 15]
    // refined x = 10 ± 1 -> [9, 11]
    const x = new MockIntervalValue(5, 15, 9, 11);
    
    // y = 100 ± 0.001 -> [99.999, 100.001]
    // refined y = 100 ± 0 -> [100, 100]
    const y = new MockIntervalValue(99.999, 100.001, 100, 100);

    const prod = compose(mul, x, y);
    
    // Initial: [5 * 99.999, 15 * 100.001] = [499.995, 1500.015] -> width 1000.02
    expect(prod.quality()).toBeCloseTo(-1000.02);

    const choices = prod.getChoices();
    expect(choices.length).toBe(2);

    // Expect refining to pick x because refining x drastically reduces the width.
    const refined = prod.refine();
    expect((refined.value as any).x.current().lo).toBe(9);
  });
});
