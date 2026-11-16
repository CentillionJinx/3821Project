export interface TimelineStage {
  id: string;
  step: string;
  weeks: string;
  commitRef: string;
  title: string;
  concept: string;
  formalSummary: string;
  limitation: string;
  citation?: string;
}

export interface SupersededCandidate {
  name: string;
  stage: string;
  constraint: string;
  verifierBound: string;
  whySuperseded: string;
}

export const TEAM_MEMBERS = [
  { name: 'Edward Dsouza', zid: 'z5689255' },
  { name: 'Louise Liu', zid: 'z5700939' },
  { name: 'Emmett Shang', zid: 'z5690546' },
  { name: 'Gururam Subramanian', zid: 'z5636559' },
  { name: 'Ryan Zhou', zid: 'z5688014' },
] as const;

export const TIMELINE_STAGES: TimelineStage[] = [
  {
    id: 'stage-01',
    step: '01',
    weeks: 'Weeks 1–5',
    commitRef: '9d8ead8 · proposal.md',
    title: 'Proposal & Complexity Foundations',
    concept:
      'Established decision vs search framing (P, NP, NP-complete), polynomial-time reductions Y ≤ₚ X, and early dungeon/routing prototypes.',
    formalSummary:
      '3-SAT Trap Dungeon modelled literal choice diamonds and clause switch gates in O(|V|+|D|); ML-Numberlink explored vertex-disjoint grid wire routing.',
    limitation:
      'Trap Dungeon mapped 3-SAT syntax too transparently onto graph switches, while ML-Numberlink omitted an actual disjointness check in its verifier stub and required planar wire-crossover gadgets.',
    citation: 'Kramer & van Leeuwen (1984); Kotsuma & Takenaga (2010); Kendall, Parkes, & Spoerer (2008).',
  },
  {
    id: 'stage-02',
    step: '02',
    weeks: 'Weeks 6–7',
    commitRef: '4173857 · e3f5fb0',
    title: 'Progression Review & Scope Decoupling',
    concept:
      'Decoupled interactive zero-knowledge proof protocols and approximation algorithms into secondary material to prioritize a rigorous core puzzle proof.',
    formalSummary:
      'Prototyped XOR Rectangles: selecting a subset S of axis-aligned squares so every grid tile achieves target parity ⊕_{q ∈ S} 1_q(t) = p(t) mod 2.',
    limitation:
      'Unbounded rectangle overlaps created non-local global parity constraints (closer to GF(2) linear systems), and the early UI used synthetic metric multipliers instead of exact operation counters.',
    citation: 'Pass & Birrell (2009); COMP3821 Progression Review.',
  },
  {
    id: 'stage-03',
    step: '03',
    weeks: 'Week 8',
    commitRef: '8326232',
    title: 'Team Candidate Puzzle Exploration',
    concept:
      'Formulated three original candidate puzzles: Carpets, Grid-Organ (Hearts // Microbes), and Quell the Insurgency.',
    formalSummary:
      'Carpets constrained tile overlap multiplicity v(t); Grid-Organ enforced organ/tissue avoidance O(A) ∩ T(B) = ∅; Quell the Insurgency adapted Firefighter containment on weighted graphs.',
    limitation:
      'Carpets mirrored classical Exact Cover (Karp 1972); Insurgency relied on multi-turn simulation rather than a clean 2D grid certificate; Grid-Organ polyominoes resisted compact gadget proofs.',
    citation: 'Karp (1972); Hartnell (1995); Finbow, King, MacGillivray, & Rizzi (2007).',
  },
  {
    id: 'stage-04',
    step: '04',
    weeks: 'Weeks 8–9',
    commitRef: '9ccbdf8 · 9c59bbf',
    title: 'Grid-Organ Poster & Figure Detour',
    concept:
      'Built deterministic TSV-to-SVG figure scripts and an A-series poster layout around Grid-Organ before auditing proof clarity.',
    formalSummary:
      'Generated fixed polyomino figures for organ/microbe placement and audited verifier complexity against tile counts.',
    limitation:
      'Irregular polyomino shapes introduced high syntactic overhead in reductions and diverged from the minimalist binary corner-clue formulation.',
    citation: 'Demaine & Hearn (2009) — Games, Puzzles, and Computation.',
  },
  {
    id: 'stage-05',
    step: '05',
    weeks: 'Week 10',
    commitRef: '45d0a0d · 3c512ec',
    title: 'Colouring Conundrum Draft (3-Colour Model)',
    concept:
      'Pivoted to corner-clued grid colouring, initially implementing a 3-colour polyomino-region diversity puzzle χ : R → {0, 1, 2}.',
    formalSummary:
      'Checked distinct region colours at interior corners in O(|C| + |R|) and sketched gadgets G1–G4 while leaving planar layout and case analysis explicitly open.',
    limitation:
      'Region-colour diversity diverged from the binary XOR-square rule τ ∈ {0, 2, 4}, and the G1–G4 sketch lacked concrete coordinates, truth tables, and polynomial area bounds.',
  },
  {
    id: 'stage-06',
    step: '06',
    weeks: 'Final',
    commitRef: 'Ground-Up Rewrite',
    title: 'Binary XOR-Square & Constructive Planar 3-SAT Proof',
    concept:
      'Rebuilt around the canonical 2-colour tile formulation χ : G → {0, 1} with corner transition functional τ(a,b,c,d) = r(S) ∈ {0, 2, 4}.',
    formalSummary:
      'Proved NP-completeness via Schaefer’s Dichotomy (R₂ breaks all 6 tractable clones) and a constructive Rectilinear Planar 3-SAT compiler (G1–G4) with O((n+m)²) grid bound and exact Parity DSU + DPLL solver.',
    limitation:
      'Complete and verified: 512/512 literal polarity checks, exhaustive 8-row G3 truth table, and O(N·M) verifier with exact elementary operation counts.',
    citation: 'Schaefer (1978); Lichtenstein (1982); Knuth & Raghunathan (1992).',
  },
];

export const SUPERSEDED_CANDIDATES: SupersededCandidate[] = [
  {
    name: '3-SAT Trap Dungeon',
    stage: 'Stage 01',
    constraint: 'Path traversal with switch-gated rooms',
    verifierBound: 'O(|V| + |D|)',
    whySuperseded: 'Too directly isomorphic to raw 3-SAT clause switches; weak grid locality.',
  },
  {
    name: 'ML-Numberlink',
    stage: 'Stage 01',
    constraint: 'Vertex-disjoint terminal paths on 2D grid',
    verifierBound: 'O(N·M)',
    whySuperseded: 'Closely mirrors known Numberlink reductions; early verifier stub skipped collisions.',
  },
  {
    name: 'XOR Rectangles',
    stage: 'Stage 02',
    constraint: 'Subset parity ⊕ 1_q(t) = p(t) over squares',
    verifierBound: 'O(N·M + |S|)',
    whySuperseded: 'Pure linear GF(2) parity without local non-affine constraints collapses toward P.',
  },
  {
    name: 'Carpets Floor',
    stage: 'Stage 03',
    constraint: 'Exact overlap multiplicity v(t) & unique cover',
    verifierBound: 'O(N·M)',
    whySuperseded: 'Reduces cleanly from Exact Cover / Set Cover rather than local planar topology.',
  },
  {
    name: 'Grid-Organ (Hearts)',
    stage: 'Stage 03–04',
    constraint: 'Asymmetric polyomino exclusion O(A) ∩ T(B) = ∅',
    verifierBound: 'O(N·M)',
    whySuperseded: 'Arbitrary polyomino coordinates obscure concise bidirectional gadget proofs.',
  },
  {
    name: 'Quell the Insurgency',
    stage: 'Stage 03',
    constraint: 'Weighted multi-round graph contagion containment',
    verifierBound: 'O(T·(|V|+|E|))',
    whySuperseded: 'Multi-turn dynamic graph state diverges from static 2D grid puzzle structure.',
  },
  {
    name: '3-Colour Region Draft',
    stage: 'Stage 05',
    constraint: '3-colour polyomino corner diversity d ∈ {0,1,2}',
    verifierBound: 'O(|C| + |R|)',
    whySuperseded: 'Wrong colour cardinality & unproved gadget sketch; replaced by binary XOR-Square.',
  },
];
