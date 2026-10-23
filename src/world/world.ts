import { Value } from '../vm/value.js';

export interface WorldSnapshot {
  positions: number[];
  tick: number;
}

export class WorldValue implements Value<WorldSnapshot> {
  constructor(
    private readonly baseSnapshot: WorldSnapshot,
    private readonly nextPositions: number[],
    private readonly agentIndex: number
  ) {}

  static initial(numAgents: number): WorldValue {
    const initialPositions = Array(numAgents).fill(0);
    return new WorldValue(
      { positions: initialPositions, tick: 0 },
      [...initialPositions],
      0
    );
  }

  current(): WorldSnapshot {
    return this.baseSnapshot;
  }

  quality(): number {
    const totalAgents = this.baseSnapshot.positions.length;
    // Handle edge case of 0 agents
    if (totalAgents === 0) return this.baseSnapshot.tick;
    return this.baseSnapshot.tick + this.agentIndex / totalAgents;
  }

  refine(): { value: Value<WorldSnapshot>; cost: number } {
    const totalAgents = this.baseSnapshot.positions.length;
    
    // Nothing to do if no agents
    if (totalAgents === 0) {
      return { value: this, cost: 0 };
    }

    const newNextPositions = [...this.nextPositions];
    // Simple 1D simulation rule: agent moves forward by 1
    newNextPositions[this.agentIndex] = this.baseSnapshot.positions[this.agentIndex] + 1;

    const nextAgentIndex = this.agentIndex + 1;
    
    if (nextAgentIndex >= totalAgents) {
      // Commit the tick
      return {
        value: new WorldValue(
          { positions: newNextPositions, tick: this.baseSnapshot.tick + 1 },
          [...newNextPositions],
          0
        ),
        cost: 1
      };
    } else {
      // Continue partial update
      return {
        value: new WorldValue(
          this.baseSnapshot,
          newNextPositions,
          nextAgentIndex
        ),
        cost: 1
      };
    }
  }
}
