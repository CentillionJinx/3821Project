/**
 * XOR Squares Puzzle — Leading Candidate NP-Complete Grid Puzzle
 * Directly aligned with COMP3821 Progression Review:
 * "XOR squares: finished developing literal and clause gadgets using overlapping squares."
 *
 * Rules:
 * - A grid of size W x H with target parity constraints:
 *   Parity 1 = ODD number of overlapping active squares.
 *   Parity 0 = EVEN number of overlapping active squares.
 *   Parity null = Unconstrained cell.
 * - Players select a subset of squares S' ⊆ S.
 * - Variable Gadget: Squares T_i and F_i intersect at cell c_mutex with Parity = 1.
 *   (T_i + F_i) mod 2 = 1 enforces EXACTLY ONE of {T_i, F_i} is selected!
 * - Clause Gadget: Clause cell c_clause requires odd parity (1), connected to literal
 *   sub-squares and helper slack squares such that satisfying at least one literal
 *   enables a valid parity assignment.
 * - Verifier: Executes in O(W * H + |S|) deterministic polynomial time.
 */

export interface XORSquare {
  id: string;
  name: string;
  variable?: string;
  literalType?: 'T' | 'F' | 'helper' | 'free';
  x: number; // top-left column 0..W-1
  y: number; // top-left row 0..H-1
  width: number;
  height: number;
  color: string;
}

export interface XORCellConstraint {
  x: number;
  y: number;
  targetParity: 0 | 1 | null; // 1 = odd, 0 = even, null = unconstrained
  label?: string;
  role: 'normal' | 'mutex' | 'clause' | 'slack';
}

export interface XORBoardPreset {
  id: string;
  name: string;
  badge: string;
  width: number;
  height: number;
  summaryLayman: string;
  summaryRigorous: string;
  constraints: XORCellConstraint[];
  candidateSquares: XORSquare[];
  defaultSelected: string[];
  satisfyingWitness: string[];
  isSatisfiable: boolean;
  reductionSource?: string;
}

export interface XORVerificationResult {
  isValid: boolean;
  totalCellsChecked: number;
  cellOverlapCounts: Record<string, number>; // "x,y" -> count
  satisfiedConstraints: number;
  violatedConstraints: { x: number; y: number; actual: number; target: 0 | 1; label?: string }[];
  activeSquaresCount: number;
  runtimeOps: number;
}

export const XOR_SQUARE_PRESETS: XORBoardPreset[] = [
  {
    id: 'sat-reduction-3var',
    name: '3-SAT Reduction Gadget Instance (φ = (x₁ ∨ ¬x₂ ∨ x₃) ∧ (¬x₁ ∨ x₂))',
    badge: '3-SAT ≤ₚ XOR-Squares',
    width: 8,
    height: 8,
    summaryLayman:
      'Each variable (x₁, x₂, x₃) has two competing squares: True (cyan) and False (amber). A special parity cell where they overlap forces you to pick exactly one of them (odd parity = 1). Meanwhile, the clause cells at the bottom can only reach odd parity if at least one of their literals is active!',
    summaryRigorous:
      'Instance of XOR-Squares reduced from 3-SAT formula φ with 3 variables and 2 clauses. Variable choice gadgets enforce XOR parity on mutex cells (x_i ⊕ ¬x_i = 1). Clause cells C₁ and C₂ verify CNF clause satisfiability via literal overlap parity.',
    isSatisfiable: true,
    reductionSource: 'φ = (x₁ ∨ ¬x₂ ∨ x₃) ∧ (¬x₁ ∨ x₂)',
    constraints: [
      // Mutex cells for variable 1: cell (1, 1) must have odd parity (1)
      { x: 1, y: 1, targetParity: 1, label: 'x₁ Mutex', role: 'mutex' },
      // Mutex cells for variable 2: cell (3, 1) must have odd parity (1)
      { x: 3, y: 1, targetParity: 1, label: 'x₂ Mutex', role: 'mutex' },
      // Mutex cells for variable 3: cell (5, 1) must have odd parity (1)
      { x: 5, y: 1, targetParity: 1, label: 'x₃ Mutex', role: 'mutex' },

      // Clause 1 cell: (2, 5) needs odd parity (1) -> satisfied by x₁=T, x₂=F, or x₃=T
      { x: 2, y: 5, targetParity: 1, label: 'Clause C₁', role: 'clause' },
      // Clause 2 cell: (4, 5) needs odd parity (1) -> satisfied by x₁=F or x₂=T
      { x: 4, y: 5, targetParity: 1, label: 'Clause C₂', role: 'clause' },

      // Boundary stabilizer cells (even parity 0)
      { x: 1, y: 3, targetParity: 0, label: 'T₁ Buffer', role: 'slack' },
      { x: 3, y: 3, targetParity: 0, label: 'T₂ Buffer', role: 'slack' },
      { x: 5, y: 3, targetParity: 0, label: 'T₃ Buffer', role: 'slack' },
    ],
    candidateSquares: [
      // Variable 1 True square (covers (1,1), (1,2), (2,1), (2,2), extends down to C1 at (2,5) via connector)
      {
        id: 'sq-x1-T',
        name: 'x₁ = TRUE (3x3)',
        variable: 'x1',
        literalType: 'T',
        x: 1,
        y: 1,
        width: 2,
        height: 5,
        color: '#2dd4bf', // Teal
      },
      // Variable 1 False square (covers (0,0) to (1,1) and extends to C2 at (4,5) with buffer)
      {
        id: 'sq-x1-F',
        name: 'x₁ = FALSE (2x3)',
        variable: 'x1',
        literalType: 'F',
        x: 0,
        y: 1,
        width: 2,
        height: 3,
        color: '#fbbf24', // Amber
      },

      // Variable 2 True square
      {
        id: 'sq-x2-T',
        name: 'x₂ = TRUE (2x5)',
        variable: 'x2',
        literalType: 'T',
        x: 3,
        y: 1,
        width: 2,
        height: 5,
        color: '#38bdf8', // Blue
      },
      // Variable 2 False square
      {
        id: 'sq-x2-F',
        name: 'x₂ = FALSE (2x3)',
        variable: 'x2',
        literalType: 'F',
        x: 2,
        y: 1,
        width: 2,
        height: 3,
        color: '#f43f5e', // Rose
      },

      // Variable 3 True square
      {
        id: 'sq-x3-T',
        name: 'x₃ = TRUE (2x3)',
        variable: 'x3',
        literalType: 'T',
        x: 5,
        y: 1,
        width: 2,
        height: 3,
        color: '#a855f7', // Purple
      },
      // Variable 3 False square
      {
        id: 'sq-x3-F',
        name: 'x₃ = FALSE (2x3)',
        variable: 'x3',
        literalType: 'F',
        x: 5,
        y: 0,
        width: 2,
        height: 2,
        color: '#e2e8f0', // Slate
      },

      // Clause Helper / Slack Squares
      {
        id: 'sq-c1-slack',
        name: 'C₁ Auxiliary Slack (1x1)',
        literalType: 'helper',
        x: 2,
        y: 5,
        width: 1,
        height: 1,
        color: '#10b981', // Emerald
      },
      {
        id: 'sq-c2-slack',
        name: 'C₂ Auxiliary Slack (1x1)',
        literalType: 'helper',
        x: 4,
        y: 5,
        width: 1,
        height: 1,
        color: '#6366f1', // Indigo
      },
      // Buffer compensators
      {
        id: 'sq-buf-1',
        name: 'Buffer Absorber B₁ (1x1)',
        literalType: 'free',
        x: 1,
        y: 3,
        width: 1,
        height: 1,
        color: '#475569',
      },
      {
        id: 'sq-buf-2',
        name: 'Buffer Absorber B₂ (1x1)',
        literalType: 'free',
        x: 3,
        y: 3,
        width: 1,
        height: 1,
        color: '#475569',
      },
    ],
    defaultSelected: ['sq-x1-T', 'sq-x2-T', 'sq-x3-T', 'sq-buf-1', 'sq-buf-2'],
    satisfyingWitness: ['sq-x1-T', 'sq-x2-T', 'sq-x3-T', 'sq-buf-1', 'sq-buf-2'],
  },
  {
    id: 'parity-cross-puzzle',
    name: 'Overlapping Parity Cross (Compact 6x6 Challenge)',
    badge: 'NP-Verification Lab',
    width: 6,
    height: 6,
    summaryLayman:
      'Place overlapping squares so that every marked target cell has an ODD number of squares covering it, while the perimeter cells remain EVEN (0 squares). A fun test of spatial parity constraint satisfaction!',
    summaryRigorous:
      'General XOR-Square instance with 5 candidate 3x3 and 2x2 squares. Target vector b in {0,1}^M requires finding x in {0,1}^|S| such that A x = b (mod 2) where A is the binary incidence matrix.',
    isSatisfiable: true,
    constraints: [
      { x: 2, y: 2, targetParity: 1, label: 'Core Odd', role: 'clause' },
      { x: 3, y: 2, targetParity: 1, label: 'East Odd', role: 'clause' },
      { x: 2, y: 3, targetParity: 1, label: 'South Odd', role: 'clause' },
      { x: 3, y: 3, targetParity: 1, label: 'Diag Odd', role: 'clause' },
      { x: 1, y: 1, targetParity: 0, label: 'Corner Even', role: 'slack' },
      { x: 4, y: 4, targetParity: 0, label: 'Outer Even', role: 'slack' },
    ],
    candidateSquares: [
      { id: 'p-sq1', name: 'Square Alpha (3x3)', x: 1, y: 1, width: 3, height: 3, color: '#2dd4bf' },
      { id: 'p-sq2', name: 'Square Beta (3x3)', x: 2, y: 1, width: 3, height: 3, color: '#38bdf8' },
      { id: 'p-sq3', name: 'Square Gamma (3x3)', x: 1, y: 2, width: 3, height: 3, color: '#fbbf24' },
      { id: 'p-sq4', name: 'Square Delta (2x2)', x: 3, y: 3, width: 2, height: 2, color: '#f43f5e' },
      { id: 'p-sq5', name: 'Square Epsilon (1x1)', x: 1, y: 1, width: 1, height: 1, color: '#a855f7' },
    ],
    defaultSelected: ['p-sq1', 'p-sq2', 'p-sq5'],
    satisfyingWitness: ['p-sq1', 'p-sq2', 'p-sq5'],
  },
  {
    id: 'unsat-xor-paradox',
    name: 'The Parity Contradiction (Unsatisfiable NO-Instance)',
    badge: 'Unsatisfiable (NO)',
    width: 5,
    height: 5,
    summaryLayman:
      'Two squares overlap at cell (2,2). Cell (2,2) requires ODD parity, but their exclusive outer cells both require EVEN parity simultaneously. No subset of squares can satisfy this parity cycle!',
    summaryRigorous:
      'Provably unsatisfiable (NO) instance. Row parity summation leads to 0 = 1 (mod 2), demonstrating that the polynomial-time verifier strictly rejects invalid instances with zero false positives.',
    isSatisfiable: false,
    constraints: [
      { x: 2, y: 2, targetParity: 1, label: 'Target Center (Odd)', role: 'clause' },
      { x: 1, y: 2, targetParity: 0, label: 'Left Cell (Even)', role: 'mutex' },
      { x: 3, y: 2, targetParity: 0, label: 'Right Cell (Even)', role: 'mutex' },
    ],
    candidateSquares: [
      { id: 'unsat-sq1', name: 'Square Left (2x2)', x: 1, y: 1, width: 2, height: 2, color: '#fb7185' },
      { id: 'unsat-sq2', name: 'Square Right (2x2)', x: 2, y: 1, width: 2, height: 2, color: '#38bdf8' },
    ],
    defaultSelected: ['unsat-sq1', 'unsat-sq2'],
    satisfyingWitness: ['unsat-sq1'],
  },
];

/**
 * Deterministic Polynomial-Time Verifier for XOR-Squares:
 * Evaluates in O(W * H + |S|) time whether the chosen subset of squares
 * satisfies all cell parity constraints.
 */
export function verifyXORSquares(
  preset: XORBoardPreset,
  selectedSquareIds: string[]
): XORVerificationResult {
  const selectedSquares = preset.candidateSquares.filter((sq) =>
    selectedSquareIds.includes(sq.id)
  );

  // 1. Compute overlap count for each grid cell in O(|S| * Area)
  const cellOverlapCounts: Record<string, number> = {};
  for (let y = 0; y < preset.height; y++) {
    for (let x = 0; x < preset.width; x++) {
      cellOverlapCounts[`${x},${y}`] = 0;
    }
  }

  for (const sq of selectedSquares) {
    for (let dy = 0; dy < sq.height; dy++) {
      for (let dx = 0; dx < sq.width; dx++) {
        const cx = sq.x + dx;
        const cy = sq.y + dy;
        if (cx >= 0 && cx < preset.width && cy >= 0 && cy < preset.height) {
          cellOverlapCounts[`${cx},${cy}`] = (cellOverlapCounts[`${cx},${cy}`] || 0) + 1;
        }
      }
    }
  }

  // 2. Audit all constraints
  const violatedConstraints: XORVerificationResult['violatedConstraints'] = [];
  let satisfiedConstraints = 0;

  for (const c of preset.constraints) {
    if (c.targetParity === null) continue;
    const count = cellOverlapCounts[`${c.x},${c.y}`] || 0;
    const actualParity = (count % 2) as 0 | 1;
    if (actualParity === c.targetParity) {
      satisfiedConstraints++;
    } else {
      violatedConstraints.push({
        x: c.x,
        y: c.y,
        actual: count,
        target: c.targetParity,
        label: c.label,
      });
    }
  }

  const isValid = violatedConstraints.length === 0;

  return {
    isValid,
    totalCellsChecked: preset.constraints.length,
    cellOverlapCounts,
    satisfiedConstraints,
    violatedConstraints,
    activeSquaresCount: selectedSquares.length,
    runtimeOps: preset.width * preset.height + selectedSquares.length * 9,
  };
}
