import { describe, it, expect } from 'vitest';
import { run } from './run.js';
import { Value } from '../vm/value.js';
import { Interval } from '../vm/pi.js';
import { add, compose } from '../vm/compose.js';

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

describe('Runtime run()', () => {
  it('returns a result for budget > 0 (even if it cannot afford a step)', () => {
    const x = new MockIntervalValue(5, 15, 9, 11, 2); // cost is 2
    const result = run(x, 1);
    // budget is 1, cost is 2, so it cannot afford the step and returns the initial value
    expect(result).toBe(x);
    expect(result.quality()).toBe(-10);
  });

  it('larger budget gives quality no worse than smaller budget on composite', () => {
    const x = new MockIntervalValue(5, 15, 9, 11, 1);
    const y = new MockIntervalValue(99.999, 100.001, 100, 100, 1);

    const sum = compose(add, x, y);

    const resultBudget1 = run(sum, 1);
    const resultBudget2 = run(sum, 2);

    expect(resultBudget1.quality()).toBeGreaterThanOrEqual(sum.quality());
    expect(resultBudget2.quality()).toBeGreaterThanOrEqual(resultBudget1.quality());
  });
  
  it('is deterministic', () => {
    const x = new MockIntervalValue(5, 15, 9, 11, 1);
    const y = new MockIntervalValue(99.999, 100.001, 100, 100, 1);

    const sum1 = compose(add, x, y);
    const sum2 = compose(add, x, y); // identical initial state

    const res1 = run(sum1, 1);
    const res2 = run(sum2, 1);

    expect(res1.quality()).toBe(res2.quality());
    // Also structurally they should represent same value
    expect(res1.current()).toEqual(res2.current());
  });
});
