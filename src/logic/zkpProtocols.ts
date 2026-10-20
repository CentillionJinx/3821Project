import type { TrapDungeonPreset } from './candidates';

/* ============================================================================
 * SECTION 4: ZERO-KNOWLEDGE PROOF (ZKP) PROTOCOLS (Goldreich-Micali-Wigderson & Blum)
 * ============================================================================ */

export interface BlumTranscriptRound {
  round: number;
  proverMode: 'honest' | 'cheating';
  challengeBit: 0 | 1; // 0 = Isomorphism Audit, 1 = Permuted Trap-Path Audit
  permutationMap: Record<string, string>; // v -> sigma(v)
  commitmentHashG: string;
  commitmentHashT: string;
  commitmentHashPi: string;
  revealedContent: string;
  passed: boolean;
  cumulativeSoundness: number; // 1 - (1/2)^R
}

/**
 * Deterministic fast hex hash generator simulating SHA-256(data || nonce)
 */
export function pseudoSha256(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `0x${hex1}${hex2}...${hex1.slice(0, 4)}`;
}

/**
 * Generates a single round of Protocol A: Blum-Style Graph Isomorphism ZKP for Trap-Path
 */
export function runBlumZkpRound(
  preset: TrapDungeonPreset,
  roundNumber: number,
  challengeBit: 0 | 1,
  proverMode: 'honest' | 'cheating'
): BlumTranscriptRound {
  const nodeIds = preset.nodes.map((n) => n.id);
  const labels = nodeIds.map((_, idx) => `w${idx + 1}`);

  // Fisher-Yates shuffle for permutation sigma in S_n
  const shuffled = [...labels];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const permutationMap: Record<string, string> = {};
  nodeIds.forEach((id, i) => {
    permutationMap[id] = shuffled[i];
  });

  const nonce = Math.random().toString(36).substring(2, 8);
  const commitmentHashG = pseudoSha256(`G'=${JSON.stringify(permutationMap)}||${nonce}`);
  const commitmentHashT = pseudoSha256(`T'=${JSON.stringify(preset.trapEdges)}||${nonce}`);
  const permutedWitness = preset.validWitnessPath.map((v) => permutationMap[v]);
  const commitmentHashPi = pseudoSha256(`pi'=${permutedWitness.join('-')}||${nonce}`);

  let passed = true;
  let revealedContent = '';

  if (proverMode === 'honest') {
    if (challengeBit === 0) {
      const mappingStr = Object.entries(permutationMap)
        .map(([k, v]) => `${k}↦${v}`)
        .join(', ');
      revealedContent = `Opened σ = {${mappingStr}}. Verified G' = σ(G) and T' = σ(T). Path π' stays sealed!`;
      passed = true;
    } else {
      revealedContent = `Kept σ secret! Opened permuted path π' = (${permutedWitness.join(' → ')}) on (G', T'). Theorem 2 verifier confirmed 0 trap violations.`;
      passed = true;
    }
  } else {
    // Cheating prover doesn't know a valid path: either fakes G'/T' (caught on b=0) or fakes pi' (caught on b=1)
    const cheaterGuessedBit = Math.random() < 0.5 ? 0 : 1;
    passed = cheaterGuessedBit === challengeBit;
    if (challengeBit === 0) {
      revealedContent = passed
        ? `Cheater gambled on b=0 and committed honest G' = σ(G). Passed this round by luck (ε = 1/2).`
        : `CAUGHT (b=0): Prover mutated trap edge in T' to hide a trap violation! G' ≠ σ(G) isomorphism check failed.`;
    } else {
      revealedContent = passed
        ? `Cheater gambled on b=1 and forged a trap-free graph G' without valid isomorphism. Passed this round by luck (ε = 1/2).`
        : `CAUGHT (b=1): Opened π' = (${permutedWitness.join(' → ')}), which steps into trapped vertex ${permutedWitness[2]}! Theorem 2 verifier rejected.`;
    }
  }

  const cumulativeSoundness = 1 - Math.pow(0.5, roundNumber);

  return {
    round: roundNumber,
    proverMode,
    challengeBit,
    permutationMap,
    commitmentHashG,
    commitmentHashT,
    commitmentHashPi,
    revealedContent,
    passed,
    cumulativeSoundness,
  };
}

/* ============================================================================
 * SECTION 2.2 & 2.3: FAMOUS NP-COMPLETE PROBLEMS & TSP HELD-KARP ANALYZER
 * ============================================================================ */

export interface FamousNPProblem {
  name: string;
  domain: string;
  citation: string;
  decisionQuestion: string;
  gadgetRole: string;
  laymanAnalogy: string;
}

export const FAMOUS_NP_PROBLEMS: FamousNPProblem[] = [
  {
    name: '3-SAT (Conjunctive Normal Form)',
    domain: 'Boolean Logic',
    citation: 'Cook–Levin Theorem; Sipser (2012)',
    decisionQuestion:
      'Given φ = C₁ ∧ … ∧ Cₘ where each clause Cⱼ has 3 literals over {x₁, …, xₙ}, does there exist a truth assignment satisfying φ?',
    gadgetRole:
      'Canonical starting point for puzzle reductions: variables become binary choice corridors and clauses become 3-input lock or checkpoint gadgets.',
    laymanAnalogy:
      'Seated Dinner Party: m picky tables each demand at least 1 of 3 favorite guests attend, without cloning anyone.',
  },
  {
    name: 'Travelling Salesman (TSP-Decision) & Hamiltonian Path',
    domain: 'Graph Routing',
    citation: 'Garey & Johnson (1979); Kleinberg & Tardos (2006)',
    decisionQuestion:
      'Given graph G = (V, E) (and budget B for TSP), does there exist a simple path/cycle visiting every vertex v ∈ V exactly once (with total weight ≤ B)?',
    gadgetRole:
      'Forms the routing backbone of Candidate 2 (Trap-Path), where leaving a room locks it permanently.',
    laymanAnalogy:
      'Museum Tour: Visit every gallery in a museum exactly once without ever retracing your footsteps through a locked door.',
  },
  {
    name: 'Graph k-Coloring / n² × n² Sudoku / Latin Squares',
    domain: 'Graph Partition',
    citation: 'Colbourn (1984); Garey, Johnson & Stockmeyer (1976)',
    decisionQuestion:
      'Can we assign a color c(v) ∈ {1, …, k} to each vertex of G = (V, E) such that adjacent vertices never share a color: (u, v) ∈ E ⟹ c(u) ≠ c(v)?',
    gadgetRole:
      'Pre-colored graph coloring directly models Sudoku and Partial Latin Square completion, and anchors 3-Coloring Zero-Knowledge Proofs.',
    laymanAnalogy:
      'Map Coloring: Color every country on a map using only 3 crayons so no two bordering countries share the same color.',
  },
  {
    name: 'Minesweeper Consistency',
    domain: 'Grid Deduction',
    citation: 'Kaye (2000)',
    decisionQuestion:
      'Given a partially revealed Minesweeper board with numerical adjacency clues, does there exist a valid placement of mines consistent with all clues?',
    gadgetRole:
      'Proved NP-complete by building wire corridors, NOT gates, and AND/OR logic gates out of numbered mine clues.',
    laymanAnalogy:
      'Logic Detective: Check if the numbers on a Minesweeper board are internally consistent or if someone made an impossible board.',
  },
  {
    name: 'Akari (Light-Up)',
    domain: 'Grid Placement',
    citation: 'Hearn & Demaine (2009); Pulles (2021)',
    decisionQuestion:
      'Can light bulbs be placed on white cells so every corridor is illuminated, no two bulbs shine on each other, and numbered black walls have exact adjacent bulb counts?',
    gadgetRole:
      'Uses light rays down rows/columns as long-distance signal wires to reduce from Circuit-SAT / Planar 3-SAT.',
    laymanAnalogy:
      'Laser Mirrors: Place lanterns in a hall of pillars so every corner is lit up, but no two lanterns glare into each other.',
  },
  {
    name: 'Numberlink & Zig-Zag Numberlink',
    domain: 'Disjoint Paths',
    citation: 'Yato & Seta (2003); Adcock et al. (2014)',
    decisionQuestion:
      'Can k pairs of matching numbered terminals be connected on a grid using mutually vertex-disjoint paths? Proven NP-complete and ASP-complete.',
    gadgetRole:
      'Inspires Candidate 3 (ML-Numberlink), where L=2 layers and portal cells P eliminate messy 2D planar crossover gadgets.',
    laymanAnalogy:
      'Subway Tunneling: Connect matching station pairs with color-coded train lines without any two tracks colliding.',
  },
];

/**
 * Computes exact operation counts for TSP Case Study (Section 2.3):
 * 1. Polynomial Verifier: O(n)
 * 2. Bellman–Held–Karp Dynamic Programming: O(n² · 2ⁿ) time, O(n · 2ⁿ) space
 * 3. Naive Brute-Force Permutation Enumeration: (n - 1)! ~ O(n!)
 */
export function computeTspComplexity(n: number) {
  const verifierOps = n;
  const heldKarpOps = n * n * Math.pow(2, n);
  const heldKarpSpace = n * Math.pow(2, n);

  // Compute (n - 1)! using logs/Stirling for large n
  let factorialOps = 1;
  for (let i = 2; i <= n - 1; i++) {
    factorialOps *= i;
  }

  const formatOps = (val: number): string => {
    if (!Number.isFinite(val) || val > 1e30) {
      // Stirling log10
      let log10 = 0;
      for (let i = 2; i <= n - 1; i++) log10 += Math.log10(i);
      const exp = Math.floor(log10);
      const mantissa = Math.pow(10, log10 - exp).toFixed(2);
      return `${mantissa} × 10^${exp}`;
    }
    if (val >= 1e9) {
      const exp = Math.floor(Math.log10(val));
      const mantissa = (val / Math.pow(10, exp)).toFixed(2);
      return `${mantissa} × 10^${exp}`;
    }
    return Math.round(val).toLocaleString();
  };

  const formatTimeAt1GHz = (ops: number): string => {
    const secs = ops / 1e9;
    if (secs < 1e-6) return '< 1 microsecond';
    if (secs < 1e-3) return `${(secs * 1e6).toFixed(1)} µs`;
    if (secs < 1) return `${(secs * 1e3).toFixed(2)} ms`;
    if (secs < 60) return `${secs.toFixed(2)} sec`;
    if (secs < 3600) return `${(secs / 60).toFixed(1)} min`;
    if (secs < 86400) return `${(secs / 3600).toFixed(1)} hours`;
    if (secs < 86400 * 365.25) return `${(secs / 86400).toFixed(1)} days`;
    const years = secs / (86400 * 365.25);
    if (years < 1e6) return `${Math.round(years).toLocaleString()} years`;
    if (years < 1e9) return `${(years / 1e6).toFixed(1)}M years`;
    const exp = Math.floor(Math.log10(years));
    return `~10^${exp} years`;
  };

  return {
    n,
    verifierOpsStr: `${verifierOps} edge checks`,
    heldKarpOpsStr: formatOps(heldKarpOps),
    heldKarpSpaceStr: formatOps(heldKarpSpace),
    heldKarpTimeStr: formatTimeAt1GHz(heldKarpOps),
    bruteForceOpsStr: formatOps(factorialOps),
    bruteForceTimeStr: formatTimeAt1GHz(factorialOps),
    speedupRatio:
      factorialOps / heldKarpOps > 1e6
        ? `10^${Math.floor(Math.log10(factorialOps / heldKarpOps))}× faster`
        : `${Math.max(1, Math.round(factorialOps / heldKarpOps)).toLocaleString()}× faster`,
  };
}
