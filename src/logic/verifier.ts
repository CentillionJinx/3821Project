import type { SatFormula, TruthAssignment, VerificationResult } from '../types/puzzle';

export const SAMPLE_FORMULAS: { name: string; description: string; formula: SatFormula }[] = [
  {
    name: 'Introductory 2-Clause (Satisfiable)',
    description: 'The worked instance from Section 2 of proposal: (x₁ ∨ x₂ ∨ x₃) ∧ (¬x₁ ∨ ¬x₂ ∨ x₃)',
    formula: {
      variables: ['x1', 'x2', 'x3'],
      clauses: [
        {
          id: 'C1',
          literals: [
            { variable: 'x1', isNegated: false },
            { variable: 'x2', isNegated: false },
            { variable: 'x3', isNegated: false },
          ],
        },
        {
          id: 'C2',
          literals: [
            { variable: 'x1', isNegated: true },
            { variable: 'x2', isNegated: true },
            { variable: 'x3', isNegated: false },
          ],
        },
      ],
    },
  },
  {
    name: 'Cycle Conflict 3-Clause',
    description: '(x₁ ∨ ¬x₂ ∨ x₃) ∧ (¬x₁ ∨ x₂ ∨ ¬x₃) ∧ (x₁ ∨ x₂ ∨ ¬x₃)',
    formula: {
      variables: ['x1', 'x2', 'x3'],
      clauses: [
        {
          id: 'C1',
          literals: [
            { variable: 'x1', isNegated: false },
            { variable: 'x2', isNegated: true },
            { variable: 'x3', isNegated: false },
          ],
        },
        {
          id: 'C2',
          literals: [
            { variable: 'x1', isNegated: true },
            { variable: 'x2', isNegated: false },
            { variable: 'x3', isNegated: true },
          ],
        },
        {
          id: 'C3',
          literals: [
            { variable: 'x1', isNegated: false },
            { variable: 'x2', isNegated: false },
            { variable: 'x3', isNegated: true },
          ],
        },
      ],
    },
  },
  {
    name: 'Unsatisfiable Pigeonhole Gadget',
    description: 'Requires all variables to simultaneously satisfy contradictory single-truth clauses',
    formula: {
      variables: ['x1', 'x2'],
      clauses: [
        {
          id: 'C1',
          literals: [
            { variable: 'x1', isNegated: false },
            { variable: 'x2', isNegated: false },
            { variable: 'x1', isNegated: false },
          ],
        },
        {
          id: 'C2',
          literals: [
            { variable: 'x1', isNegated: true },
            { variable: 'x2', isNegated: false },
            { variable: 'x1', isNegated: true },
          ],
        },
        {
          id: 'C3',
          literals: [
            { variable: 'x1', isNegated: false },
            { variable: 'x2', isNegated: true },
            { variable: 'x1', isNegated: false },
          ],
        },
        {
          id: 'C4',
          literals: [
            { variable: 'x1', isNegated: true },
            { variable: 'x2', isNegated: true },
            { variable: 'x1', isNegated: true },
          ],
        },
      ],
    },
  },
];

/**
 * Pure verifier function implementing NP-membership check (polynomial time)
 */
export function verifySolution(formula: SatFormula, assignment: TruthAssignment): VerificationResult {
  const conflictDetails: string[] = [];
  let satisfiedClausesCount = 0;

  // 1. Verify variable assignment integrity (every variable has a defined boolean)
  let variableAssignmentsValid = true;
  for (const v of formula.variables) {
    if (assignment[v] === undefined || assignment[v] === null) {
      variableAssignmentsValid = false;
      conflictDetails.push(`Variable ${v} is unassigned.`);
    }
  }

  // 2. Verify each clause has at least 1 true literal
  for (const clause of formula.clauses) {
    let clauseSatisfied = false;
    for (const lit of clause.literals) {
      const val = assignment[lit.variable];
      if (val !== undefined && val !== null) {
        const litValue = lit.isNegated ? !val : val;
        if (litValue === true) {
          clauseSatisfied = true;
          break;
        }
      }
    }

    if (clauseSatisfied) {
      satisfiedClausesCount++;
    } else {
      conflictDetails.push(`Clause [${clause.id}] is violated: no chosen literal evaluates to true.`);
    }
  }

  const allClausesSatisfied = satisfiedClausesCount === formula.clauses.length;
  const isSatisfied = variableAssignmentsValid && allClausesSatisfied;

  return {
    isSatisfied,
    variableAssignmentsValid,
    allClausesSatisfied,
    conflictDetails,
    satisfiedClausesCount,
    totalClausesCount: formula.clauses.length,
  };
}

/**
 * Brute force SAT solver to test soundness & completeness for small pedagogical instances
 */
export function findSatisfyingAssignments(formula: SatFormula): TruthAssignment[] {
  const results: TruthAssignment[] = [];
  const vars = formula.variables;
  const numCombos = 1 << vars.length;

  for (let i = 0; i < numCombos; i++) {
    const candidate: TruthAssignment = {};
    for (let bit = 0; bit < vars.length; bit++) {
      candidate[vars[bit]] = Boolean((i >> bit) & 1);
    }

    const { isSatisfied } = verifySolution(formula, candidate);
    if (isSatisfied) {
      results.push(candidate);
    }
  }

  return results;
}
