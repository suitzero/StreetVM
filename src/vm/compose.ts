import { Value } from './value.js';
import { Interval } from './pi.js';

export function add(x: Interval, y: Interval): Interval {
  return { lo: x.lo + y.lo, hi: x.hi + y.hi };
}

export function mul(x: Interval, y: Interval): Interval {
  const p1 = x.lo * y.lo;
  const p2 = x.lo * y.hi;
  const p3 = x.hi * y.lo;
  const p4 = x.hi * y.hi;
  return {
    lo: Math.min(p1, p2, p3, p4),
    hi: Math.max(p1, p2, p3, p4)
  };
}

export interface Choice {
  child: 'x' | 'y';
  gain: number;
  cost: number;
  refinedValue: Value<Interval>;
}

export class CompositeValue implements Value<Interval> {
  constructor(
    public readonly op: (x: Interval, y: Interval) => Interval,
    public readonly x: Value<Interval>,
    public readonly y: Value<Interval>
  ) {}

  current(): Interval {
    return this.op(this.x.current(), this.y.current());
  }

  quality(): number {
    const cur = this.current();
    return -(cur.hi - cur.lo);
  }

  getChoices(): Choice[] {
    const choices: Choice[] = [];
    
    const xRefined = this.x.refine();
    if (xRefined.value !== this.x) {
      const newInterval = this.op(xRefined.value.current(), this.y.current());
      const newQuality = -(newInterval.hi - newInterval.lo);
      const gain = newQuality - this.quality();
      choices.push({ child: 'x', gain, cost: xRefined.cost, refinedValue: xRefined.value });
    }

    const yRefined = this.y.refine();
    if (yRefined.value !== this.y) {
      const newInterval = this.op(this.x.current(), yRefined.value.current());
      const newQuality = -(newInterval.hi - newInterval.lo);
      const gain = newQuality - this.quality();
      choices.push({ child: 'y', gain, cost: yRefined.cost, refinedValue: yRefined.value });
    }

    return choices;
  }

  refine(): { value: Value<Interval>; cost: number } {
    const choices = this.getChoices();
    if (choices.length === 0) {
      return { value: this, cost: 0 };
    }

    let bestChoice = choices[0];
    let bestScore = bestChoice.gain / (bestChoice.cost || 1);

    for (let i = 1; i < choices.length; i++) {
      const score = choices[i].gain / (choices[i].cost || 1);
      if (score > bestScore) {
        bestScore = score;
        bestChoice = choices[i];
      }
    }

    if (bestChoice.child === 'x') {
      return {
        value: new CompositeValue(this.op, bestChoice.refinedValue, this.y),
        cost: bestChoice.cost
      };
    } else {
      return {
        value: new CompositeValue(this.op, this.x, bestChoice.refinedValue),
        cost: bestChoice.cost
      };
    }
  }
}

export function compose(op: (x: Interval, y: Interval) => Interval, x: Value<Interval>, y: Value<Interval>): CompositeValue {
  return new CompositeValue(op, x, y);
}
