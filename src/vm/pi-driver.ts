import { PiInterval } from './pi.js';

function run() {
  let piValue = new PiInterval();
  let step = 0;

  while (true) {
    const { lo, hi } = piValue.current();
    const width = hi - lo;
    
    const refined = piValue.refine();
    // In our loop we print the state before refine along with the cost of the refine that follows
    // To closely mimic trace logic:
    console.log(`step ${step}: [${lo}, ${hi}], width: ${width}, cost: ${refined.cost}`);
    
    if (refined.cost === 0) {
      console.log(`Stopped refining after ${step} steps (width no longer shrinking)`);
      break;
    }
    
    piValue = refined.value as PiInterval;
    step++;
  }
}

run();
