import { describe, it, expect } from 'vitest';
import { add, compose } from './compose.js';
import { Value } from './value.js';
import { Interval } from './pi.js';
import { trace } from './trace.js';

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

describe('COMPOSE trace', () => {
  it('works with the trace helper', () => {
    const x = new MockIntervalValue(5, 15, 9, 11);
    const y = new MockIntervalValue(99.999, 100.001, 100, 100);

    const sum = compose(add, x, y);
    const t = trace(sum, 2);
    
    expect(t.length).toBe(2);
    // 1st step: refines x
    expect(t[0].quality).toBeCloseTo(-2.002);
    // 2nd step: refines y
    expect(t[1].quality).toBeCloseTo(-2);
  });
});
