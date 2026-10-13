import type { SatFormula, TruthAssignment, GridCell } from '../types/puzzle';

export interface WirePath {
  from: [number, number];
  to: [number, number];
  active: boolean;
  label: string;
}

export interface GadgetMap {
  rows: number;
  cols: number;
  cells: GridCell[][];
  wireConnections: WirePath[];
}

/**
 * Polynomial-time reduction builder from 3-SAT to Grid Puzzle X
 * Supports reduction animation stages:
 *  1: Variables only
 *  2: Variables + Wires/Corridors
 *  3: Variables + Wires + Clause Gates
 *  4: Full Circuit (Live power flow)
 */
export function buildGridFromSat(
  formula: SatFormula, 
  assignment: TruthAssignment,
  stage: number = 4
): GadgetMap {
  const numVars = formula.variables.length;
  const numClauses = formula.clauses.length;

  const cols = Math.max(numVars * 4 + 2, numClauses * 4 + 2, 14);
  const rows = 10;

  // Initialize empty grid matrix
  const cells: GridCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        kind: 'empty',
      });
    }
    cells.push(row);
  }

  // 1. VARIABLE GADGETS (Row 1 and 2) - Visible in stages >= 1
  if (stage >= 1) {
    formula.variables.forEach((vName, idx) => {
      const colCenter = 2 + idx * 4;
      const currentVal = assignment[vName];

      // True Cell
      cells[1][colCenter] = {
        row: 1,
        col: colCenter,
        kind: 'variable-true',
        id: `${vName}-T`,
        label: `${vName}=T`,
        variableName: vName,
        isNegated: false,
        value: currentVal === true,
        isValidSelection: currentVal === true,
        isConflicted: false,
      };

      // False Cell
      cells[2][colCenter] = {
        row: 2,
        col: colCenter,
        kind: 'variable-false',
        id: `${vName}-F`,
        label: `${vName}=F`,
        variableName: vName,
        isNegated: true,
        value: currentVal === false,
        isValidSelection: currentVal === false,
        isConflicted: false,
      };

      // Buffer Wall around variable gadget
      if (cells[1][colCenter - 1]) cells[1][colCenter - 1].kind = 'wall';
      if (cells[2][colCenter - 1]) cells[2][colCenter - 1].kind = 'wall';
    });
  }

  // 2. CORRIDOR / WIRING GADGETS (Rows 3, 4, 5) - Visible in stages >= 2
  if (stage >= 2) {
    for (let r = 3; r <= 5; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (c % 2 === 0) {
          cells[r][c].kind = 'wire-corridor';
        }
      }
    }
  }

  // 3. CLAUSE GADGETS (Rows 7, 8) - Visible in stages >= 3
  const wireConnections: WirePath[] = [];

  if (stage >= 3) {
    formula.clauses.forEach((clause, cIdx) => {
      const clauseStartCol = 2 + cIdx * 4;
      let clauseSatisfied = false;

      clause.literals.forEach((lit, lIdx) => {
        const col = clauseStartCol + lIdx;
        if (col < cols) {
          const varVal = assignment[lit.variable];
          const litSatisfied = varVal !== undefined ? (lit.isNegated ? !varVal : varVal) : false;
          if (litSatisfied) clauseSatisfied = true;

          // In stage 4, show full powered state
          const powered = stage === 4 && litSatisfied;

          cells[7][col] = {
            row: 7,
            col: col,
            kind: 'clause-slot',
            id: `${clause.id}-L${lIdx}`,
            label: `${lit.isNegated ? '¬' : ''}${lit.variable}`,
            groupId: clause.id,
            variableName: lit.variable,
            isNegated: lit.isNegated,
            value: powered,
            isValidSelection: powered,
            isConflicted: false,
          };

          // Trace wire connection from variable gadget to this clause slot
          const vIdx = formula.variables.indexOf(lit.variable);
          if (vIdx !== -1) {
            const varCol = 2 + vIdx * 4;
            const varRow = lit.isNegated ? 2 : 1;
            wireConnections.push({
              from: [varRow, varCol],
              to: [7, col],
              active: stage === 4 && litSatisfied,
              label: `${lit.isNegated ? '¬' : ''}${lit.variable}`,
            });
          }
        }
      });

      // Clause Beacon / Indicator (Row 8)
      const centerCol = clauseStartCol + 1;
      if (centerCol < cols) {
        cells[8][centerCol] = {
          row: 8,
          col: centerCol,
          kind: 'beacon',
          id: `beacon-${clause.id}`,
          label: clause.id,
          groupId: clause.id,
          value: stage === 4 ? clauseSatisfied : false,
        };
      }
    });
  }

  return {
    rows,
    cols,
    cells,
    wireConnections,
  };
}
