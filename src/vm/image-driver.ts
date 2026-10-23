import { run } from '../runtime/run.js';
import { ImageValue } from './image.js';

function drive() {
  console.log("Budget\tQuality (MSE)");
  console.log("------\t-------------");
  
  // The budget ladder
  const budgets = [1, 4, 16, 64];
  
  for (const budget of budgets) {
    const startValue = new ImageValue();
    const finalValue = run(startValue, budget);
    
    // Convert quality back to MSE just for human-readable display,
    // although quality() itself is what we primarily care about.
    console.log(`${budget}\t${finalValue.quality().toFixed(6)}`);
  }
}

drive();
