import { Value } from './value.js';
import { Interval } from './pi.js';

export interface ComposeOp<T> {
  (x: T, y: T): T;
  quality: (v: T) => number;
}

export const add: ComposeOp<Interval> = Object.assign(
  (x: Interval, y: Interval): Interval => ({ lo: x.lo + y.lo, hi: x.hi + y.hi }),
  { quality: (v: Interval) => -(v.hi - v.lo) }
);

export const mul: ComposeOp<Interval> = Object.assign(
  (x: Interval, y: Interval): Interval => {
    const p1 = x.lo * y.lo;
    const p2 = x.lo * y.hi;
    const p3 = x.hi * y.lo;
    const p4 = x.hi * y.hi;
    return {
      lo: Math.min(p1, p2, p3, p4),
      hi: Math.max(p1, p2, p3, p4)
    };
  },
  { quality: (v: Interval) => -(v.hi - v.lo) }
);

export interface Choice<T> {
  child: 'x' | 'y';
  gain: number;
  cost: number;
  refinedValue: Value<T>;
}

export class CompositeValue<T> implements Value<T> {
  constructor(
    public readonly op: ComposeOp<T>,
    public readonly x: Value<T>,
    public readonly y: Value<T>
  ) {}

  current(): T {
    return this.op(this.x.current(), this.y.current());
  }

  quality(): number {
    return this.op.quality(this.current());
  }

  getChoices(): Choice<T>[] {
    const choices: Choice<T>[] = [];
    
    const xRefined = this.x.refine();
    if (xRefined.value !== this.x) {
      const newCurrent = this.op(xRefined.value.current(), this.y.current());
      const newQuality = this.op.quality(newCurrent);
      const gain = newQuality - this.quality();
      choices.push({ child: 'x', gain, cost: xRefined.cost, refinedValue: xRefined.value });
    }

    const yRefined = this.y.refine();
    if (yRefined.value !== this.y) {
      const newCurrent = this.op(this.x.current(), yRefined.value.current());
      const newQuality = this.op.quality(newCurrent);
      const gain = newQuality - this.quality();
      choices.push({ child: 'y', gain, cost: yRefined.cost, refinedValue: yRefined.value });
    }

    return choices;
  }

  refine(): { value: Value<T>; cost: number } {
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

export function compose<T>(op: ComposeOp<T>, x: Value<T>, y: Value<T>): CompositeValue<T> {
  return new CompositeValue(op, x, y);
}
