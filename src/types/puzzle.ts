/**
 * Core Domain Types for COMP3821 NP-Completeness Lab
 * Represents Problem X (Grid Lock / Independent Vertex Gadget) and 3-SAT Reduction
 */

export type Literal = {
  variable: string; // e.g., 'x1', 'x2', 'x3'
  isNegated: boolean;
};

export type Clause = {
  id: string;
  literals: [Literal, Literal, Literal];
};

export type SatFormula = {
  variables: string[];
  clauses: Clause[];
};

export type TruthAssignment = Record<string, boolean>;

export type CellKind = 
  | 'empty'
  | 'wall'
  | 'variable-true'
  | 'variable-false'
  | 'clause-slot'
  | 'wire-corridor'
  | 'beacon';

export interface GridCell {
  row: number;
  col: number;
  kind: CellKind;
  id?: string;
  label?: string;
  groupId?: string; // e.g. clause id or variable id
  variableName?: string;
  isNegated?: boolean;
  value?: boolean | null; // Selected state
  isConflicted?: boolean; // Highlighted red (#dc3c41) when rules violated
  isValidSelection?: boolean; // Highlighted mint (#7efed9) when valid
}

export interface VerificationResult {
  isSatisfied: boolean;
  variableAssignmentsValid: boolean;
  allClausesSatisfied: boolean;
  conflictDetails: string[];
  satisfiedClausesCount: number;
  totalClausesCount: number;
}
