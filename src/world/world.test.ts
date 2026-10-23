import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { WorldValue } from './world.js';
import { run } from '../runtime/run.js';

describe('WorldValue', () => {
  it('should initialize with correct current state and quality', () => {
    const world = WorldValue.initial(4);
    expect(world.current()).toEqual({ positions: [0, 0, 0, 0], tick: 0 });
    expect(world.quality()).toBe(0);
  });

  it('should monotonically increase quality on refine', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 20 }),
        (numAgents, steps) => {
          let world = WorldValue.initial(numAgents);
          let prevQuality = world.quality();

          for (let i = 0; i < steps; i++) {
            const { value: nextWorld, cost } = world.refine();
            const nextQuality = nextWorld.quality();
            expect(nextQuality).toBeGreaterThan(prevQuality);
            expect(cost).toBe(1);
            world = nextWorld as WorldValue;
            prevQuality = nextQuality;
          }
        }
      )
    );
  });

  it('should respect the budget ladder through run()', () => {
    const world = WorldValue.initial(4);
    
    // Budgets to test, simulating partial ticks and full ticks
    const budgets = [0, 2, 4, 6, 8, 10];
    
    const results = budgets.map(budget => {
      const resultValue = run(world, budget) as WorldValue;
      return {
        budget,
        tick: resultValue.current().tick,
        quality: resultValue.quality()
      };
    });

    // 0 budget: no refinements, tick 0, quality 0
    expect(results[0]).toEqual({ budget: 0, tick: 0, quality: 0 });
    
    // 2 budget: partially through tick 0 (2 out of 4 agents updated), tick is still 0
    expect(results[1]).toEqual({ budget: 2, tick: 0, quality: 0.5 });
    
    // 4 budget: fully through tick 0, next state committed, tick is now 1
    expect(results[2]).toEqual({ budget: 4, tick: 1, quality: 1 });
    
    // 6 budget: tick 1 committed + 2 agents of next tick, tick is 1
    expect(results[3]).toEqual({ budget: 6, tick: 1, quality: 1.5 });
    
    // 8 budget: tick 2 committed
    expect(results[4]).toEqual({ budget: 8, tick: 2, quality: 2 });
    
    // 10 budget: tick 2 committed + 2 agents of next tick, tick is 2
    expect(results[5]).toEqual({ budget: 10, tick: 2, quality: 2.5 });
  });

  it('should correctly update agent positions on tick commit', () => {
    const world = WorldValue.initial(2);
    expect(world.current().positions).toEqual([0, 0]);
    
    // Update first agent
    let step1 = world.refine().value;
    expect(step1.current().positions).toEqual([0, 0]); // Not committed yet
    
    // Update second agent and commit tick
    let step2 = step1.refine().value;
    expect(step2.current().positions).toEqual([1, 1]); // Committed
    expect(step2.current().tick).toBe(1);
  });
});
