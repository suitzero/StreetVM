import { describe, it, expect } from 'vitest';
import { compose, ComposeOp } from './compose.js';
import { MonteCarloPi } from './mc-pi.js';

describe('Compose with non-Interval (MonteCarloPi)', () => {
  it('combines two MonteCarloPi instances', () => {
    // Op to average two MC pi estimates
    const avgOp: ComposeOp<number> = Object.assign(
      (x: number, y: number) => (x + y) / 2,
      {
        quality: (v: number) => -Math.abs(v - Math.PI) 
      }
    );

    const pi1 = new MonteCarloPi(0, 0, 12345, 1000);
    const pi2 = new MonteCarloPi(0, 0, 67890, 1000);

    const c = compose(avgOp, pi1, pi2);
    expect(c.current()).toBe(0);

    const r = c.refine();
    expect(r.value).not.toBe(c);
    expect(r.value.current()).toBeGreaterThan(0);
  });
});
