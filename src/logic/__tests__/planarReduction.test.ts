import test from 'node:test';
import assert from 'node:assert/strict';
import { cellKey, solveConundrum, verifyConundrum, type Bit } from '../conundrum.ts';
import {
  ALL_PRESETS,
  PLANAR_FORMULAS,
  compilePlanar3Sat,
  evaluateClauseCoreAll8,
  evaluateFormula,
  extractSpineAssignment,
  type Planar3SatFormula,
} from '../planarReduction.ts';

test('G3 3x3 Clause Core truth table holds iff (x OR y OR z) === 1', () => {
  const rows = evaluateClauseCoreAll8();
  assert.equal(rows.length, 8);
  let satCount = 0;
  for (const r of rows) {
    assert.equal(r.satisfiable, r.orResult === 1);
    if (r.satisfiable) satCount += 1;
  }
  assert.equal(satCount, 7);
});

test('compilePlanar3Sat satisfies exact spine-assignment equivalence across built-in formulas', () => {
  for (const formula of PLANAR_FORMULAS) {
    const instance = compilePlanar3Sat(formula);
    const n = formula.variables.length;

    const fullSolve = solveConundrum(instance);
    assert.equal(fullSolve.status, 'SAT');
    assert.ok(fullSolve.solution !== null);
    assert.equal(verifyConundrum(instance, fullSolve.solution).verdict, 'ACCEPT');

    const decoded = extractSpineAssignment(instance, fullSolve.solution);
    assert.ok(decoded !== null);
    assert.equal(
      evaluateFormula(
        formula,
        decoded.map((b) => (b ?? 0) as Bit),
      ),
      true,
    );

    // Exhaustively check all 2^n truth assignments locked onto the variable spine
    for (let mask = 0; mask < 1 << n; mask += 1) {
      const bits: Bit[] = [];
      const extraFixed: Record<string, Bit> = {};
      for (let i = 0; i < n; i += 1) {
        const bit = ((mask >> i) & 1) as Bit;
        bits.push(bit);
        const sc = instance.clauseMeta!.spineCells[i];
        extraFixed[cellKey(sc.row, sc.col)] = bit;
      }
      const res = solveConundrum(instance, extraFixed);
      const expected = evaluateFormula(formula, bits);
      assert.equal(res.status === 'SAT', expected, `${formula.id} mask=${mask}`);
    }
  }
});

test('compilePlanar3Sat preserves soundness across all 64 polarity combinations of 2-clause Planar 3-SAT', () => {
  for (let p = 0; p < 64; p += 1) {
    const formula: Planar3SatFormula = {
      id: `pol-${p}`,
      name: `pol-${p}`,
      variables: ['x₁', 'x₂', 'x₃'],
      clauses: [
        {
          id: 'C₁',
          side: 'upper',
          layer: 0,
          literals: [
            { varIndex: 0, negated: Boolean(p & 1) },
            { varIndex: 1, negated: Boolean(p & 2) },
            { varIndex: 2, negated: Boolean(p & 4) },
          ],
        },
        {
          id: 'C₂',
          side: 'lower',
          layer: 0,
          literals: [
            { varIndex: 0, negated: Boolean(p & 8) },
            { varIndex: 1, negated: Boolean(p & 16) },
            { varIndex: 2, negated: Boolean(p & 32) },
          ],
        },
      ],
    };

    const instance = compilePlanar3Sat(formula);
    for (let mask = 0; mask < 8; mask += 1) {
      const bits: Bit[] = [
        (mask & 1) as Bit,
        ((mask >> 1) & 1) as Bit,
        ((mask >> 2) & 1) as Bit,
      ];
      const extraFixed: Record<string, Bit> = {};
      instance.clauseMeta!.spineCells.forEach((sc, i) => {
        extraFixed[cellKey(sc.row, sc.col)] = bits[i];
      });
      const res = solveConundrum(instance, extraFixed);
      assert.equal(res.status === 'SAT', evaluateFormula(formula, bits));
    }
  }
});

test('compilePlanar3Sat maps unsatisfiable Planar 3-SAT (x1) AND (~x1) to UNSAT grid', () => {
  const unsatFormula: Planar3SatFormula = {
    id: 'unsat-planar',
    name: 'Unsat Planar',
    variables: ['x₁'],
    clauses: [
      {
        id: 'C₁',
        side: 'upper',
        layer: 0,
        literals: [
          { varIndex: 0, negated: false, portSlot: 0 },
          { varIndex: 0, negated: false, portSlot: 1 },
          { varIndex: 0, negated: false, portSlot: 2 },
        ],
      },
      {
        id: 'C₂',
        side: 'lower',
        layer: 0,
        literals: [
          { varIndex: 0, negated: true, portSlot: 0 },
          { varIndex: 0, negated: true, portSlot: 1 },
          { varIndex: 0, negated: true, portSlot: 2 },
        ],
      },
    ],
  };

  const inst = compilePlanar3Sat(unsatFormula);
  assert.equal(inst.isSatisfiable, false);
  const solved = solveConundrum(inst);
  assert.equal(solved.status, 'UNSAT');
});

test('ALL_PRESETS exports all 5 distinct presets with verified satisfiability', () => {
  assert.equal(ALL_PRESETS.length, 5);
  for (const preset of ALL_PRESETS) {
    const res = solveConundrum(preset);
    assert.equal(res.status === 'SAT', preset.isSatisfiable, preset.id);
  }
});
