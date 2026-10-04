import { Value } from '../vm/value.js';

export function run<T>(value: Value<T>, budget: number): Value<T> {
  let current = value;
  while (budget > 0) {
    const refined = current.refine();
    
    // Stop if no further refinement is possible
    if (refined.value === current || refined.cost === 0) {
      break;
    }
    
    // Stop if we don't have enough budget for the next refinement
    if (refined.cost > budget) {
      break;
    }
    
    current = refined.value;
    budget -= refined.cost;
  }
  return current;
}
