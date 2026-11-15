import {
  BASE_PRESETS,
  cellKey,
  solveConundrum,
  type Bit,
  type CellRole,
  type ConundrumInstance,
  type CornerClue,
  type TileValue,
} from './conundrum.ts';

export interface LiteralSpec {
  varIndex: number;
  negated: boolean;
  /** Optional explicit port slot index on that variable's spine (defaults to side slot) */
  portSlot?: number;
}

export interface PlanarClauseSpec {
  id: string;
  side: 'upper' | 'lower';
  /** Nesting track level >= 0 (0 = closest to variable spine) */
  layer: number;
  /** Exactly 3 literals ordered strictly left-to-right by variable/port x-coordinate */
  literals: [LiteralSpec, LiteralSpec, LiteralSpec];
}

export interface Planar3SatFormula {
  id: string;
  name: string;
  variables: string[];
  clauses: PlanarClauseSpec[];
}

export interface ClauseCoreTruthRow {
  x: Bit;
  y: Bit;
  z: Bit;
  orResult: Bit;
  w0Status: 'SAT' | 'FAIL_R11' | 'FAIL_R12' | 'FAIL_BOTH';
  w1Status: 'SAT' | 'FAIL_R11' | 'FAIL_R12' | 'FAIL_BOTH';
  validWValues: Bit[];
  satisfiable: boolean;
}

/**
 * Programmatically evaluates all 8 truth combinations (x, y, z) in {0, 1}^3
 * on the 3x3 Clause Core gadget G3 and cross-verifies against solveConundrum.
 */
export function evaluateClauseCoreAll8(): ClauseCoreTruthRow[] {
  const core: ConundrumInstance = {
    id: 'g3-check',
    name: 'G3',
    subtitle: '',
    rows: 3,
    cols: 3,
    fixed: { '1,0': 1 },
    clues: [
      { row: 1, col: 1, target: 2 },
      { row: 1, col: 2, target: 2 },
      { row: 2, col: 2, target: 0 },
    ],
    description: '',
    isSatisfiable: true,
  };

  const rows: ClauseCoreTruthRow[] = [];
  for (let mask = 0; mask < 8; mask += 1) {
    const x = ((mask >> 2) & 1) as Bit;
    const y = ((mask >> 1) & 1) as Bit;
    const z = (mask & 1) as Bit;

    const validW: Bit[] = [];
    const checkW = (w: Bit): 'SAT' | 'FAIL_R11' | 'FAIL_R12' | 'FAIL_BOTH' => {
      // Corner (1,1): (x, w, z, 1) -> r=2 iff (x !== z) || (w !== 1)
      const r11 = x !== z || w !== 1;
      // Corner (1,2): (w, y, z, z) -> r=2 iff (w !== z) || (y !== z)
      const r12 = w !== z || y !== z;
      if (r11 && r12) {
        validW.push(w);
        return 'SAT';
      }
      if (!r11 && !r12) return 'FAIL_BOTH';
      return !r11 ? 'FAIL_R11' : 'FAIL_R12';
    };

    const w0Status = checkW(0);
    const w1Status = checkW(1);

    // Cross-check with the general solver locking x=(0,0), y=(0,2), z=(2,2)
    const solverCheck = solveConundrum(core, {
      '0,0': x,
      '0,2': y,
      '2,2': z,
    });
    const expectedSat = (x | y | z) === 1;
    if ((solverCheck.status === 'SAT') !== expectedSat) {
      throw new Error(`Clause Core soundness mismatch at (${x},${y},${z})`);
    }

    rows.push({
      x,
      y,
      z,
      orResult: (x | y | z) as Bit,
      w0Status,
      w1Status,
      validWValues: validW,
      satisfiable: validW.length > 0,
    });
  }
  return rows;
}

export function formatFormulaText(formula: Planar3SatFormula): string {
  if (formula.clauses.length === 0) return '⊤ (empty formula)';
  return formula.clauses
    .map((cl) => {
      const lits = cl.literals.map((l) => {
        const name = formula.variables[l.varIndex] ?? `x${l.varIndex + 1}`;
        return l.negated ? `¬${name}` : name;
      });
      return `(${lits.join(' ∨ ')})`;
    })
    .join(' ∧ ');
}

export function evaluateFormula(
  formula: Planar3SatFormula,
  assignment: ReadonlyArray<Bit>,
): boolean {
  return formula.clauses.every((cl) =>
    cl.literals.some((l) => {
      const v = assignment[l.varIndex] ?? 0;
      return l.negated ? v === 0 : v === 1;
    }),
  );
}

export function countFormulaSolutions(formula: Planar3SatFormula): number {
  const n = formula.variables.length;
  let count = 0;
  for (let mask = 0; mask < 1 << n; mask += 1) {
    const bits: Bit[] = [];
    for (let i = 0; i < n; i += 1) {
      bits.push(((mask >> i) & 1) as Bit);
    }
    if (evaluateFormula(formula, bits)) count += 1;
  }
  return count;
}

export function extractSpineAssignment(
  instance: ConundrumInstance,
  board: TileValue[][],
): TileValue[] | null {
  if (!instance.clauseMeta) return null;
  return instance.clauseMeta.spineCells.map(({ row, col }) => board[row]?.[col] ?? null);
}

/**
 * Compiles a Rectilinear Planar 3-SAT formula into an equivalent Binary XOR-Square
 * grid instance using gadgets G1 (r=0 wire/spine), G2 (r=4 inline inverter),
 * G3 (3x3 OR clause core), and G4 (monotone upper/lower half-plane routing).
 */
export function compilePlanar3Sat(formula: Planar3SatFormula): ConundrumInstance {
  const nVars = formula.variables.length;
  // Determine how many port slots each variable needs on upper/lower sides
  const slotsPerVar = new Array<number>(nVars).fill(1);
  for (const cl of formula.clauses) {
    for (const lit of cl.literals) {
      const needed = (lit.portSlot ?? 0) + 1;
      if (needed > slotsPerVar[lit.varIndex]) {
        slotsPerVar[lit.varIndex] = needed;
      }
    }
  }

  // Allocate horizontal column spans for each variable spine:
  // Each port slot uses 4 columns: [c, c+1] wire, c+2 inverter expansion room, c+3 spacer.
  // Between consecutive variables, leave 1 completely empty buffer column.
  const varStartCol: number[] = [];
  const varEndCol: number[] = [];
  let cursorCol = 1; // leave col 0 as outer margin

  for (let i = 0; i < nVars; i += 1) {
    varStartCol.push(cursorCol);
    const width = Math.max(1, slotsPerVar[i]) * 4;
    varEndCol.push(cursorCol + width - 1);
    cursorCol += width + 1; // +1 empty buffer column between variables
  }
  const totalCols = cursorCol; // includes right margin column

  const getPortCol = (lit: LiteralSpec): number =>
    varStartCol[lit.varIndex] + (lit.portSlot ?? 0) * 4;

  // Determine vertical extent based on max upper/lower layer depths
  let maxUpperLayer = -1;
  let maxLowerLayer = -1;
  for (const cl of formula.clauses) {
    if (cl.side === 'upper' && cl.layer > maxUpperLayer) maxUpperLayer = cl.layer;
    if (cl.side === 'lower' && cl.layer > maxLowerLayer) maxLowerLayer = cl.layer;
  }

  // Each nesting layer occupies 8 rows:
  // 2 rows roof bridge + 1 row gap + 3 rows G3 core + 4 rows leg/inverter shaft (or shared cleanly)
  const upperBandHeight = maxUpperLayer >= 0 ? (maxUpperLayer + 1) * 9 + 1 : 2;
  const lowerBandHeight = maxLowerLayer >= 0 ? (maxLowerLayer + 1) * 9 + 1 : 2;

  const spineTopRow = upperBandHeight;
  const spineBotRow = spineTopRow + 1;
  const totalRows = upperBandHeight + 2 + lowerBandHeight;

  const fixed: Record<string, Bit> = {};
  const clues: CornerClue[] = [];
  const clueKeys = new Set<string>();
  const roles: Record<string, CellRole> = {};

  const setRole = (r: number, c: number, role: CellRole) => {
    const key = cellKey(r, c);
    // Prioritize anchor > clause > inverter > spine > wire
    const priority: Record<CellRole, number> = {
      anchor: 6,
      clause: 5,
      inverter: 4,
      spine: 3,
      wire: 2,
      free: 1,
    };
    const existing = roles[key];
    if (!existing || priority[role] > priority[existing]) {
      roles[key] = role;
    }
  };

  const addClue = (row: number, col: number, target: 0 | 2 | 4, tag?: string, role: CellRole = 'wire') => {
    const key = `${row},${col}`;
    if (clueKeys.has(key)) {
      throw new Error(`Overlapping corner clue at (${row}, ${col}) [${tag ?? ''}]`);
    }
    clueKeys.add(key);
    clues.push({ row, col, target, tag });
    setRole(row - 1, col - 1, role);
    setRole(row - 1, col, role);
    setRole(row, col, role);
    setRole(row, col - 1, role);
  };

  // 1. Build horizontal variable equality spines (rows spineTopRow..spineBotRow)
  const spineCells: Array<{ row: number; col: number }> = [];
  for (let v = 0; v < nVars; v += 1) {
    const sc = varStartCol[v];
    const ec = varEndCol[v];
    spineCells.push({ row: spineTopRow, col: sc });
    for (let col = sc + 1; col <= ec; col += 1) {
      addClue(spineBotRow, col, 0, `${formula.variables[v]} spine`, 'spine');
    }
  }

  // 2. Compile each upper/lower clause with G1 wires, G2 inline inverters, and G3 clause core
  for (const cl of formula.clauses) {
    const [litX, litZ, litY] = cl.literals;
    const colX = getPortCol(litX);
    const colZ = getPortCol(litZ);
    const colY = getPortCol(litY);

    if (!(colX + 3 <= colZ && colZ + 3 <= colY)) {
      throw new Error(`Clause ${cl.id} ports must satisfy colX + 3 <= colZ and colZ + 3 <= colY.`);
    }

    // Place G3 right on top of (or below) colZ:
    // G3 occupies cols [C0, C0+1, C0+2] where [C0+1, C0+2] === [colZ, colZ+1]!
    const C0 = colZ - 1;

    if (cl.side === 'upper') {
      // Layer 0 sits near spine: let roofTop = spineTopRow - 9 - cl.layer * 9
      const roofTop = spineTopRow - 9 - cl.layer * 9;
      const roofBot = roofTop + 1;
      const R0 = roofBot + 1; // G3 occupies rows R0, R0+1, R0+2

      // G3 core: fixed (R0+1, C0)=1, clues r(R0+1, C0+1)=2, r(R0+1, C0+2)=2, r(R0+2, C0+2)=0
      fixed[cellKey(R0 + 1, C0)] = 1;
      setRole(R0 + 1, C0, 'anchor');
      addClue(R0 + 1, C0 + 1, 2, `${cl.id} G3-L`, 'clause');
      addClue(R0 + 1, C0 + 2, 2, `${cl.id} G3-R`, 'clause');
      addClue(R0 + 2, C0 + 2, 0, `${cl.id} G3-Z`, 'clause');
      setRole(R0, C0, 'clause');
      setRole(R0, C0 + 1, 'clause');
      setRole(R0, C0 + 2, 'clause');

      // Left horizontal roof bridge from colX rightwards to col C0, then step down to (R0, C0)
      for (let c = colX + 1; c <= C0; c += 1) {
        addClue(roofBot, c, 0, `${cl.id} x-arm`, 'wire');
      }
      addClue(R0, C0, 0, `${cl.id} x-tap`, 'wire');

      // Right horizontal roof bridge from C0+2 rightwards to colY+1, then step down to (R0, C0+2)
      for (let c = C0 + 3; c <= colY + 1; c += 1) {
        addClue(roofBot, c, 0, `${cl.id} y-arm`, 'wire');
      }
      addClue(R0, C0 + 3, 0, `${cl.id} y-tap`, 'wire');

      // Route vertical leg helper (rising from spineTopRow up to targetBottomEdgeRow at cols [col, col+1])
      // lastClueRow covers [lastClueRow - 1, lastClueRow], sharing row (lastClueRow - 1) with target widget.
      const buildUpperVerticalLeg = (col: number, lastClueRow: number, negated: boolean, label: string) => {
        if (!negated) {
          for (let r = spineTopRow; r >= lastClueRow; r -= 1) {
            addClue(r, col + 1, 0, `${label} wire`, 'wire');
          }
          return;
        }
        addClue(spineTopRow, col + 1, 0, `${label} tap`, 'wire');
        addClue(spineTopRow - 1, col + 1, 0, `${label} pre`, 'wire');
        addClue(spineTopRow - 2, col + 2, 4, `${label} NOT`, 'inverter');
        for (let r = spineTopRow - 3; r >= lastClueRow; r -= 1) {
          addClue(r, col + 1, 0, `${label} neg-wire`, 'wire');
        }
      };

      // x-leg rises up to row roofBot (clue roofBot+1 covers [roofBot, roofBot+1], sharing roofBot with roof)
      buildUpperVerticalLeg(colX, roofBot + 1, litX.negated, `${cl.id}.x`);
      // z-leg rises up to row R0+2 (clue R0+3 covers [R0+2, R0+3], sharing R0+2 with G3-Z at R0+2)
      buildUpperVerticalLeg(colZ, R0 + 3, litZ.negated, `${cl.id}.z`);
      // y-leg rises up to row roofBot
      buildUpperVerticalLeg(colY, roofBot + 1, litY.negated, `${cl.id}.y`);
    } else {
      // Lower clause: mirror vertically across the spine!
      // roofBot = spineBotRow + 9 + cl.layer * 9
      const roofBot = spineBotRow + 9 + cl.layer * 9;
      const roofTop = roofBot - 1;
      const R0 = roofTop - 3; // G3 occupies rows R0, R0+1, R0+2 (mirrored: z at top [R0..R0+1], x/w/y at bottom R0+2)

      // Mirrored G3:
      // Row R0  :  .     z     z
      // Row R0+1:  1     z     z     -> r(R0+1, C0+2) = 0 locks z
      // Row R0+2:  x     w     y     -> r(R0+2, C0+1) = 2 checks (1, z, w, x), r(R0+2, C0+2) = 2 checks (z, z, y, w)
      fixed[cellKey(R0 + 1, C0)] = 1;
      setRole(R0 + 1, C0, 'anchor');
      addClue(R0 + 1, C0 + 2, 0, `${cl.id} G3-Z`, 'clause');
      addClue(R0 + 2, C0 + 1, 2, `${cl.id} G3-L`, 'clause');
      addClue(R0 + 2, C0 + 2, 2, `${cl.id} G3-R`, 'clause');
      setRole(R0 + 2, C0, 'clause');
      setRole(R0 + 2, C0 + 1, 'clause');
      setRole(R0 + 2, C0 + 2, 'clause');

      // Left lower roof bridge from colX rightwards to col C0, stepping UP into (R0+2, C0)
      for (let c = colX + 1; c <= C0; c += 1) {
        addClue(roofBot, c, 0, `${cl.id} x-arm`, 'wire');
      }
      addClue(R0 + 3, C0, 0, `${cl.id} x-tap`, 'wire');

      // Right lower roof bridge from C0+2 rightwards to colY+1, stepping UP into (R0+2, C0+2)
      for (let c = C0 + 3; c <= colY + 1; c += 1) {
        addClue(roofBot, c, 0, `${cl.id} y-arm`, 'wire');
      }
      addClue(R0 + 3, C0 + 3, 0, `${cl.id} y-tap`, 'wire');

      const buildLowerVerticalLeg = (col: number, lastClueRow: number, negated: boolean, label: string) => {
        if (!negated) {
          for (let r = spineBotRow + 1; r <= lastClueRow; r += 1) {
            addClue(r, col + 1, 0, `${label} wire`, 'wire');
          }
          return;
        }
        addClue(spineBotRow + 1, col + 1, 0, `${label} tap`, 'wire');
        addClue(spineBotRow + 2, col + 1, 0, `${label} pre`, 'wire');
        addClue(spineBotRow + 3, col + 2, 4, `${label} NOT`, 'inverter');
        for (let r = spineBotRow + 4; r <= lastClueRow; r += 1) {
          addClue(r, col + 1, 0, `${label} neg-wire`, 'wire');
        }
      };

      // x-leg drops from spineBotRow down to roofTop (clue roofTop covers [roofTop-1, roofTop], sharing roofTop with roofBot)
      buildLowerVerticalLeg(colX, roofTop, litX.negated, `${cl.id}.x`);
      // z-leg drops from spineBotRow down to R0 (clue R0 covers [R0-1, R0], sharing R0 with mirrored G3-Z at R0+1)
      buildLowerVerticalLeg(colZ, R0, litZ.negated, `${cl.id}.z`);
      // y-leg drops from spineBotRow down to roofTop
      buildLowerVerticalLeg(colY, roofTop, litY.negated, `${cl.id}.y`);
    }
  }

  const solCount = countFormulaSolutions(formula);

  return {
    id: formula.id,
    name: formula.name,
    subtitle: `${totalRows}×${totalCols} compiled Planar 3-SAT · ${formula.clauses.length} clause${formula.clauses.length === 1 ? '' : 's'}`,
    rows: totalRows,
    cols: totalCols,
    fixed,
    clues,
    roles,
    description: `Compiled directly from φ = ${formatFormulaText(formula)}. Central spine encodes (${formula.variables.join(', ')}); r = 4 nodes perform inline NOT inversions; G3 cores enforce each 3-literal clause.`,
    isSatisfiable: solCount > 0,
    clauseMeta: {
      variables: formula.variables,
      clauses: formula.clauses.map((cl) => {
        const lits = cl.literals.map((l) =>
          l.negated ? `¬${formula.variables[l.varIndex]}` : formula.variables[l.varIndex],
        );
        return `(${lits.join(' ∨ ')})`;
      }),
      spineCells,
    },
  };
}

export const PLANAR_FORMULAS: Planar3SatFormula[] = [
  {
    id: 'planar-2clause',
    name: 'Planar 2-Clause 22×16',
    variables: ['x₁', 'x₂', 'x₃'],
    clauses: [
      {
        id: 'C₁',
        side: 'upper',
        layer: 0,
        literals: [
          { varIndex: 0, negated: false },
          { varIndex: 1, negated: true },
          { varIndex: 2, negated: false },
        ],
      },
      {
        id: 'C₂',
        side: 'lower',
        layer: 0,
        literals: [
          { varIndex: 0, negated: true },
          { varIndex: 1, negated: false },
          { varIndex: 2, negated: true },
        ],
      },
    ],
  },
  {
    id: 'planar-nested-4var',
    name: 'Planar 4-Var Nested 31×29',
    variables: ['x₁', 'x₂', 'x₃', 'x₄'],
    clauses: [
      {
        id: 'C₁',
        side: 'upper',
        layer: 0,
        literals: [
          { varIndex: 0, negated: false, portSlot: 1 },
          { varIndex: 1, negated: false, portSlot: 0 },
          { varIndex: 2, negated: true, portSlot: 0 },
        ],
      },
      {
        id: 'C₂',
        side: 'upper',
        layer: 1,
        literals: [
          { varIndex: 0, negated: true, portSlot: 0 },
          { varIndex: 2, negated: false, portSlot: 1 },
          { varIndex: 3, negated: false, portSlot: 0 },
        ],
      },
      {
        id: 'C₃',
        side: 'lower',
        layer: 0,
        literals: [
          { varIndex: 1, negated: true, portSlot: 0 },
          { varIndex: 2, negated: true, portSlot: 0 },
          { varIndex: 3, negated: true, portSlot: 0 },
        ],
      },
    ],
  },
];

export const COMPILED_PLANAR_PRESET: ConundrumInstance = compilePlanar3Sat(PLANAR_FORMULAS[0]);

export const ALL_PRESETS: ConundrumInstance[] = [
  BASE_PRESETS[0], // parity-pair
  BASE_PRESETS[1], // clause-core
  BASE_PRESETS[2], // dual-cut
  COMPILED_PLANAR_PRESET,
  BASE_PRESETS[3], // unsat-obstruction
];

export interface SchaeferRow {
  property: string;
  closure: string;
  r0Holds: boolean;
  r4Holds: boolean;
  r2Holds: boolean;
  witness: string;
}

export const SCHAEFER_TABLE: SchaeferRow[] = [
  {
    property: '0-valid',
    closure: '(0,0,0,0) ∈ R',
    r0Holds: true,
    r4Holds: false,
    r2Holds: false,
    witness: 'τ(0000) = 0 ≠ 2 ⇒ 0000 ∉ R₂',
  },
  {
    property: '1-valid',
    closure: '(1,1,1,1) ∈ R',
    r0Holds: true,
    r4Holds: false,
    r2Holds: false,
    witness: 'τ(1111) = 0 ≠ 2 ⇒ 1111 ∉ R₂',
  },
  {
    property: 'Horn (weakly −)',
    closure: 'u ∧ v ∈ R',
    r0Holds: true,
    r4Holds: false,
    r2Holds: false,
    witness: '1000 ∧ 0100 = 0000 ∉ R₂',
  },
  {
    property: 'Dual-Horn (+)',
    closure: 'u ∨ v ∈ R',
    r0Holds: true,
    r4Holds: false,
    r2Holds: false,
    witness: '1100 ∨ 0011 = 1111 ∉ R₂',
  },
  {
    property: 'Affine (𝔽₂)',
    closure: 'x ⊕ y ⊕ z ∈ R',
    r0Holds: true,
    r4Holds: true,
    r2Holds: false,
    witness: '1000 ⊕ 0100 ⊕ 1100 = 0000 ∉ R₂',
  },
  {
    property: 'Bijunctive (2-CNF)',
    closure: 'maj(x,y,z) ∈ R',
    r0Holds: true,
    r4Holds: true,
    r2Holds: false,
    witness: 'maj(1000,0100,0010) = 0000 ∉ R₂',
  },
];
