import { Value } from './value.js';

export interface TraceStep<T> {
  current: T;
  quality: number;
  cost: number;
}

export function trace<T>(value: Value<T>, n: number): TraceStep<T>[] {
  const steps: TraceStep<T>[] = [];
  let currentValue = value;

  for (let i = 0; i < n; i++) {
    const refined = currentValue.refine();
    steps.push({
      current: refined.value.current(),
      quality: refined.value.quality(),
      cost: refined.cost
    });
    currentValue = refined.value;
  }

  return steps;
}
