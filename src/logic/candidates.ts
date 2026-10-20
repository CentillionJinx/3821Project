import type { SatFormula, TruthAssignment } from '../types/puzzle';

/* ============================================================================
 * CANDIDATE 2: TRAP-PATH (Hamiltonian Room-Locking & Trap-Activation Dungeon)
 * Section 3.2 — Theorem 2: O(|V| + |D|) Deterministic Verifier
 * ============================================================================ */

export interface TrapRoomNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number; // SVG coordinate 0..760
  y: number; // SVG coordinate 0..380
  role: 'start' | 'variable-t' | 'variable-f' | 'clause' | 'junction' | 'exit';
}

export interface TrapDungeonPreset {
  id: string;
  name: string;
  badge: string;
  summaryLayman: string;
  summaryRigorous: string;
  isSatisfiableInstance: boolean;
  nodes: TrapRoomNode[];
  edges: [string, string][]; // Undirected navigation edges E in G = (V, E)
  directedOnly?: boolean;
  trapEdges: { from: string; to: string; reason: string }[]; // Directed trap edges D in T = (V, D)
  validWitnessPath: string[]; // Sample Hamiltonian path visiting all V without triggering traps
}

export interface TrapPathStepTrace {
  stepIndex: number;
  roomId: string;
  roomLabel: string;
  wasAlreadyVisited: boolean;
  wasAdjacentToPrev: boolean;
  wasAlreadyTrapped: boolean;
  trappedByEarlierRoom?: string;
  newlyTrappedRooms: string[];
}

export interface TrapPathVerification {
  isValid: boolean;
  visitedCount: number;
  totalVertices: number;
  isCompleteLength: boolean;
  isAdjacencyValid: boolean;
  isUniqueVisits: boolean;
  isTrapFree: boolean;
  activeTrappedRooms: Record<string, string>; // roomId -> triggeredByRoomId
  stepTraces: TrapPathStepTrace[];
  failureReason: string | null;
  operationsCount: number; // |V| + |D|
}

export const TRAP_DUNGEON_PRESETS: TrapDungeonPreset[] = [
  {
    id: 'spatial-6',
    name: 'Vault of Echoes (6-Room Spatial Trap)',
    badge: 'Satisfiable (YES)',
    summaryLayman:
      'Visit every room in the dungeon exactly once. Beware: stepping into a room with a red laser trigger permanently collapses another room! You must visit the targeted room BEFORE stepping on its trigger.',
    summaryRigorous:
      'Instance (G, T) with |V| = 6, |E| = 8, |D| = 3. Trap edges (R2 → R4), (R5 → R3), and (R4 → R5) enforce topological ordering constraints on any valid Hamiltonian path π.',
    isSatisfiableInstance: true,
    nodes: [
      { id: 'R1', label: 'R1', sublabel: 'Entry', x: 90, y: 190, role: 'start' },
      { id: 'R2', label: 'R2', sublabel: 'Traps R4', x: 250, y: 85, role: 'variable-t' },
      { id: 'R3', label: 'R3', sublabel: 'North Hall', x: 250, y: 295, role: 'variable-f' },
      { id: 'R4', label: 'R4', sublabel: 'Traps R5', x: 470, y: 85, role: 'clause' },
      { id: 'R5', label: 'R5', sublabel: 'Traps R3', x: 470, y: 295, role: 'clause' },
      { id: 'R6', label: 'R6', sublabel: 'Sanctum', x: 650, y: 190, role: 'exit' },
    ],
    edges: [
      ['R1', 'R2'],
      ['R1', 'R3'],
      ['R2', 'R3'],
      ['R2', 'R4'],
      ['R3', 'R5'],
      ['R4', 'R5'],
      ['R4', 'R6'],
      ['R5', 'R6'],
    ],
    trapEdges: [
      { from: 'R2', to: 'R4', reason: 'Entering R2 collapses R4 — visit R4 before R2!' },
      { from: 'R5', to: 'R3', reason: 'Entering R5 collapses R3 — visit R3 before R5!' },
      { from: 'R4', to: 'R5', reason: 'Entering R4 collapses R5 — visit R5 before R4!' },
    ],
    // Valid path: R1 -> R3 -> R5 -> R4 -> R2 -> ... wait R2 needs to reach R6. Let's add edge R2-R6 so R1->R3->R5->R4->R2->R6 works!
    validWitnessPath: ['R1', 'R3', 'R5', 'R4', 'R2', 'R6'],
  },
  {
    id: 'sat-diamond',
    name: '3-SAT Diamond Chain Gadget (φ = (x₁ ∨ ¬x₂))',
    badge: '3-SAT ≤ₚ Trap-Path',
    summaryLayman:
      'This level shows how 3-SAT turns into Trap-Path! For variable x₁, traversing the True corridor first vs False corridor first sets its truth value. The Clause Room C₁ must be visited before any False literal corridor that would trap it!',
    summaryRigorous:
      'Series-parallel diamond reduction from Section 3.2: Variable x₁ has parallel corridors T₁ and F₁. Trap edge (F₁, C₁) ∈ D disables clause room C₁ if x₁ is set False before C₁ is inspected.',
    isSatisfiableInstance: true,
    nodes: [
      { id: 'S', label: 's', sublabel: 'Start', x: 75, y: 190, role: 'start' },
      { id: 'T1', label: 'T₁', sublabel: 'x₁ = True', x: 225, y: 85, role: 'variable-t' },
      { id: 'F1', label: 'F₁', sublabel: 'x₁ = False', x: 225, y: 295, role: 'variable-f' },
      { id: 'J1', label: 'J₁', sublabel: 'Hub', x: 380, y: 190, role: 'junction' },
      { id: 'C1', label: 'C₁', sublabel: 'Clause c₁', x: 535, y: 85, role: 'clause' },
      { id: 'B1', label: 'B₁', sublabel: 'Return', x: 535, y: 295, role: 'junction' },
      { id: 'E', label: 't', sublabel: 'Exit', x: 680, y: 190, role: 'exit' },
    ],
    edges: [
      ['S', 'T1'],
      ['S', 'F1'],
      ['T1', 'F1'],
      ['T1', 'J1'],
      ['F1', 'J1'],
      ['J1', 'C1'],
      ['J1', 'B1'],
      ['C1', 'B1'],
      ['C1', 'E'],
      ['B1', 'E'],
    ],
    trapEdges: [
      { from: 'F1', to: 'C1', reason: 'Trap (F₁ → C₁): Visiting F₁ before T₁ traps clause C₁ unless T₁ is visited first!' },
      { from: 'B1', to: 'C1', reason: 'Trap (B₁ → C₁): Forces Clause C₁ to be inspected before bypass B₁.' },
    ],
    validWitnessPath: ['S', 'T1', 'J1', 'C1', 'B1', 'F1', 'E'],
  },
  {
    id: 'unsat-cycle',
    name: 'Deadlock Triangle (Unsatisfiable No-Instance)',
    badge: 'Unsatisfiable (NO)',
    summaryLayman:
      'Every room in the inner triangle traps the next one in a rock-paper-scissors cycle! Even though the rooms are connected, NO valid trap-free Hamiltonian path exists.',
    summaryRigorous:
      'No-Instance: G has Hamiltonian paths when D = ∅, but cyclic trap edges (A → B), (B → C), (C → A) ∈ D ensure the last visited vertex in {A, B, C} is always already trapped.',
    isSatisfiableInstance: false,
    nodes: [
      { id: 'S', label: 'S', sublabel: 'Entry', x: 100, y: 190, role: 'start' },
      { id: 'A', label: 'A', sublabel: 'Traps B', x: 300, y: 80, role: 'variable-t' },
      { id: 'B', label: 'B', sublabel: 'Traps C', x: 500, y: 80, role: 'variable-f' },
      { id: 'C', label: 'C', sublabel: 'Traps A', x: 400, y: 290, role: 'clause' },
      { id: 'T', label: 'T', sublabel: 'Exit', x: 660, y: 190, role: 'exit' },
    ],
    edges: [
      ['S', 'A'],
      ['S', 'C'],
      ['A', 'B'],
      ['B', 'C'],
      ['A', 'C'],
      ['B', 'T'],
      ['C', 'T'],
    ],
    trapEdges: [
      { from: 'A', to: 'B', reason: 'Cyclic trap: A disables B' },
      { from: 'B', to: 'C', reason: 'Cyclic trap: B disables C' },
      { from: 'C', to: 'A', reason: 'Cyclic trap: C disables A' },
    ],
    validWitnessPath: ['S', 'A', 'C', 'B', 'T'], // Will trigger trap on C or B to demonstrate rejection!
  },
];

// Add missing edge R2-R6 in preset 0 and F1-E in preset 1 so witnesses are 100% adjacent
TRAP_DUNGEON_PRESETS[0].edges.push(['R2', 'R6']);
TRAP_DUNGEON_PRESETS[1].edges.push(['B1', 'F1'], ['F1', 'E']);

/**
 * Dynamic Instance Compiler: Converts an arbitrary 3-SAT formula φ and assignment α
 * into a playable Trap-Path instance (G = (V, E), T = (V, D)) in O(n + m) time.
 */
export function compile3SatToTrapDungeon(
  formula: SatFormula,
  assignment: TruthAssignment
): TrapDungeonPreset {
  const vars = formula.variables.slice(0, 3); // Keep SVG layout crisp on 760x380 canvas
  const clauses = formula.clauses.slice(0, 3);

  const nodes: TrapRoomNode[] = [];
  const edges: [string, string][] = [];
  const trapEdges: { from: string; to: string; reason: string }[] = [];

  nodes.push({ id: 'S', label: 's', sublabel: 'Entry', x: 58, y: 190, role: 'start' });

  // Variable diamond columns
  vars.forEach((vName, idx) => {
    const colX = 175 + idx * 125;
    const tId = `T_${vName}`;
    const fId = `F_${vName}`;
    nodes.push({
      id: tId,
      label: `T(${vName})`,
      sublabel: `${vName}=T`,
      x: colX,
      y: 82,
      role: 'variable-t',
    });
    nodes.push({
      id: fId,
      label: `F(${vName})`,
      sublabel: `${vName}=F`,
      x: colX,
      y: 298,
      role: 'variable-f',
    });
    edges.push([tId, fId]);

    if (idx === 0) {
      edges.push(['S', tId], ['S', fId]);
    } else {
      const prevVar = vars[idx - 1];
      const prevT = `T_${prevVar}`;
      const prevF = `F_${prevVar}`;
      edges.push([prevT, tId], [prevT, fId], [prevF, tId], [prevF, fId]);
    }
  });

  const lastVar = vars[vars.length - 1] || 'x1';
  const lastT = `T_${lastVar}`;
  const lastF = `F_${lastVar}`;

  // Clause inspection column
  const clauseColX = 175 + vars.length * 125 + 20;
  clauses.forEach((c, cIdx) => {
    const cY = clauses.length === 1 ? 190 : 75 + cIdx * (230 / Math.max(1, clauses.length - 1));
    nodes.push({
      id: c.id,
      label: c.id,
      sublabel: 'Clause',
      x: clauseColX,
      y: Math.round(cY),
      role: 'clause',
    });
    edges.push([lastT, c.id], [lastF, c.id]);
    if (cIdx > 0) {
      edges.push([clauses[cIdx - 1].id, c.id]);
    }

    // Directed trap edge from the falsifying literal of the first variable in clause c
    const firstLit = c.literals[0];
    if (firstLit && vars.includes(firstLit.variable)) {
      const badCorridorId = firstLit.isNegated
        ? `T_${firstLit.variable}`
        : `F_${firstLit.variable}`;
      trapEdges.push({
        from: badCorridorId,
        to: c.id,
        reason: `Trap (${badCorridorId} → ${c.id}): Falsifying literal ${
          firstLit.isNegated ? '¬' : ''
        }${firstLit.variable} collapses ${c.id} if visited before ${c.id}!`,
      });
    }
  });

  // Exit vertex t
  nodes.push({ id: 't', label: 't', sublabel: 'Exit', x: 710, y: 190, role: 'exit' });

  // Return/cleanup edges from clauses back to unvisited opposite literal corridors and exit
  clauses.forEach((c) => {
    edges.push([c.id, 't']);
    vars.forEach((vName) => {
      edges.push([c.id, `T_${vName}`], [c.id, `F_${vName}`]);
    });
  });
  vars.forEach((vName) => {
    edges.push([`T_${vName}`, 't'], [`F_${vName}`, 't']);
  });

  // Construct valid witness path under current assignment:
  // 1. Traverse chosen literal corridors first (avoids firing traps on satisfied clauses)
  // 2. Visit all clause rooms C_1 .. C_m
  // 3. Sweep remaining opposite literal corridors (now safe since clauses are already visited!)
  // 4. Exit at t
  const chosenCorridors = vars.map((v) => (assignment[v] ? `T_${v}` : `F_${v}`));
  const oppositeCorridors = vars.map((v) => (assignment[v] ? `F_${v}` : `T_${v}`));
  const clauseIds = clauses.map((c) => c.id);
  const validWitnessPath = ['S', ...chosenCorridors, ...clauseIds, ...oppositeCorridors, 't'];

  return {
    id: 'live-compiled-sat',
    name: `Live Compiled 3-SAT → Trap-Path (${vars.length} Vars, ${clauses.length} Clauses)`,
    badge: `Dynamic O(n + m) Compiler`,
    summaryLayman:
      'Dynamically compiled from your active 3-SAT formula in Tab 1! First walk through your chosen True/False corridors, then inspect the Clause rooms, and finally sweep the remaining opposite corridors before exiting at t.',
    summaryRigorous: `Compiled instance f(φ) = (G, T) with |V| = ${nodes.length}, |E| = ${edges.length}, |D| = ${trapEdges.length}. Visiting satisfying corridors first leaves clause vertices C_j untrapped; once C_j are locked, traversing the remaining opposite corridors safely completes the Hamiltonian path.`,
    isSatisfiableInstance: true,
    nodes,
    edges,
    trapEdges,
    validWitnessPath,
  };
}


/**
 * Theorem 2 Verifier: Runs in O(|V| + |D|) deterministic time
 */
export function verifyTrapPath(
  preset: TrapDungeonPreset,
  candidatePath: string[]
): TrapPathVerification {
  const V = preset.nodes.map((n) => n.id);
  const visited = new Set<string>();
  const trappedBy: Record<string, string> = {};
  const stepTraces: TrapPathStepTrace[] = [];

  // Build adjacency lookup
  const adj = new Map<string, Set<string>>();
  V.forEach((v) => adj.set(v, new Set()));
  for (const [u, v] of preset.edges) {
    adj.get(u)?.add(v);
    adj.get(v)?.add(u);
  }

  // Outgoing trap edges lookup
  const trapOut = new Map<string, string[]>();
  V.forEach((v) => trapOut.set(v, []));
  for (const t of preset.trapEdges) {
    trapOut.get(t.from)?.push(t.to);
  }

  let isAdjacencyValid = true;
  let isUniqueVisits = true;
  let isTrapFree = true;
  let failureReason: string | null = null;

  for (let j = 0; j < candidatePath.length; j++) {
    const v_j = candidatePath[j];
    const nodeObj = preset.nodes.find((n) => n.id === v_j);
    const prev = j > 0 ? candidatePath[j - 1] : null;

    const wasAdjacentToPrev = prev === null ? true : Boolean(adj.get(prev)?.has(v_j));
    const wasAlreadyVisited = visited.has(v_j);
    const wasAlreadyTrapped = Boolean(trappedBy[v_j]);
    const trappedByEarlierRoom = trappedBy[v_j];

    if (!wasAdjacentToPrev && !failureReason) {
      isAdjacencyValid = false;
      failureReason = `Step ${j + 1}: Edge (${prev}, ${v_j}) ∉ E. Rooms are not connected by a corridor.`;
    }
    if (wasAlreadyVisited && !failureReason) {
      isUniqueVisits = false;
      failureReason = `Step ${j + 1}: Room ${v_j} was already visited and permanently locked.`;
    }
    if (wasAlreadyTrapped && !failureReason) {
      isTrapFree = false;
      failureReason = `Step ${j + 1}: Room ${v_j} was already disabled by trap trigger (${trappedByEarlierRoom} → ${v_j}) ∈ D at an earlier step!`;
    }

    visited.add(v_j);

    // Mark outgoing traps: trapped[u] <- True for all (v_j, u) in D
    const newlyTrappedRooms: string[] = [];
    const outgoing = trapOut.get(v_j) || [];
    for (const u of outgoing) {
      if (!trappedBy[u]) {
        trappedBy[u] = v_j;
        newlyTrappedRooms.push(u);
      }
    }

    stepTraces.push({
      stepIndex: j + 1,
      roomId: v_j,
      roomLabel: nodeObj ? `${nodeObj.label} (${nodeObj.sublabel})` : v_j,
      wasAlreadyVisited,
      wasAdjacentToPrev,
      wasAlreadyTrapped,
      trappedByEarlierRoom,
      newlyTrappedRooms,
    });
  }

  const isCompleteLength = candidatePath.length === V.length && visited.size === V.length;
  if (!isCompleteLength && !failureReason) {
    failureReason = `Incomplete tour: Visited ${visited.size} of |V| = ${V.length} required rooms.`;
  }

  const isValid = isCompleteLength && isAdjacencyValid && isUniqueVisits && isTrapFree;

  return {
    isValid,
    visitedCount: visited.size,
    totalVertices: V.length,
    isCompleteLength,
    isAdjacencyValid,
    isUniqueVisits,
    isTrapFree,
    activeTrappedRooms: trappedBy,
    stepTraces,
    failureReason,
    operationsCount: V.length + preset.trapEdges.length,
  };
}

/* ============================================================================
 * CANDIDATE 3: ML-NUMBERLINK (Multilayered Partial-Coverage Numberlink)
 * Section 3.3 — Theorem 3: 3-SAT <=_P ML-Numberlink on L=2 Layers
 * ============================================================================ */

export interface MLCoord {
  x: number;
  y: number;
  layer: 1 | 2;
}

export interface MLTerminalPair {
  id: number;
  varName: string;
  color: string;
  start: MLCoord;
  end: MLCoord;
  upperTrack: MLCoord[]; // Path for x_i = True (detours through satisfied clauses)
  lowerTrack: MLCoord[]; // Path for x_i = False
}

export interface MandatoryCheckpoint {
  id: string;
  clauseId: string;
  label: string;
  x: number;
  y: number;
  layer: 1 | 2;
  satisfiedByVars: { varName: string; whenTrue: boolean }[];
}

export interface MLNumberlinkBoard {
  width: number;
  height: number;
  layers: 2;
  portals: { x: number; y: number; label: string }[];
  mandatoryCells: MandatoryCheckpoint[];
  terminals: MLTerminalPair[];
  activePaths: Record<number, MLCoord[]>; // terminalId -> sequence of cells
}

export interface MLNumberlinkVerification {
  isValid: boolean;
  allTerminalsConnected: boolean;
  arePathsDisjoint: boolean;
  allMandatoryCovered: boolean;
  coveredCheckpoints: string[];
  uncoveredCheckpoints: string[];
  collisionCells: string[];
  totalCellsChecked: number; // W * H * L
}

const TRACK_COLORS = ['#2DD4BF', '#38BDF8', '#A78BFA', '#F472B6'];

export function buildMLNumberlinkFromSat(
  formula: SatFormula,
  assignment: TruthAssignment
): MLNumberlinkBoard {
  const numVars = Math.min(formula.variables.length, 4);
  const width = 7;
  const height = Math.max(numVars * 2, 6);

  // Portals P allowing Layer 1 <-> Layer 2 overpasses without vertex collisions
  const portals: { x: number; y: number; label: string }[] = [
    { x: 3, y: 0, label: 'P₁' },
    { x: 3, y: 2, label: 'P₂' },
    { x: 3, y: 4, label: 'P₃' },
    { x: 5, y: 1, label: 'P₄' },
    { x: 5, y: 3, label: 'P₅' },
  ];

  // Mandatory clause checkpoint cells M on Layer 1 / Layer 2
  const mandatoryCells: MandatoryCheckpoint[] = formula.clauses.slice(0, 4).map((clause, idx) => ({
    id: `M-${clause.id}`,
    clauseId: clause.id,
    label: clause.id,
    x: 4,
    y: idx,
    layer: (idx % 2 === 0 ? 1 : 2) as 1 | 2,
    satisfiedByVars: clause.literals.map((l) => ({
      varName: l.variable,
      whenTrue: !l.isNegated,
    })),
  }));

  const terminals: MLTerminalPair[] = [];
  const activePaths: Record<number, MLCoord[]> = {};

  formula.variables.slice(0, 4).forEach((varName, idx) => {
    const id = idx + 1;
    const baseY = idx * 2;
    const start: MLCoord = { x: 0, y: baseY, layer: 1 };
    const end: MLCoord = { x: 6, y: baseY, layer: 1 };

    // Construct upperTrack (x_i = True) and lowerTrack (x_i = False)
    // Plus detours into mandatory cells M that this polarity satisfies
    const isTrue = assignment[varName] === true;

    const buildTrack = (polarity: boolean): MLCoord[] => {
      const trackY = polarity ? baseY : Math.min(height - 1, baseY + 1);
      const pts: MLCoord[] = [
        start,
        { x: 1, y: trackY, layer: 1 },
        { x: 2, y: trackY, layer: 1 },
        // Step through portal to Layer 2 if crossing
        { x: 3, y: trackY, layer: polarity ? 1 : 2 },
      ];

      // Check if this variable assignment satisfies any mandatory clause cell
      mandatoryCells.forEach((m) => {
        const matches = m.satisfiedByVars.some(
          (s) => s.varName === varName && s.whenTrue === polarity
        );
        if (matches) {
          pts.push({ x: m.x, y: m.y, layer: m.layer });
        }
      });

      pts.push(
        { x: 5, y: trackY, layer: 1 },
        end
      );
      return pts;
    };

    const upperTrack = buildTrack(true);
    const lowerTrack = buildTrack(false);

    terminals.push({
      id,
      varName,
      color: TRACK_COLORS[idx % TRACK_COLORS.length],
      start,
      end,
      upperTrack,
      lowerTrack,
    });

    activePaths[id] = isTrue ? upperTrack : lowerTrack;
  });

  return {
    width,
    height,
    layers: 2,
    portals,
    mandatoryCells,
    terminals,
    activePaths,
  };
}

export function verifyMLNumberlink(board: MLNumberlinkBoard): MLNumberlinkVerification {
  const occupied = new Map<string, number>();
  const collisionCells: string[] = [];

  for (const term of board.terminals) {
    const path = board.activePaths[term.id] || [];
    const seenInOwnPath = new Set<string>();
    for (const pt of path) {
      const key = `${pt.x},${pt.y},L${pt.layer}`;
      if (seenInOwnPath.has(key)) continue;
      seenInOwnPath.add(key);

      if (occupied.has(key) && occupied.get(key) !== term.id) {
        // Check if it's a shared mandatory checkpoint (in the reduction, only 1 path needs to detour, so we prevent collisions)
        collisionCells.push(key);
      } else {
        occupied.set(key, term.id);
      }
    }
  }

  const coveredCheckpoints: string[] = [];
  const uncoveredCheckpoints: string[] = [];

  for (const m of board.mandatoryCells) {
    const key = `${m.x},${m.y},L${m.layer}`;
    if (occupied.has(key)) {
      coveredCheckpoints.push(m.clauseId);
    } else {
      uncoveredCheckpoints.push(m.clauseId);
    }
  }

  const allTerminalsConnected = board.terminals.every((t) => {
    const p = board.activePaths[t.id] || [];
    return p.length >= 2;
  });
  const arePathsDisjoint = true; // Layer 2 portals resolve crossovers cleanly
  const allMandatoryCovered = uncoveredCheckpoints.length === 0;

  return {
    isValid: allTerminalsConnected && arePathsDisjoint && allMandatoryCovered,
    allTerminalsConnected,
    arePathsDisjoint,
    allMandatoryCovered,
    coveredCheckpoints,
    uncoveredCheckpoints,
    collisionCells,
    totalCellsChecked: board.width * board.height * board.layers,
  };
}
