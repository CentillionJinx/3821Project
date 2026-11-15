export type Bit = 0 | 1;
export type TileValue = Bit | null;
export type ClueValue = 0 | 2 | 4;
export type CellRole = 'spine' | 'wire' | 'inverter' | 'clause' | 'anchor' | 'free';

export interface CornerClue {
  /** 1-indexed interior row intersection (1..rows-1) */
  row: number;
  /** 1-indexed interior col intersection (1..cols-1) */
  col: number;
  target: ClueValue;
  tag?: string;
}

export interface ClauseMeta {
  variables: string[];
  clauses: string[];
  /** Spine row pairs per variable for extracting witness bits */
  spineCells: Array<{ row: number; col: number }>;
}

export interface ConundrumInstance {
  id: string;
  name: string;
  subtitle: string;
  rows: number;
  cols: number;
  fixed: Record<string, Bit>;
  clues: CornerClue[];
  roles?: Record<string, CellRole>;
  description: string;
  isSatisfiable: boolean;
  clauseMeta?: ClauseMeta;
}

export type ClueStatus = 'satisfied' | 'violated' | 'infeasible' | 'pending';

export interface ClueAudit {
  row: number;
  col: number;
  target: ClueValue;
  tag?: string;
  /** Clockwise 2x2 cells: [top-left, top-right, bottom-right, bottom-left] */
  cells: [TileValue, TileValue, TileValue, TileValue];
  actualTau: ClueValue | null;
  validCompletions: number;
  status: ClueStatus;
  activeCutDegree: number;
}

export interface CutEdge {
  orientation: 'v' | 'h';
  /** For 'v', segment between (row, col-1) and (row, col) at x=col, y=row..row+1.
   *  For 'h', segment between (row-1, col) and (row, col) at y=row, x=col..col+1. */
  row: number;
  col: number;
}

export type Verdict = 'ACCEPT' | 'REJECT' | 'INFEASIBLE' | 'INCOMPLETE';

export interface ConundrumVerification {
  verdict: Verdict;
  filledCount: number;
  totalCells: number;
  satisfiedClues: number;
  violatedClues: number;
  infeasibleClues: number;
  pendingClues: number;
  fixedViolations: number;
  fixedConflictKeys: string[];
  clueResults: ClueAudit[];
  cutEdges: CutEdge[];
  opsBreakdown: {
    anchorChecks: number;
    clueChecks: number;
    partialCompletionChecks: number;
    totalOps: number;
  };
}

export interface SolverResult {
  status: 'SAT' | 'UNSAT';
  solution: Bit[][] | null;
  searchNodes: number;
  componentsCount: number;
  unsatReason?: string;
}

export interface TruthStateEntry {
  a: Bit;
  b: Bit;
  c: Bit;
  d: Bit;
  tau: ClueValue;
  relation: 'R0' | 'R2' | 'R4';
  diagAC: Bit;
  diagBD: Bit;
}

export function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function parseCellKey(key: string): [number, number] {
  const [r, c] = key.split(',').map(Number);
  return [r, c];
}

/**
 * Boundary-transition functional:
 * tau(a, b, c, d) = (a xor b) + (b xor c) + (c xor d) + (d xor a) in {0, 2, 4}.
 */
export function tau(a: Bit, b: Bit, c: Bit, d: Bit): ClueValue {
  return ((a ^ b) + (b ^ c) + (c ^ d) + (d ^ a)) as ClueValue;
}

export const ALL_2X2_STATES: ReadonlyArray<TruthStateEntry> = (() => {
  const rows: TruthStateEntry[] = [];
  for (let mask = 0; mask < 16; mask += 1) {
    const a = ((mask >> 3) & 1) as Bit;
    const b = ((mask >> 2) & 1) as Bit;
    const c = ((mask >> 1) & 1) as Bit;
    const d = (mask & 1) as Bit;
    const t = tau(a, b, c, d);
    const relation = t === 0 ? 'R0' : t === 4 ? 'R4' : 'R2';
    rows.push({
      a,
      b,
      c,
      d,
      tau: t,
      relation,
      diagAC: (a ^ c) as Bit,
      diagBD: (b ^ d) as Bit,
    });
  }
  return rows;
})();

export function createInitialBoard(instance: ConundrumInstance): TileValue[][] {
  const board: TileValue[][] = [];
  for (let r = 0; r < instance.rows; r += 1) {
    const row: TileValue[] = [];
    for (let c = 0; c < instance.cols; c += 1) {
      const key = cellKey(r, c);
      row.push(Object.hasOwn(instance.fixed, key) ? instance.fixed[key] : null);
    }
    board.push(row);
  }
  return board;
}

export function cloneBoard(board: TileValue[][]): TileValue[][] {
  return board.map((row) => [...row]);
}

function countEdgeCutDegree(
  a: TileValue,
  b: TileValue,
  c: TileValue,
  d: TileValue,
): number {
  let degree = 0;
  if (a !== null && b !== null && a !== b) degree += 1;
  if (b !== null && c !== null && b !== c) degree += 1;
  if (c !== null && d !== null && c !== d) degree += 1;
  if (d !== null && a !== null && d !== a) degree += 1;
  return degree;
}

/**
 * Deterministic polynomial-time O(N * M) verifier for Binary XOR-Square,
 * enhanced with exact O(1) partial-block infeasibility detection (at most 16 completions per block).
 */
export function verifyConundrum(
  instance: ConundrumInstance,
  board: TileValue[][],
): ConundrumVerification {
  let filledCount = 0;
  const totalCells = instance.rows * instance.cols;

  for (let r = 0; r < instance.rows; r += 1) {
    for (let c = 0; c < instance.cols; c += 1) {
      if (board[r]?.[c] !== null && board[r]?.[c] !== undefined) {
        filledCount += 1;
      }
    }
  }

  let anchorChecks = 0;
  const fixedConflictKeys: string[] = [];
  for (const [key, expected] of Object.entries(instance.fixed)) {
    anchorChecks += 1;
    const [r, c] = parseCellKey(key);
    const val = board[r]?.[c] ?? null;
    if (val !== expected) {
      fixedConflictKeys.push(key);
    }
  }

  let clueChecks = 0;
  let partialCompletionChecks = 0;
  let satisfiedClues = 0;
  let violatedClues = 0;
  let infeasibleClues = 0;
  let pendingClues = 0;

  const clueResults: ClueAudit[] = instance.clues.map((clue) => {
    clueChecks += 1;
    const a = board[clue.row - 1]?.[clue.col - 1] ?? null;
    const b = board[clue.row - 1]?.[clue.col] ?? null;
    const c = board[clue.row]?.[clue.col] ?? null;
    const d = board[clue.row]?.[clue.col - 1] ?? null;
    const cells: [TileValue, TileValue, TileValue, TileValue] = [a, b, c, d];
    const activeCutDegree = countEdgeCutDegree(a, b, c, d);

    if (a !== null && b !== null && c !== null && d !== null) {
      const actualTau = tau(a, b, c, d);
      const ok = actualTau === clue.target;
      if (ok) {
        satisfiedClues += 1;
      } else {
        violatedClues += 1;
      }
      return {
        row: clue.row,
        col: clue.col,
        target: clue.target,
        tag: clue.tag,
        cells,
        actualTau,
        validCompletions: ok ? 1 : 0,
        status: ok ? 'satisfied' : 'violated',
        activeCutDegree,
      };
    }

    // Enumerate up to 2^k <= 16 completions of unset cells in this 2x2 block
    const unsetIndices: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      if (cells[i] === null) unsetIndices.push(i);
    }
    const limit = 1 << unsetIndices.length;
    let validCompletions = 0;
    const buf: [Bit, Bit, Bit, Bit] = [
      (a ?? 0) as Bit,
      (b ?? 0) as Bit,
      (c ?? 0) as Bit,
      (d ?? 0) as Bit,
    ];

    for (let mask = 0; mask < limit; mask += 1) {
      partialCompletionChecks += 1;
      for (let bitIdx = 0; bitIdx < unsetIndices.length; bitIdx += 1) {
        buf[unsetIndices[bitIdx]] = ((mask >> bitIdx) & 1) as Bit;
      }
      if (tau(buf[0], buf[1], buf[2], buf[3]) === clue.target) {
        validCompletions += 1;
      }
    }

    const status: ClueStatus = validCompletions === 0 ? 'infeasible' : 'pending';
    if (status === 'infeasible') {
      infeasibleClues += 1;
    } else {
      pendingClues += 1;
    }

    return {
      row: clue.row,
      col: clue.col,
      target: clue.target,
      tag: clue.tag,
      cells,
      actualTau: null,
      validCompletions,
      status,
      activeCutDegree,
    };
  });

  // Compute active dual edge cuts E_cut(chi) on orthogonally adjacent assigned tiles
  const cutEdges: CutEdge[] = [];
  for (let r = 0; r < instance.rows; r += 1) {
    for (let c = 0; c < instance.cols; c += 1) {
      const u = board[r]?.[c] ?? null;
      if (u === null) continue;
      if (c + 1 < instance.cols) {
        const right = board[r]?.[c + 1] ?? null;
        if (right !== null && right !== u) {
          cutEdges.push({ orientation: 'v', row: r, col: c + 1 });
        }
      }
      if (r + 1 < instance.rows) {
        const down = board[r + 1]?.[c] ?? null;
        if (down !== null && down !== u) {
          cutEdges.push({ orientation: 'h', row: r + 1, col: c });
        }
      }
    }
  }

  const fixedViolations = fixedConflictKeys.length;
  const totalConflicts = violatedClues + infeasibleClues + fixedViolations;
  const allFilled = filledCount === totalCells;

  let verdict: Verdict;
  if (allFilled) {
    verdict = totalConflicts === 0 ? 'ACCEPT' : 'REJECT';
  } else {
    verdict = totalConflicts > 0 ? 'INFEASIBLE' : 'INCOMPLETE';
  }

  return {
    verdict,
    filledCount,
    totalCells,
    satisfiedClues,
    violatedClues,
    infeasibleClues,
    pendingClues,
    fixedViolations,
    fixedConflictKeys,
    clueResults,
    cutEdges,
    opsBreakdown: {
      anchorChecks,
      clueChecks,
      partialCompletionChecks,
      totalOps: anchorChecks + clueChecks + partialCompletionChecks,
    },
  };
}

interface ParityDSU {
  parent: Int32Array;
  parity: Uint8Array;
  find: (x: number) => number;
  union: (u: number, v: number, rel: Bit) => boolean;
}

function createParityDSU(size: number): ParityDSU {
  const parent = new Int32Array(size);
  const parity = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) {
    parent[i] = i;
    parity[i] = 0;
  }

  function find(x: number): number {
    if (parent[x] === x) return x;
    const root = find(parent[x]);
    parity[x] = (parity[x] ^ parity[parent[x]]) as Bit;
    parent[x] = root;
    return root;
  }

  function union(u: number, v: number, rel: Bit): boolean {
    const ru = find(u);
    const rv = find(v);
    if (ru === rv) {
      return (parity[u] ^ parity[v]) === rel;
    }
    parent[rv] = ru;
    parity[rv] = (parity[u] ^ parity[v] ^ rel) as Bit;
    return true;
  }

  return { parent, parity, find, union };
}

interface Literal {
  comp: number;
  flip: Bit;
}

interface R2Clause {
  a: Literal;
  b: Literal;
  c: Literal;
  d: Literal;
}

/**
 * Exact solver:
 * 1. Collapses all r = 0 (equality) and r = 4 (checkerboard parity) clues via Parity Union-Find.
 * 2. Applies fixed anchors and detects linear GF(2) contradictions immediately.
 * 3. Uses the Diagonal Characterization of R2 ((a xor c) | (b xor d) = 1) with unit propagation
 *    and MRV backtracking over the compressed component variables.
 */
export function solveConundrum(
  instance: ConundrumInstance,
  extraFixed?: Record<string, Bit>,
): SolverResult {
  const n = instance.rows * instance.cols;
  const dsu = createParityDSU(n);
  const idx = (r: number, c: number) => r * instance.cols + c;

  // Step 1: Collapse R0 and R4 constraints
  for (const clue of instance.clues) {
    if (clue.target === 2) continue;
    const a = idx(clue.row - 1, clue.col - 1);
    const b = idx(clue.row - 1, clue.col);
    const c = idx(clue.row, clue.col);
    const d = idx(clue.row, clue.col - 1);
    const rel: Bit = clue.target === 0 ? 0 : 1;

    if (!dsu.union(a, b, rel) || !dsu.union(b, c, rel) || !dsu.union(c, d, rel)) {
      return {
        status: 'UNSAT',
        solution: null,
        searchNodes: 0,
        componentsCount: n,
        unsatReason: `GF(2) parity cycle conflict at corner (${clue.row}, ${clue.col}) with r=${clue.target}.`,
      };
    }
  }

  // Step 2: Build compact component table and enforce anchors
  const rootToComp = new Map<number, number>();
  const cellComp = new Int32Array(n);
  const cellFlip = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    const root = dsu.find(i);
    let compId = rootToComp.get(root);
    if (compId === undefined) {
      compId = rootToComp.size;
      rootToComp.set(root, compId);
    }
    cellComp[i] = compId;
    cellFlip[i] = dsu.parity[i];
  }

  const numComps = rootToComp.size;
  const compVal = new Int8Array(numComps).fill(-1);

  const applyFixedMap = (fixedMap: Record<string, Bit>): string | null => {
    for (const [key, bit] of Object.entries(fixedMap)) {
      const [r, c] = parseCellKey(key);
      if (r < 0 || r >= instance.rows || c < 0 || c >= instance.cols) continue;
      const id = idx(r, c);
      const compId = cellComp[id];
      const reqCompVal = (bit ^ cellFlip[id]) as Bit;
      if (compVal[compId] !== -1 && compVal[compId] !== reqCompVal) {
        return `Fixed anchor (${r}, ${c}) = ${bit} conflicts with parity component ${compId}.`;
      }
      compVal[compId] = reqCompVal;
    }
    return null;
  };

  const fixedErr = applyFixedMap(instance.fixed);
  if (fixedErr) {
    return {
      status: 'UNSAT',
      solution: null,
      searchNodes: 0,
      componentsCount: numComps,
      unsatReason: fixedErr,
    };
  }
  if (extraFixed) {
    const extraErr = applyFixedMap(extraFixed);
    if (extraErr) {
      return {
        status: 'UNSAT',
        solution: null,
        searchNodes: 0,
        componentsCount: numComps,
        unsatReason: extraErr,
      };
    }
  }

  // Step 3: Translate r = 2 clues into R2 component clauses
  const clauses: R2Clause[] = [];
  const compDegree = new Int32Array(numComps);
  const compToClauses: number[][] = Array.from({ length: numComps }, () => []);

  for (const clue of instance.clues) {
    if (clue.target !== 2) continue;
    const ia = idx(clue.row - 1, clue.col - 1);
    const ib = idx(clue.row - 1, clue.col);
    const ic = idx(clue.row, clue.col);
    const id = idx(clue.row, clue.col - 1);

    const a: Literal = { comp: cellComp[ia], flip: cellFlip[ia] as Bit };
    const b: Literal = { comp: cellComp[ib], flip: cellFlip[ib] as Bit };
    const c: Literal = { comp: cellComp[ic], flip: cellFlip[ic] as Bit };
    const d: Literal = { comp: cellComp[id], flip: cellFlip[id] as Bit };

    // Immediate algebraic checks when a diagonal shares a component
    const acAlwaysFalse = a.comp === c.comp && a.flip === c.flip;
    const acAlwaysTrue = a.comp === c.comp && a.flip !== c.flip;
    const bdAlwaysFalse = b.comp === d.comp && b.flip === d.flip;
    const bdAlwaysTrue = b.comp === d.comp && b.flip !== d.flip;

    if (acAlwaysTrue || bdAlwaysTrue) continue;
    if (acAlwaysFalse && bdAlwaysFalse) {
      return {
        status: 'UNSAT',
        solution: null,
        searchNodes: 0,
        componentsCount: numComps,
        unsatReason: `Diagonal collapse at corner (${clue.row}, ${clue.col}) forces r ≠ 2.`,
      };
    }

    const clIdx = clauses.length;
    clauses.push({ a, b, c, d });
    const touched = new Set([a.comp, b.comp, c.comp, d.comp]);
    for (const compId of touched) {
      compDegree[compId] += 1;
      compToClauses[compId].push(clIdx);
    }
  }

  // Step 4: DPLL + unit propagation on diagonal XOR-pairs
  const trail: number[] = [];
  let searchNodes = 0;

  const evalLit = (lit: Literal): number => {
    const v = compVal[lit.comp];
    return v === -1 ? -1 : v ^ lit.flip;
  };

  /**
   * Checks a single R2 clause: (a != c) | (b != d).
   * Returns false on contradiction; pushes forced assignments onto trail.
   */
  const propagateClause = (cl: R2Clause, queue: number[]): boolean => {
    const va = evalLit(cl.a);
    const vb = evalLit(cl.b);
    const vc = evalLit(cl.c);
    const vd = evalLit(cl.d);

    const acTrue = va !== -1 && vc !== -1 && va !== vc;
    const bdTrue = vb !== -1 && vd !== -1 && vb !== vd;
    if (acTrue || bdTrue) return true;

    const acFalse = va !== -1 && vc !== -1 && va === vc;
    const bdFalse = vb !== -1 && vd !== -1 && vb === vd;

    if (acFalse && bdFalse) return false;

    // If one diagonal is forced equal (false), the other diagonal must differ!
    if (acFalse) {
      if (vb !== -1 && vd === -1) {
        const req = (vb ^ 1 ^ cl.d.flip) as Bit;
        compVal[cl.d.comp] = req;
        trail.push(cl.d.comp);
        queue.push(cl.d.comp);
      } else if (vd !== -1 && vb === -1) {
        const req = (vd ^ 1 ^ cl.b.flip) as Bit;
        compVal[cl.b.comp] = req;
        trail.push(cl.b.comp);
        queue.push(cl.b.comp);
      } else if (cl.b.comp === cl.d.comp && cl.b.flip === cl.d.flip) {
        return false;
      }
    }

    if (bdFalse) {
      if (va !== -1 && vc === -1) {
        const req = (va ^ 1 ^ cl.c.flip) as Bit;
        compVal[cl.c.comp] = req;
        trail.push(cl.c.comp);
        queue.push(cl.c.comp);
      } else if (vc !== -1 && va === -1) {
        const req = (vc ^ 1 ^ cl.a.flip) as Bit;
        compVal[cl.a.comp] = req;
        trail.push(cl.a.comp);
        queue.push(cl.a.comp);
      } else if (cl.a.comp === cl.c.comp && cl.a.flip === cl.c.flip) {
        return false;
      }
    }

    return true;
  };

  const propagateFromAllInitial = (): boolean => {
    const queue: number[] = [];
    for (let clIdx = 0; clIdx < clauses.length; clIdx += 1) {
      if (!propagateClause(clauses[clIdx], queue)) return false;
    }
    let head = 0;
    while (head < queue.length) {
      const cId = queue[head++];
      for (const clIdx of compToClauses[cId]) {
        if (!propagateClause(clauses[clIdx], queue)) return false;
      }
    }
    return true;
  };

  const assignAndPropagate = (compId: number, val: Bit): boolean => {
    compVal[compId] = val;
    trail.push(compId);
    const queue = [compId];
    let head = 0;
    while (head < queue.length) {
      const cId = queue[head++];
      for (const clIdx of compToClauses[cId]) {
        if (!propagateClause(clauses[clIdx], queue)) return false;
      }
    }
    return true;
  };

  const undoTo = (mark: number) => {
    while (trail.length > mark) {
      const compId = trail.pop()!;
      compVal[compId] = -1;
    }
  };

  // Order constrained free components by descending R2 degree
  const constrainedComps: number[] = [];
  const freeComps: number[] = [];
  for (let i = 0; i < numComps; i += 1) {
    if (compDegree[i] > 0) constrainedComps.push(i);
    else freeComps.push(i);
  }
  constrainedComps.sort((u, v) => compDegree[v] - compDegree[u]);

  const search = (): boolean => {
    searchNodes += 1;
    let nextComp = -1;
    for (const cId of constrainedComps) {
      if (compVal[cId] === -1) {
        nextComp = cId;
        break;
      }
    }

    if (nextComp === -1) {
      return true;
    }

    const mark = trail.length;
    for (const candidate of [0, 1] as const) {
      if (assignAndPropagate(nextComp, candidate)) {
        if (search()) return true;
      }
      undoTo(mark);
    }
    return false;
  };

  if (!propagateFromAllInitial() || !search()) {
    return {
      status: 'UNSAT',
      solution: null,
      searchNodes,
      componentsCount: numComps,
      unsatReason: 'All component branches violated at least one R2 (r = 2) diagonal constraint.',
    };
  }

  // Assign 0 to completely unconstrained components
  for (const cId of freeComps) {
    if (compVal[cId] === -1) compVal[cId] = 0;
  }

  const solution: Bit[][] = [];
  for (let r = 0; r < instance.rows; r += 1) {
    const row: Bit[] = [];
    for (let c = 0; c < instance.cols; c += 1) {
      const id = idx(r, c);
      row.push((compVal[cellComp[id]] ^ cellFlip[id]) as Bit);
    }
    solution.push(row);
  }

  return {
    status: 'SAT',
    solution,
    searchNodes,
    componentsCount: numComps,
  };
}

/**
 * Exhaustive brute-force solution counter for small grids (rows * cols <= 20).
 */
export function bruteForceSolutions(
  instance: ConundrumInstance,
  maxSolutions = 100,
): Bit[][][] {
  const total = instance.rows * instance.cols;
  if (total > 20) {
    throw new Error('Brute force enumeration is restricted to grids with <= 20 tiles.');
  }

  const solutions: Bit[][][] = [];
  const board: TileValue[][] = createInitialBoard(instance);
  const unset: Array<[number, number]> = [];
  for (let r = 0; r < instance.rows; r += 1) {
    for (let c = 0; c < instance.cols; c += 1) {
      if (board[r][c] === null) unset.push([r, c]);
    }
  }

  const limit = 1 << unset.length;
  for (let mask = 0; mask < limit; mask += 1) {
    for (let k = 0; k < unset.length; k += 1) {
      const [r, c] = unset[k];
      board[r][c] = ((mask >> k) & 1) as Bit;
    }
    const v = verifyConundrum(instance, board);
    if (v.verdict === 'ACCEPT') {
      solutions.push(board.map((row) => [...row] as Bit[]));
      if (solutions.length >= maxSolutions) break;
    }
  }
  return solutions;
}

export const BASE_PRESETS: ConundrumInstance[] = [
  {
    id: 'parity-pair',
    name: 'Parity Pair 4×4',
    subtitle: 'All three clue classes {0, 2, 4} · Unique solution',
    rows: 4,
    cols: 4,
    fixed: {
      '0,0': 0,
      '3,3': 1,
    },
    clues: [
      { row: 1, col: 1, target: 4, tag: 'R4 top-left' },
      { row: 1, col: 2, target: 4, tag: 'R4 top-mid' },
      { row: 1, col: 3, target: 4, tag: 'R4 top-right' },
      { row: 2, col: 1, target: 4, tag: 'R4 mid-left' },
      { row: 2, col: 2, target: 2, tag: 'R2 bridge' },
      { row: 3, col: 1, target: 4, tag: 'R4 bot-left' },
      { row: 3, col: 2, target: 2, tag: 'R2 join' },
      { row: 3, col: 3, target: 0, tag: 'R0 anchor' },
    ],
    description:
      'Propagates checkerboard parity via r = 4 from (0,0) = 0, locks the bottom-right block to 1 via r = 0, and bridges both regions through r = 2.',
    isSatisfiable: true,
  },
  {
    id: 'clause-core',
    name: 'Clause Core 3×3',
    subtitle: 'Gadget G3: (x ∨ y ∨ z) · Fixed anchor (1,0) = 1',
    rows: 3,
    cols: 3,
    fixed: {
      '1,0': 1,
    },
    clues: [
      { row: 1, col: 1, target: 2, tag: 'G3 left' },
      { row: 1, col: 2, target: 2, tag: 'G3 right' },
      { row: 2, col: 2, target: 0, tag: 'z lock' },
    ],
    roles: {
      '0,0': 'clause',
      '0,1': 'clause',
      '0,2': 'clause',
      '1,0': 'anchor',
      '1,1': 'clause',
      '1,2': 'clause',
      '2,0': 'free',
      '2,1': 'clause',
      '2,2': 'clause',
    },
    description:
      'Exact 3-literal OR gadget. Let x = (0,0), y = (0,2), and z = (1,1)=(1,2)=(2,1)=(2,2). A valid bit w = (0,1) exists iff (x ∨ y ∨ z) = 1.',
    isSatisfiable: true,
  },
  {
    id: 'dual-cut',
    name: 'Dual Cut Study 5×5',
    subtitle: 'Edge-cut loop topology · τ = deg_cut(#)',
    rows: 5,
    cols: 5,
    fixed: {
      '0,0': 0,
      '2,2': 1,
      '4,4': 0,
    },
    clues: [
      { row: 1, col: 1, target: 2 },
      { row: 1, col: 2, target: 2 },
      { row: 1, col: 3, target: 2 },
      { row: 1, col: 4, target: 0 },
      { row: 2, col: 1, target: 2 },
      { row: 2, col: 2, target: 0 },
      { row: 2, col: 4, target: 2 },
      { row: 3, col: 1, target: 0 },
      { row: 3, col: 3, target: 2 },
      { row: 3, col: 4, target: 2 },
      { row: 4, col: 2, target: 2 },
      { row: 4, col: 3, target: 2 },
    ],
    description:
      'Toggle Edge Cuts in the board footer to see every clue value r ∈ {0, 2, 4} match the exact count of black–white boundary edges meeting at that interior corner.',
    isSatisfiable: true,
  },
  {
    id: 'unsat-obstruction',
    name: 'Unsat Obstruction 4×4',
    subtitle: 'Provably unsatisfiable · Adjacent R0/R4 parity clash',
    rows: 4,
    cols: 4,
    fixed: {
      '0,0': 0,
      '3,3': 1,
    },
    clues: [
      { row: 1, col: 1, target: 0, tag: 'forces (0,1)=(1,1)' },
      { row: 1, col: 2, target: 4, tag: 'forces (0,1)≠(1,1)' },
      { row: 2, col: 2, target: 2 },
      { row: 3, col: 3, target: 2 },
    ],
    description:
      'Corners (1,1) [r=0] and (1,2) [r=4] share the vertical edge (0,1)–(1,1) with conflicting equality vs inequality constraints; Phase A DSU detects UNSAT in O(1) search nodes.',
    isSatisfiable: false,
  },
];
