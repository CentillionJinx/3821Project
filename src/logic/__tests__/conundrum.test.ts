import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_2X2_STATES,
  BASE_PRESETS,
  bruteForceSolutions,
  createInitialBoard,
  solveConundrum,
  tau,
  verifyConundrum,
  type Bit,
  type ConundrumInstance,
} from '../conundrum.ts';
import { SCHAEFER_TABLE } from '../planarReduction.ts';

test('tau partitions {0,1}^4 into R0 (2), R2 (12), R4 (2) with even parity', () => {
  assert.equal(ALL_2X2_STATES.length, 16);
  const counts = { 0: 0, 2: 0, 4: 0 };

  for (const s of ALL_2X2_STATES) {
    assert.equal(s.tau % 2, 0);
    counts[s.tau] += 1;

    // Diagonal Characterization of R2: tau == 2 iff (a != c) || (b != d)
    const diagDiff = (s.diagAC | s.diagBD) === 1;
    assert.equal(s.tau === 2, diagDiff);

    // Z2 global bit-flip invariance
    const flipped = tau((s.a ^ 1) as Bit, (s.b ^ 1) as Bit, (s.c ^ 1) as Bit, (s.d ^ 1) as Bit);
    assert.equal(flipped, s.tau);
  }

  assert.deepEqual(counts, { 0: 2, 2: 12, 4: 2 });
});

test('Schaefer Dichotomy: R0 & R4 are affine and bijunctive, while R2 violates all 6 tractable clones', () => {
  const asTupleSet = (target: 0 | 2 | 4) =>
    new Set(
      ALL_2X2_STATES.filter((s) => s.tau === target).map((s) => `${s.a}${s.b}${s.c}${s.d}`),
    );

  const r0 = asTupleSet(0);
  const r2 = asTupleSet(2);
  const r4 = asTupleSet(4);

  const checkProperties = (rel: Set<string>) => {
    const tuples = [...rel].map((str) => str.split('').map(Number) as [Bit, Bit, Bit, Bit]);
    const is0Valid = rel.has('0000');
    const is1Valid = rel.has('1111');

    let isHorn = true;
    let isDualHorn = true;
    for (const u of tuples) {
      for (const v of tuples) {
        const andKey = u.map((b, i) => b & v[i]).join('');
        const orKey = u.map((b, i) => b | v[i]).join('');
        if (!rel.has(andKey)) isHorn = false;
        if (!rel.has(orKey)) isDualHorn = false;
      }
    }

    let isAffine = true;
    let isBijunctive = true;
    for (const x of tuples) {
      for (const y of tuples) {
        for (const z of tuples) {
          const xorKey = x.map((b, i) => b ^ y[i] ^ z[i]).join('');
          const majKey = x.map((b, i) => (b + y[i] + z[i] >= 2 ? 1 : 0)).join('');
          if (!rel.has(xorKey)) isAffine = false;
          if (!rel.has(majKey)) isBijunctive = false;
        }
      }
    }

    return { is0Valid, is1Valid, isHorn, isDualHorn, isAffine, isBijunctive };
  };

  assert.deepEqual(checkProperties(r0), {
    is0Valid: true,
    is1Valid: true,
    isHorn: true,
    isDualHorn: true,
    isAffine: true,
    isBijunctive: true,
  });

  assert.deepEqual(checkProperties(r4), {
    is0Valid: false,
    is1Valid: false,
    isHorn: false,
    isDualHorn: false,
    isAffine: true,
    isBijunctive: true,
  });

  assert.deepEqual(checkProperties(r2), {
    is0Valid: false,
    is1Valid: false,
    isHorn: false,
    isDualHorn: false,
    isAffine: false,
    isBijunctive: false,
  });

  assert.equal(SCHAEFER_TABLE.length, 6);
  for (const row of SCHAEFER_TABLE) {
    assert.equal(row.r2Holds, false);
  }
});

test('verifyConundrum detects partial infeasibility, dual cut degrees, and exact operation counts', () => {
  const inst: ConundrumInstance = {
    id: 'partial-test',
    name: 'Partial Test',
    subtitle: '',
    rows: 2,
    cols: 3,
    fixed: { '0,0': 0 },
    clues: [
      { row: 1, col: 1, target: 0 },
      { row: 1, col: 2, target: 4 },
    ],
    description: '',
    isSatisfiable: false,
  };

  const board = createInitialBoard(inst);
  // Set (0,1) = 1 -> makes r(1,1)=0 immediately infeasible even with bottom row null
  board[0][1] = 1;
  const v1 = verifyConundrum(inst, board);
  assert.equal(v1.verdict, 'INFEASIBLE');
  assert.equal(v1.clueResults[0].status, 'infeasible');
  assert.equal(v1.clueResults[0].validCompletions, 0);
  // r(1,2)=4 still has valid completions (0,1)=1 -> (1,2)=1, (1,1)=0, (0,2)=0
  assert.equal(v1.clueResults[1].status, 'pending');
  assert.equal(
    v1.opsBreakdown.totalOps,
    v1.opsBreakdown.anchorChecks +
      v1.opsBreakdown.clueChecks +
      v1.opsBreakdown.partialCompletionChecks,
  );

  // Full board check verifies dual edge-cut degree === actualTau
  const fullBoard: Bit[][] = [
    [0, 1, 0],
    [0, 1, 1],
  ];
  const v2 = verifyConundrum(inst, fullBoard);
  assert.equal(v2.verdict, 'REJECT');
  for (const c of v2.clueResults) {
    assert.equal(c.activeCutDegree, c.actualTau);
  }
});

test('solveConundrum matches bruteForceSolutions across all base presets', () => {
  for (const preset of BASE_PRESETS) {
    const solved = solveConundrum(preset);
    assert.equal(solved.status === 'SAT', preset.isSatisfiable, preset.id);

    if (preset.rows * preset.cols <= 20) {
      const bf = bruteForceSolutions(preset, 100);
      if (preset.isSatisfiable) {
        assert.ok(bf.length >= 1, `${preset.id} should have >=1 brute force solution`);
        if (solved.solution === null) assert.fail(`${preset.id} solution was null`);
        const verified = verifyConundrum(preset, solved.solution);
        assert.equal(verified.verdict, 'ACCEPT');
      } else {
        assert.equal(bf.length, 0);
        assert.equal(solved.solution, null);
      }
    } else if (solved.solution) {
      const verified = verifyConundrum(preset, solved.solution);
      assert.equal(verified.verdict, 'ACCEPT');
    }
  }

  // Parity Pair 4x4 must have a strictly unique solution
  const parityPair = BASE_PRESETS.find((p) => p.id === 'parity-pair')!;
  assert.equal(bruteForceSolutions(parityPair, 5).length, 1);
});
