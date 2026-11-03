/**
 * "Quell the Insurgency" — Dictator vs Insurgent Outbreak (Firefighter Variant)
 * Directly implementing the exact formal specification from team discussion:
 *
 * Rules:
 * - Graph layout G = (V, E), rendered as an interactive Hexagonal / Graph board.
 * - Initial layout: k insurgent locations with weight = 2. All other vertices = 0.
 * - Target: Can total weight be <= n after m days?
 * - Each Day:
 *   Phase 1 (Insurgency acts FIRST):
 *     - Each vertex with weight = 2 adds +1 to its non-pacified neighbours.
 *     - A vertex can only increase by at most +1 per day due to insurgency (even if next to multiple insurgents).
 *     - Weights are capped at 2.
 *     - Newly created insurgents (promoted to weight 2 on this day) CANNOT spread on the same day.
 *   Phase 2 (Army acts):
 *     - Player deploys the army to ONE unvisited vertex.
 *     - Visited location becomes weight = -1 permanently (Garrisoned).
 *     - Adjacent locations with weight 0 <= w <= 1 are quelled to 0!
 *     - Army cannot revisit visited vertices.
 * - Complexity Connection:
 *   Directly generalizes the NP-complete Firefighter Problem (Finbow, Hartnell, Li, Schmeisser 2007).
 */

export interface InsurgencyNode {
  id: string;
  label: string;
  x: number; // SVG coordinate
  y: number; // SVG coordinate
  hexQ?: number; // Hex axial coordinate
  hexR?: number;
}

export interface InsurgencyPreset {
  id: string;
  name: string;
  badge: string;
  summaryLayman: string;
  summaryRigorous: string;
  totalDays: number; // m
  targetMaxWeight: number; // n
  nodes: InsurgencyNode[];
  edges: [string, string][];
  initialInsurgentIds: string[]; // Vertices starting at weight = 2
  optimalArmyStrategy: string[]; // Winning sequence of army deployments
}

export interface DaySimulationRecord {
  day: number;
  armyTargetId: string;
  weightsBeforeInsurgency: Record<string, number>;
  weightsAfterInsurgency: Record<string, number>;
  weightsAfterArmy: Record<string, number>;
  totalWeight: number;
  quelldCount: number;
}

export const INSURGENCY_PRESETS: InsurgencyPreset[] = [
  {
    id: 'hex-province-7',
    name: 'Hexagonal Capital Province (7-Hex Cluster)',
    badge: 'Hex Grid Simulation',
    totalDays: 4,
    targetMaxWeight: 4,
    summaryLayman:
      'You are a dictator quelling an insurgency. An outbreak starts with weight 2 in the East Sector. Each day, insurgent cells infect their neighbours (+1 weight). Deploy your army (weight -1) to contain the spread and shockwave adjacent low-level agitators (w <= 1) back to 0! Can you keep total weight <= 4 after 4 days?',
    summaryRigorous:
      'Instance of Quell-The-Insurgency on hexagonal graph H_7 with diameter 2. Initial insurgent subset I_0 = {E}, total days m = 4, target threshold n = 4. Player chooses strategy s ∈ V^m of unvisited vertices. Relates to Firefighter NP-completeness on planar/degree-3 graphs.',
    nodes: [
      { id: 'C', label: 'Capital', x: 380, y: 190, hexQ: 0, hexR: 0 },
      { id: 'NW', label: 'North-West', x: 280, y: 110, hexQ: -1, hexR: 0 },
      { id: 'NE', label: 'North-East', x: 480, y: 110, hexQ: 0, hexR: -1 },
      { id: 'E', label: 'East (Outbreak)', x: 580, y: 190, hexQ: 1, hexR: -1 },
      { id: 'SE', label: 'South-East', x: 480, y: 270, hexQ: 1, hexR: 0 },
      { id: 'SW', label: 'South-West', x: 280, y: 270, hexQ: 0, hexR: 1 },
      { id: 'W', label: 'West Garrison', x: 180, y: 190, hexQ: -1, hexR: 1 },
    ],
    edges: [
      ['C', 'NW'], ['C', 'NE'], ['C', 'E'], ['C', 'SE'], ['C', 'SW'], ['C', 'W'],
      ['NW', 'NE'], ['NE', 'E'], ['E', 'SE'], ['SE', 'SW'], ['SW', 'W'], ['W', 'NW'],
    ],
    initialInsurgentIds: ['E'],
    optimalArmyStrategy: ['C', 'NE', 'SE', 'NW'],
  },
  {
    id: 'firefighter-bipartite-tree',
    name: 'Binary Outbreak Tree (Firefighter Reduction)',
    badge: 'Firefighter NP-Hard Core',
    totalDays: 3,
    targetMaxWeight: 3,
    summaryLayman:
      'Two insurgent branches threaten to cascade down into the lower populace. Sending your army to key chokepoints cuts off the spread completely!',
    summaryRigorous:
      'Tree instance directly mirroring the Finbow et al. (2007) Firefighter reduction. Subtree expansion rate 2^d requires immediate chokepoint defense to bound total weight.',
    nodes: [
      { id: 'ROOT', label: 'Source', x: 380, y: 60 },
      { id: 'L1', label: 'Left Choke', x: 220, y: 160 },
      { id: 'R1', label: 'Right Choke', x: 540, y: 160 },
      { id: 'L1_A', label: 'Town A', x: 140, y: 290 },
      { id: 'L1_B', label: 'Town B', x: 280, y: 290 },
      { id: 'R1_C', label: 'Town C', x: 460, y: 290 },
      { id: 'R1_D', label: 'Town D', x: 620, y: 290 },
    ],
    edges: [
      ['ROOT', 'L1'], ['ROOT', 'R1'],
      ['L1', 'L1_A'], ['L1', 'L1_B'],
      ['R1', 'R1_C'], ['R1', 'R1_D'],
    ],
    initialInsurgentIds: ['ROOT'],
    optimalArmyStrategy: ['L1', 'R1', 'L1_A'],
  },
];

/**
 * Step-by-step state simulation of the Quell-The-Insurgency game.
 */
export function simulateInsurgencyDay(
  preset: InsurgencyPreset,
  currentWeights: Record<string, number>,
  visitedVertices: string[],
  armyTargetId: string,
  dayNumber: number
): {
  newWeights: Record<string, number>;
  newVisited: string[];
  record: DaySimulationRecord;
  totalWeight: number;
} {
  const weightsBefore = { ...currentWeights };
  const weightsAfterInsurgency = { ...currentWeights };

  // 1. INSURGENCY PHASE (Acts First):
  // Vertices with weight == 2 that started the day as 2 spread +1 to non-pacified neighbours.
  const spreadingInsurgents = preset.nodes.filter(
    (n) => (weightsBefore[n.id] || 0) === 2
  );

  const incrementCandidates = new Set<string>();

  for (const insurgent of spreadingInsurgents) {
    for (const [u, v] of preset.edges) {
      const neighbor = u === insurgent.id ? v : v === insurgent.id ? u : null;
      if (neighbor) {
        // Cannot infect permanently pacified vertices (weight == -1)
        if ((weightsBefore[neighbor] || 0) !== -1) {
          incrementCandidates.add(neighbor);
        }
      }
    }
  }

  // Each neighbor increases by at most +1, capped at 2
  for (const nid of incrementCandidates) {
    const current = weightsAfterInsurgency[nid] || 0;
    if (current >= 0 && current < 2) {
      weightsAfterInsurgency[nid] = Math.min(2, current + 1);
    }
  }

  // 2. DICTATOR ARMY PHASE:
  // Player sends army to unvisited vertex armyTargetId.
  const weightsAfterArmy = { ...weightsAfterInsurgency };
  let quelldCount = 0;

  if (armyTargetId && !visitedVertices.includes(armyTargetId)) {
    weightsAfterArmy[armyTargetId] = -1; // Permanently -1

    // Adjacent locations with 0 <= w <= 1 are set to 0!
    for (const [u, v] of preset.edges) {
      const neighbor = u === armyTargetId ? v : v === armyTargetId ? u : null;
      if (neighbor) {
        const w = weightsAfterArmy[neighbor];
        if (w >= 0 && w <= 1) {
          weightsAfterArmy[neighbor] = 0;
          quelldCount++;
        }
      }
    }
  }

  const newVisited = [...visitedVertices, armyTargetId].filter(Boolean);

  // Compute total positive weight (ignoring -1 pacified vertices)
  let totalWeight = 0;
  for (const nid of Object.keys(weightsAfterArmy)) {
    const w = weightsAfterArmy[nid] || 0;
    if (w > 0) totalWeight += w;
  }

  const record: DaySimulationRecord = {
    day: dayNumber,
    armyTargetId,
    weightsBeforeInsurgency: weightsBefore,
    weightsAfterInsurgency,
    weightsAfterArmy,
    totalWeight,
    quelldCount,
  };

  return {
    newWeights: weightsAfterArmy,
    newVisited,
    record,
    totalWeight,
  };
}
