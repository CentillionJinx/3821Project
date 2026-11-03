/**
 * Researched Topics & Gadget Library (Citation Channel)
 * Directly aligned with COMP3821 Progression Review & Team Discussions:
 * - The Firefighter Problem (Finbow et al. 2007) & "Quell the Insurgency"
 * - Parks Problem (Star Battle) using 3-SAT
 * - Akari (Light Up) using Circuit-SAT
 * - Hedonic Games (Hedonic Among Us, Exact Cover by 3-Sets / RX3C)
 * - The Held-Karp Algorithm & TSP (O(n^2 · 2^n))
 * - Graph 3-Colouring & Vertex Cover (Karp's 21)
 * - XOR Squares Parity Gadgets
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
    id: 'firefighter-problem',
    title: 'The Firefighter Problem & Insurgency Quelling',
    sourceProblem: '3-SAT / Not-All-Equal 3-SAT',
    targetDomain: 'Dynamic Graph Contagion Containment',
    gadgetTypes: ['Tree Cascade Branches', 'Firefighter Barrier Chokepoint', 'Timed Propagation Waves'],
    citationChannelNote:
      'Team discussion: "Firefighter is the closest to this. Difference is fire vertices cannot be put out... Formal decision question: is there a strategy such that no more than k vertices burn?"',
    laymanExplainer:
      'A fire starts at a tree root. Every minute, the fire spreads to all unprotected neighbours, while you can place one firefighter to permanently shield one spot. Finbow et al. (2007) proved deciding whether at least k vertices can be saved is NP-complete even on simple trees! Our "Quell the Insurgency" puzzle extends this with graded unrest weights.',
    rigorousProofSketch:
      'Finbow, Hartnell, Li, Schmeisser (2007) proved Firefighter is NP-complete for trees of maximum degree 3 by reduction from 3-SAT. Variable choice gadgets branch into two propagation paths where saving one path allows the other to burn down to clause verification gates.',
    keyChallenge:
      'Analyzing multi-step temporal contagion dynamics where previous rounds irreversibly restrict future player actions.',
  },
  {
    id: 'carpets-floor-repair',
    title: 'Carpets Floor Multiplicity & Unique Cover',
    sourceProblem: 'Exact Cover by 3-Sets (X3C) / 3-SAT',
    targetDomain: '2D Multiplicity Grid & Geometric Set Cover',
    gadgetTypes: ['Damaged Floor Target v(t)', 'No-Waste Unique Cover Check', 'Toroidal Cylinder Wrap'],
    citationChannelNote:
      'Team discussion: "Each tile t has target value v(t). Overlap constraint: multiplicity in M = v(t). Unique cover constraint: for each carpet Q in B, exists t in Q with multiplicity 1."',
    laymanExplainer:
      'Covering a room with carpets so that damaged spots receive exactly the right thickness of padding, while strictly forbidding redundant carpets that cover no spot uniquely. This turns classic Set Cover into a constrained exact multiplicity puzzle!',
    rigorousProofSketch:
      'Reduction from X3C. Given universe U with 3q elements and family S of 3-element subsets. Each element maps to a grid tile with v(t) = 1. Subsets map to carpets. The unique cover constraint and target multiplicity force exactly q disjoint carpets to be selected, proving NP-completeness.',
    keyChallenge:
      'Ensuring carpets can be drawn as contiguous grid-aligned rectangles without requiring arbitrary disconnected shapes.',
  },
  {
    id: 'parks-star-battle',
    title: 'Parks Problem (Star Battle) Reduction from 3-SAT',
    sourceProblem: '3-SAT (Known NP-Complete)',
    targetDomain: 'Grid-Based Region Placement (Parks / Star Battle)',
    gadgetTypes: ['Alternating Parity Variable Corridors', 'Clause Overlap Region', 'King-Move Non-Adjacency Buffers'],
    citationChannelNote:
      'Researched gadget architecture from classic Star Battle hardness proofs. We adapt the variable loop tracks and non-touching exclusion zones.',
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
    id: 'hedonic-among-us',
    title: 'Hedonic Games & Hedonic Among Us (Cooperative Coalition Formation)',
    sourceProblem: 'Exact Cover by 3-Sets (RX3C)',
    targetDomain: 'Game-Theoretic Agent Coalitions',
    gadgetTypes: ['Player Preference Rankings', 'Impostor Exclusion Sets', 'Coalition Stability Barriers'],
    citationChannelNote:
      'Progression Review: "hedonic Among Us: Have only looked at Exact Cover by 3-Sets... cooperative: turn-based fireboy & watergirl".',
    laymanExplainer:
      'In a hedonic coalition game, players want to form groups (crews) based on personal preferences. Deciding whether the players can divide themselves into mutually stable groups where nobody wants to defect is equivalent to finding an exact cover of 3-player teams where everyone is satisfied!',
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
