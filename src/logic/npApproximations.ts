/**
 * Bonus Research: Approximations of NP-Complete Problems
 * Directly aligned with COMP3821 Progression Review:
 * "BONUS RESEARCH:
 *  Zero knowledge proof protocol (bonus)
 *  Approximations of NP-complete problems (bonus)"
 */

export interface ApproxProblemItem {
  id: string;
  name: string;
  category: string;
  optimalStatus: string;
  bestApproxRatio: string;
  complexityClass: string;
  summaryLayman: string;
  summaryRigorous: string;
  algorithmName: string;
  algorithmSteps: string[];
  tightnessNote: string;
}

export const NP_APPROXIMATION_TOPICS: ApproxProblemItem[] = [
  {
    id: 'vertex-cover',
    name: 'Minimum Vertex Cover (2-Approximation)',
    category: 'Graph Covering',
    optimalStatus: 'NP-hard (Karp 1972)',
    bestApproxRatio: 'Factor 2 (Polynomial Time)',
    complexityClass: 'APX-Complete',
    summaryLayman:
      'Finding the absolute smallest set of guards to watch all hallways in a castle is NP-hard. But you can easily guarantee AT MOST TWICE the optimal guards: find any unwatched hallway, place a guard at BOTH ends, and repeat until all halls are watched!',
    summaryRigorous:
      'The Maximal Matching heuristic repeatedly selects an arbitrary uncovered edge e = (u, v), adds both endpoints {u, v} to cover C, and removes all incident edges. Since any valid vertex cover must select at least one endpoint from each edge in a matching M, OPT >= |M|, while the algorithm outputs |C| = 2|M| <= 2 * OPT.',
    algorithmName: 'Maximal Matching 2-Approximation',
    algorithmSteps: [
      'Initialize candidate cover C = ∅ and edge set E\' = E.',
      'While E\' is not empty: select an arbitrary edge (u, v) ∈ E\'.',
      'Add both u and v to C: C ← C ∪ {u, v}.',
      'Remove all edges incident to either u or v from E\'.',
      'Return cover C. Runtime is O(|V| + |E|), with guarantee |C| ≤ 2 · OPT.',
    ],
    tightnessNote:
      'Under the Unique Games Conjecture (Khot & Regev 2008), no polynomial-time algorithm can achieve an approximation factor of 2 - ε for any constant ε > 0.',
  },
  {
    id: 'metric-tsp',
    name: 'Metric TSP (Christofides 1.5-Approximation)',
    category: 'Routing & Tours',
    optimalStatus: 'NP-hard',
    bestApproxRatio: '3/2 (1.5) Factor (Christofides 1976 / Karlin et al. 2021)',
    complexityClass: 'APX-Complete (Metric)',
    summaryLayman:
      'Visiting N cities and returning home with shortest total travel is notoriously hard. When travel distances obey the triangle inequality (a shortcut is never longer than a detour), Christofides combines a Minimum Spanning Tree with odd-vertex pairing to guarantee total distance within 150% of the true shortest tour!',
    summaryRigorous:
      'Construct a Minimum Spanning Tree T (cost(T) <= OPT). The set O of vertices with odd degree in T has even cardinality |O|. Compute a minimum-weight perfect matching M on O in polynomial time (cost(M) <= 0.5 * OPT). The multigraph T ∪ M is Eulerian. An Eulerian tour shortcutted via triangle inequality yields a Hamiltonian cycle of cost <= cost(T) + cost(M) <= 1.5 * OPT.',
    algorithmName: 'Christofides–Serdyukov Algorithm',
    algorithmSteps: [
      'Compute a Minimum Spanning Tree T of complete graph G with metric weights (O(|E| log |V|)).',
      'Identify the subset O ⊆ V of vertices having odd degree in T.',
      'Compute a minimum-weight perfect matching M on the induced subgraph G[O] using Edmonds’ Blossom algorithm.',
      'Combine edges of T and M to form connected Eulerian multigraph H.',
      'Find an Eulerian circuit in H, and shortcut repeated vertices by skipping directly to the next unvisited vertex (triangle inequality).',
      'Return the resulting Hamiltonian cycle of total length ≤ 1.5 · OPT.',
    ],
    tightnessNote:
      'General TSP without triangle inequality cannot be approximated within ANY factor α(n) in polynomial time unless P = NP (by reduction from Hamiltonian Cycle).',
  },
  {
    id: 'max-3sat',
    name: 'MAX-3-SAT & The PCP Theorem (7/8 Barrier)',
    category: 'Boolean Constraint Satisfaction',
    optimalStatus: 'NP-hard',
    bestApproxRatio: '7/8 (0.875) Factor (Random Assignment)',
    complexityClass: 'APX-Hard (Håstad Inapproximability)',
    summaryLayman:
      'If a 3-SAT formula has no perfect satisfying assignment, how many clauses can you satisfy? Amazingly, simply flipping a fair coin for every variable satisfies 7/8 (87.5%) of clauses in expectation! Johan Håstad proved in 1997 that achieving even 7/8 + 0.0001 in polynomial time is NP-hard!',
    summaryRigorous:
      'Each 3-literal clause is satisfied with probability 1 - (1/2)^3 = 7/8 under uniform random assignment. By linearity of expectation, E[satisfied] = (7/8)m. By Håstad’s seminal 1997 PCP theorem result, for any ε > 0, distinguishing between formulas where 1 - ε fraction of clauses are satisfiable vs at most 7/8 + ε is NP-hard.',
    algorithmName: 'Method of Conditional Expectations / Random Assignment',
    algorithmSteps: [
      'Given 3-CNF formula with m clauses where each clause contains exactly 3 distinct literals.',
      'Assign each variable True with probability 0.5 independently.',
      'Each clause C_j fails if and only if all 3 literals evaluate to False (prob = 1/8).',
      'Probability of satisfying C_j is exactly 1 - 1/8 = 7/8.',
      'Total expected satisfied clauses = 0.875 · m ≥ 0.875 · OPT.',
      'Derandomized in deterministic O(n · m) time via conditional expectations.',
    ],
    tightnessNote:
      'Håstad (1997): Achieving an approximation ratio of 7/8 + ε for MAX-3-SAT is NP-hard for any ε > 0. The trivial random assignment is optimal among polynomial algorithms!',
  },
  {
    id: 'knapsack-fptas',
    name: '0-1 Knapsack (Fully Polynomial Time Approximation Scheme)',
    category: 'Dynamic Programming & Packing',
    optimalStatus: 'Weakly NP-hard',
    bestApproxRatio: '1 - ε for any chosen ε > 0',
    complexityClass: 'FPTAS (Admits (1-ε)-approximation)',
    summaryLayman:
      'Unlike MAX-3-SAT which hits a hard mathematical wall at 87.5%, the Knapsack problem can be solved to 99%, 99.9%, or 99.99% accuracy in polynomial time by rounding the numbers to a coarser scale!',
    summaryRigorous:
      '0-1 Knapsack can be solved in pseudo-polynomial time O(n · V_max) via value-based dynamic programming. By scaling down item values v_i\' = ⌊v_i / K⌋ with scaling factor K = (ε · V_max) / n, the reduced DP executes in O(n^3 / ε) true polynomial time while ensuring output profit >= (1 - ε) · OPT.',
    algorithmName: 'Value-Rounding Dynamic Programming FPTAS',
    algorithmSteps: [
      'Let V_max = max_i v_i be the largest item value and ε ∈ (0, 1) be desired error tolerance.',
      'Define scale factor K = (ε · V_max) / n.',
      'Define scaled profits v_i\' = ⌊v_i / K⌋ for all items i = 1..n.',
      'Run value-based dynamic programming on scaled instances: DP[i, v] = min weight for profit v.',
      'Max scaled profit is bounded by n · ⌊V_max / K⌋ = n^2 / ε.',
      'Backtrack optimal item set in O(n^3 / ε) time; total actual profit is at least (1 - ε) · OPT.',
    ],
    tightnessNote:
      'Strongly NP-hard problems (like 3-Partition or Bin Packing with variable bins) do not admit an FPTAS unless P = NP.',
  },
];
