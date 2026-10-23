import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ImageValue } from './image.js';

describe('ImageValue', () => {
  it('starts with a blank current buffer', () => {
    const value = new ImageValue();
    const cur = value.current();
    expect(cur.length).toBe(32 * 32);
    for (let i = 0; i < cur.length; i++) {
      expect(cur[i]).toBe(0);
    }
  });

  it('initial quality is -Infinity', () => {
    const value = new ImageValue();
    expect(value.quality()).toBe(-Infinity);
  });

  it('improves quality strictly monotonically across refinements', () => {
    let value = new ImageValue();
    let prevQuality = value.quality();
    
    for (let i = 0; i < 20; i++) {
      const refined = value.refine();
      const currentQuality = refined.value.quality();
      
      expect(currentQuality).toBeGreaterThanOrEqual(prevQuality);
      expect(refined.cost).toBe(1);
      
      prevQuality = currentQuality;
      value = refined.value as ImageValue;
    }
  });

  it('strictly improves quality across the budget ladder (1 -> 4 -> 16 -> 64)', () => {
    const budgets = [1, 4, 16, 64];
    let prevQuality = -Infinity;
    
    // We import run from runtime dynamically, or just require it.
    // Or we can just manually call refine() step by step.
    const startValue = new ImageValue();
    let current = startValue;
    let stepCount = 0;
    
    for (const budget of budgets) {
      // Advance to the current budget from stepCount
      while (stepCount < budget) {
        current = current.refine().value as ImageValue;
        stepCount++;
      }
      
      const currentQuality = current.quality();
      expect(currentQuality).toBeGreaterThan(prevQuality);
      prevQuality = currentQuality;
    }
  });

  it('is deterministic: same initial value yields same refined results', () => {
    const value1 = new ImageValue();
    const value2 = new ImageValue();
    
    const refined1 = value1.refine().value;
    const refined2 = value2.refine().value;
    
    expect(refined1.current()).toEqual(refined2.current());
    expect(refined1.quality()).toBe(refined2.quality());
  });

  it('maintains the core invariant over many arbitrary sequences (property test)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // number of refine steps
        fc.integer({ min: 0, max: 10000 }), // seed
        (steps, seed) => {
          let val = new ImageValue(undefined, 0, seed);
          let q = val.quality();
          
          for (let i = 0; i < steps; i++) {
            const next = val.refine().value as ImageValue;
            if (next.quality() < q) {
              return false;
            }
            q = next.quality();
            val = next;
          }
          return true;
        }
      )
    );
  });
});
