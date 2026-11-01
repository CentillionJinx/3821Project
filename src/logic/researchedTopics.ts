/**
 * Researched Topics & Gadget Library (Citation Channel)
 * Directly aligned with COMP3821 Progression Review:
 * - Graph Colouring, Vertex Cover, the Held-Karp algorithm
 * - Hedonic Games (Hedonic Among Us, Exact Cover by 3-Sets / RX3C)
 * - 3-SAT, Circuit SAT, Planar 3-SAT
 * - Parks Problem (Star Battle) using 3-SAT
 * - Akari (Light Up) using Circuit-SAT
 * - Cooperative / Turn-Based (Fireboy & Watergirl) & Destroy the Insurgency
 */

export interface ResearchedTopic {
  id: string;
  title: string;
  sourceProblem: string;
  targetDomain: string;
  gadgetTypes: string[];
  citationChannelNote: string;
  laymanExplainer: string;
  rigorousProofSketch: string;
  keyChallenge: string;
}

export const RESEARCHED_TOPICS: ResearchedTopic[] = [
  {
    id: 'parks-star-battle',
    title: 'Parks Problem (Star Battle) Reduction from 3-SAT',
    sourceProblem: '3-SAT (Known NP-Complete)',
    targetDomain: 'Grid-Based Region Placement (Parks / Star Battle)',
    gadgetTypes: ['Alternating Parity Variable Corridors', 'Clause Overlap Region', 'King-Move Non-Adjacency Buffers'],
    citationChannelNote:
      'Researched gadget architecture from classic Star Battle hardness proofs. We adapt the variable loop tracks and non-touching exclusion zones for our Carpets & Hearts puzzle.',
    laymanExplainer:
      'In Star Battle, you must put stars in a grid so none touch each other. A long narrow corridor acts like a binary light switch: stars can only fit in the even spaces (True) or the odd spaces (False). A clause room touches three of these tracks: if all three are False, their stars crowd into the doorway and leave nowhere for the clause room to put its own required star!',
    rigorousProofSketch:
      'Polynomial reduction f: 3-SAT → Star Battle. For each variable x_i, construct a cycle of length 2k in a 2-wide track. Exactly two maximal independent sets exist of size k (representing True and False). For each clause C_j = (l_1 ∨ l_2 ∨ l_3), construct a clause region R_j. The literal tracks border R_j such that assigning all literals False places stars in the 8-neighborhood of all cells in R_j, making it impossible to satisfy the region quota of 1 star without violating non-adjacency.',
    keyChallenge:
      'Ensuring planar layout and wire crossings without accidental adjacency conflicts between unrelated variable corridors.',
  },
  {
    id: 'akari-light-up',
    title: 'Akari (Light Up) Reduction from Circuit-SAT',
    sourceProblem: 'Circuit-SAT (Cook-Levin Theorem)',
    targetDomain: 'Grid Lighting with Numbered Obstacles',
    gadgetTypes: ['Wire Rays', 'Inverter (NOT Gate)', 'Splitter', 'OR / AND Intersection Gadgets'],
    citationChannelNote:
      'Researched Akari hardness reductions. Akari uses light rays propagating along rows and columns, with numbered black blocks (0, 1, 2, 3, 4) constraining bulb placement.',
    laymanExplainer:
      'Light bulbs cast beams across unobstructed rows and columns. Placing a bulb emits a beam representing a True signal. Numbered wall blocks force local decisions: for example, a block labeled "1" next to two candidate spots forces exactly one bulb to be placed, creating a logical NOT gate!',
    rigorousProofSketch:
      'Circuit-SAT reduces to Akari by simulating logic wires with light corridors. A beam arriving at a gadget either illuminates a designated cell or leaves it dark. Logic gates (NOT, AND, OR) are constructed using numbered wall constraints (0..4) and beam occlusion. The final circuit output is clamped to True by requiring a specific corridor to be illuminated without causing bulb-bulb illumination conflicts.',
    keyChallenge:
      'Preventing long-range light rays from inadvertently leaking into distant downstream logic gates across the grid.',
  },
  {
    id: 'xor-squares-gadgets',
    title: 'XOR Squares from 3-SAT (Our Leading Original Candidate)',
    sourceProblem: '3-SAT',
    targetDomain: 'Overlapping Bounding Box Parity Grid',
    gadgetTypes: ['Mutex Overlap Cell (x_i ⊕ ¬x_i = 1)', 'Clause Parity Absorber', 'Slack Boundary Buffers'],
    citationChannelNote:
      'Progression Review: "(almost) finished developing literal and clause gadgets using overlapping squares." Our primary original NP-complete candidate puzzle.',
    laymanExplainer:
      'Squares placed on a board overlap. Whenever an odd number of squares cover a cell, it lights up (XOR parity 1); an even number cancels out to 0. A variable’s True and False squares share a single cell marked "Must be Odd", forcing you to pick one or the other, but never both or neither! Clause cells check that at least one true literal square touches them.',
    rigorousProofSketch:
      'Deterministic polynomial reduction from 3-SAT. Each variable x_i maps to candidate squares S_i^T and S_i^F intersecting at cell c_i^mutex with parity constraint 1. Clause C_j maps to cell c_j^clause with target parity 1 and auxiliary slack squares. An assignment satisfies φ iff the corresponding square selection satisfies all grid cell parity constraints (mod 2).',
    keyChallenge:
      'Constructing clause parity gadgets that absorb slack when 2 or 3 literals in a clause are simultaneously True without overflowing the modulo 2 parity.',
  },
  {
    id: 'hedonic-among-us',
    title: 'Hedonic Games & Hedonic Among Us (Cooperative Coalition Formation)',
    sourceProblem: 'Exact Cover by 3-Sets (RX3C)',
    targetDomain: 'Game-Theoretic Agent Coalitions',
    gadgetTypes: ['Player Preference Rankings', 'Impostor Exclusion Sets', 'Coalition Stability Barriers'],
    citationChannelNote:
      'Progression Review: "hedonic Among Us: Have only looked at Exact Cover by 3-Sets (like looked/stared at without brain activity). cooperative: turn-based fireboy & watergirl".',
    laymanExplainer:
      'In a hedonic coalition game, players want to form groups (crews) based on personal preferences (they only like certain crewmates). Deciding whether the players can divide themselves into mutually stable groups where nobody wants to defect is equivalent to finding an exact cover of 3-player teams where everyone is satisfied!',
    rigorousProofSketch:
      'Reduction from Restricted Exact Cover by 3-Sets (RX3C). Given universe U = {u_1, ..., u_{3q}} and 3-element subsets S_1, ..., S_m where each element appears in exactly 3 subsets. Each element u_i and subset S_j is represented by players whose preference rankings make a coalition stable if and only if it corresponds to an exact 3-cover of U.',
    keyChallenge:
      'Strict stability vs core non-emptiness proofs require intricate preference rankings to prevent cyclic defection chains (blocking coalitions).',
  },
  {
    id: 'held-karp-tsp',
    title: 'The Held-Karp Algorithm & TSP (Dynamic Programming)',
    sourceProblem: 'Hamiltonian Cycle (Karp 1972) / Metric TSP',
    targetDomain: 'Exact Exponential Algorithms vs Heuristics',
    gadgetTypes: ['Subset State Memoization DP[S, v]', 'Subpath Cost Extension', 'Metric Triangle Shortcut'],
    citationChannelNote:
      'Researched dynamic programming algorithms for NP-hard routing. Held-Karp reduces TSP runtime from O(n!) brute-force to O(n^2 · 2^n).',
    laymanExplainer:
      'Brute force checking all paths between 20 cities takes 2.4 quintillion steps. Held-Karp remembers the shortest way to visit a specific subset of cities ending at city V. This dynamic programming breakthrough cuts the time dramatically to 20^2 · 2^20 (about 400 million operations) — still exponential, but vastly faster!',
    rigorousProofSketch:
      'Recurrence: Let C(S, v) be minimum cost of a path visiting all vertices in subset S ⊆ V starting at vertex 1 and ending at v ∈ S. Base: C({1, v}, v) = dist(1, v). Recurrence: C(S, v) = min_{u ∈ S \\ {v}} [C(S \\ {v}, u) + dist(u, v)]. Total subproblems = n · 2^n. Each takes O(n) transitions. Total runtime O(n^2 · 2^n) and space O(n · 2^n).',
    keyChallenge:
      'Exponential memory consumption O(n · 2^n) restricts practical exact execution to n <= 28 vertices in RAM.',
  },
  {
    id: 'graph-colouring-vc',
    title: 'Graph 3-Colouring & Vertex Cover (Karp’s 21 Reductions)',
    sourceProblem: '3-SAT (Cook-Levin)',
    targetDomain: 'Graph Vertex Labeling & Edge Domination',
    gadgetTypes: ['Triangle Base Palette (T, F, Base)', 'OR-Gadget Triangle Network', 'Independent Set Dual'],
    citationChannelNote:
      'Foundational reductions from Karp (1972). Graph 3-Colouring forms the bedrock of gadget theory and zero-knowledge proof protocols.',
    laymanExplainer:
      'In 3-Colouring, you color graph dots with 3 colors so no two connected dots share a color. A central triangle fixes the 3 colors as "True", "False", and "Base". Small triangular subgraphs force variables to choose True or False, and clause gadgets make sure connected nodes cannot all evaluate to False!',
    rigorousProofSketch:
      'Karp’s 3-SAT ≤ₚ 3-Colouring: Fixed triangle with vertices {T, F, B}. For each variable x_i, triangle {x_i, ¬x_i, B} ensures x_i, ¬x_i ∈ {T, F} and x_i ≠ ¬x_i. For clause (l_1 ∨ l_2 ∨ l_3), a 6-vertex gadget connects the literal vertices to T and B such that the gadget is 3-colorable iff at least one literal is colored T.',
    keyChallenge:
      'Planar 3-Colouring requires crossover gadgets to avoid edge intersections in 2D space while preserving 3-colorability.',
  },
];
