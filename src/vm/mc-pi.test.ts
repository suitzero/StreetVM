import { describe, it, expect } from 'vitest';
import { MonteCarloPi } from './mc-pi.js';
import { run } from '../runtime/run.js';

describe('MonteCarloPi', () => {
  it('quality() is monotone', () => {
    let pi = new MonteCarloPi();
    
    let prevQuality = pi.quality();
    for (let i = 0; i < 5; i++) {
      const refined = pi.refine();
      const currentQuality = refined.value.quality();
      
      expect(currentQuality).toBeGreaterThan(prevQuality);
      
      pi = refined.value as MonteCarloPi;
      prevQuality = currentQuality;
    }
  });

  it('estimate converges toward Math.PI as samples grow', () => {
    let pi = new MonteCarloPi();
    
    // After 0 refinements, error is just Math.PI (since it starts at 0)
    let initialError = Math.abs(Math.PI - pi.current());
    
    // Let's refine it a bunch of times (e.g. 50 times -> 500,000 samples)
    for (let i = 0; i < 50; i++) {
      pi = pi.refine().value as MonteCarloPi;
    }
    
    const finalError = Math.abs(Math.PI - pi.current());
    
    // The estimate should be significantly closer to Pi
    expect(finalError).toBeLessThan(initialError);
    // 500k samples usually gets us within ~0.005 of Pi.
    expect(finalError).toBeLessThan(0.01);
  });

  it('works with the budget runner and larger budgets give no-worse quality', () => {
    const initialPi = new MonteCarloPi();
    
    const resultBudget5 = run(initialPi, 5);
    const resultBudget10 = run(initialPi, 10);
    
    // Quality should be better or equal with a larger budget
    expect(resultBudget10.quality()).toBeGreaterThanOrEqual(resultBudget5.quality());
    // Since our refinement cost is 1 and it doesn't stop early, 
    // it should actually be strictly greater for budget=10 vs budget=5
    expect(resultBudget10.quality()).toBeGreaterThan(resultBudget5.quality());
  });
});
