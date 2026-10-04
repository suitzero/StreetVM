import { describe, it, expect } from 'vitest';
import { PiInterval } from './pi.js';

describe('PiInterval', () => {
  it('every interval contains Math.PI', () => {
    let piValue = new PiInterval();
    for (let i = 0; i < 20; i++) {
      const { lo, hi } = piValue.current();
      expect(lo).toBeLessThanOrEqual(Math.PI);
      expect(hi).toBeGreaterThanOrEqual(Math.PI);
      
      const refined = piValue.refine();
      if (refined.cost === 0) break;
      piValue = refined.value as PiInterval;
    }
  });

  it('intervals are nested and width never grows', () => {
    let piValue = new PiInterval();
    let prevLo = -Infinity;
    let prevHi = Infinity;
    let prevWidth = Infinity;

    for (let i = 0; i < 20; i++) {
      const { lo, hi } = piValue.current();
      const width = hi - lo;

      // Intervals are nested
      expect(lo).toBeGreaterThanOrEqual(prevLo);
      expect(hi).toBeLessThanOrEqual(prevHi);

      // Width never grows
      expect(width).toBeLessThanOrEqual(prevWidth);

      // Quality monotonically increases or stays the same
      // Quality is -width, so larger quality means smaller width
      expect(piValue.quality()).toBeGreaterThanOrEqual(-prevWidth);

      prevLo = lo;
      prevHi = hi;
      prevWidth = width;

      const refined = piValue.refine();
      if (refined.cost === 0) break;
      piValue = refined.value as PiInterval;
    }
  });

  it('stops refining when width stops shrinking', () => {
    let piValue = new PiInterval();
    let steps = 0;
    while (true) {
      const refined = piValue.refine();
      if (refined.cost === 0) {
        expect(refined.value).toBe(piValue); // returns self
        break;
      }
      piValue = refined.value as PiInterval;
      steps++;
      
      // Safety break to avoid infinite loops, precision limits should stop it within 20 iterations
      if (steps > 30) {
        throw new Error('Refinement did not stop');
      }
    }
    
    // We expect it to take about 18-19 steps for JS float precision
    expect(steps).toBeLessThan(30);
  });
});
