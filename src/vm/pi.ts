import { Value } from './value.js';

export interface Interval {
  lo: number;
  hi: number;
}

export class PiInterval implements Value<Interval> {
  // We use Archimedes' method for calculating pi.
  // Let p_n be the semi-perimeter of an inscribed regular polygon with 3 * 2^n sides
  // Let P_n be the semi-perimeter of a circumscribed regular polygon with 3 * 2^n sides
  // We start with a hexagon (n=0):
  // p_0 = 3
  // P_0 = 2 * sqrt(3)
  
  constructor(
    private readonly p: number = 3,
    private readonly P: number = 2 * Math.sqrt(3)
  ) {}

  current(): Interval {
    return { lo: this.p, hi: this.P };
  }

  quality(): number {
    // Quality convention: higher = better. Error-type measures are converted.
    return -(this.P - this.p);
  }

  refine(): { value: Value<Interval>; cost: number } {
    const width = this.P - this.p;
    if (width <= 0) {
      // Cannot improve further due to float precision limits.
      return { value: this, cost: 0 };
    }

    // P_{n+1} = (2 * p_n * P_n) / (p_n + P_n)
    const nextP = (2 * this.p * this.P) / (this.p + this.P);
    
    // p_{n+1} = sqrt(p_n * P_{n+1})
    const nextp = Math.sqrt(this.p * nextP);

    const nextWidth = nextP - nextp;
    
    if (nextWidth >= width) {
      // Stop refining when width stops shrinking due to float precision
      return { value: this, cost: 0 };
    }

    return {
      value: new PiInterval(nextp, nextP),
      cost: 1
    };
  }
}
