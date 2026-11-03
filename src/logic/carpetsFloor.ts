/**
 * "Carpets" — Floor Repair & Target Overlap Multiplicity Puzzle
 * Directly implementing the exact formal specification from team discussion:
 *
 * Formal Definition:
 * - N x M grid of tiles G.
 * - Collection C of sets S of connected tiles (carpets).
 * - Each tile t in G has either no value or a target value v(t).
 * - Select subcollection B ⊆ C such that:
 *   1. Full Coverage: ⋃_{S ∈ B} S covers the target grid (or non-wall tiles).
 *   2. Overlap Constraint: Let M = ∑_{S ∈ B} S be the multiset from additive union.
 *      For each tile t with target v(t), multiplicity(t, M) = v(t).
 *   3. Unique Cover Constraint: For each carpet Q ∈ B, there exists some t ∈ Q
 *      such that multiplicity(t, M) = 1 (no wasted carpets!).
 *
 * Plain English:
 * "We get a bunch of grid-aligned carpets and want to cover the grid with them.
 * We don't want to waste carpets, so each carpet must cover at least one tile
 * uniquely. Some parts of the floor are damaged, so we want to cover those parts
 * with more carpets. However, we don't want to stack so many that they break.
 * Thankfully, our engineers have determined such a target of overlapping, v(t)
 * for each tile t. Can you find an arrangement of carpets that covers the floor
 * fully and satisfies our engineers?"
 */

export interface CarpetTileCoord {
  x: number;
  y: number;
}

export interface CarpetDef {
  id: string;
  name: string;
  color: string;
  tiles: CarpetTileCoord[]; // Coordinates covered by this carpet
  notes?: string;
}

export interface FloorTileConfig {
  x: number;
  y: number;
  targetValue: number | null; // v(t), null = no specific target, 0 = wall/forbidden
  label?: string;
  isWall?: boolean;
}

export interface CarpetsPreset {
  id: string;
  name: string;
  badge: string;
  width: number;
  height: number;
  isToroidal?: boolean;
  summaryLayman: string;
  summaryRigorous: string;
  tiles: FloorTileConfig[];
  availableCarpets: CarpetDef[];
  defaultSelected: string[];
  satisfyingWitness: string[];
  isSatisfiable: boolean;
}

export interface CarpetsVerificationResult {
  isValid: boolean;
  totalTiles: number;
  coveredTilesCount: number;
  isFullyCovered: boolean;
  uncoveredTiles: CarpetTileCoord[];
  tileMultiplicities: Record<string, number>; // "x,y" -> count
  multiplicityViolations: { x: number; y: number; actual: number; target: number }[];
  carpetUniqueTiles: Record<string, CarpetTileCoord[]>; // carpetId -> tiles with mult = 1
  wastedCarpets: string[]; // carpets with NO uniquely covered tile (violates constraint 3)
  selectedCarpetsCount: number;
  operationsCount: number; // O(|B| * Area + N * M)
}

export const CARPETS_PRESETS: CarpetsPreset[] = [
  {
    id: 'living-room-repair',
    name: 'Engineers’ Living Room Repair (5x5 Floor)',
    badge: 'Classic Multiplicity Floor',
    width: 5,
    height: 5,
    isToroidal: false,
    summaryLayman:
      'The center of the floor is cracked, so our engineers specified v(t) = 2 layers of carpet for reinforcement! Standard tiles need exactly v(t) = 1. Beware: every carpet you choose must cover at least ONE tile uniquely so no carpet is wasted!',
    summaryRigorous:
      'Instance of Carpets on G = 5x5. Target function v: G → {1, 2}. Center region {(2,2), (2,1), (1,2)} requires multiplicity 2. Verifier checks whole grid coverage, mult(t) = v(t), and unique coverage ∃t ∈ Q: mult(t) = 1 for all Q ∈ B in O(|B| · |S| + NM) time.',
    isSatisfiable: true,
    tiles: [
      // Row 0
      { x: 0, y: 0, targetValue: 1 }, { x: 1, y: 0, targetValue: 1 }, { x: 2, y: 0, targetValue: 1 }, { x: 3, y: 0, targetValue: 1 }, { x: 4, y: 0, targetValue: 1 },
      // Row 1
      { x: 0, y: 1, targetValue: 1 }, { x: 1, y: 1, targetValue: 1 }, { x: 2, y: 1, targetValue: 2, label: 'Cracked v=2' }, { x: 3, y: 1, targetValue: 1 }, { x: 4, y: 1, targetValue: 1 },
      // Row 2
      { x: 0, y: 2, targetValue: 1 }, { x: 1, y: 2, targetValue: 2, label: 'Cracked v=2' }, { x: 2, y: 2, targetValue: 2, label: 'Damaged v=2' }, { x: 3, y: 2, targetValue: 1 }, { x: 4, y: 2, targetValue: 1 },
      // Row 3
      { x: 0, y: 3, targetValue: 1 }, { x: 1, y: 3, targetValue: 1 }, { x: 2, y: 3, targetValue: 1 }, { x: 3, y: 3, targetValue: 1 }, { x: 4, y: 3, targetValue: 1 },
      // Row 4
      { x: 0, y: 4, targetValue: 1 }, { x: 1, y: 4, targetValue: 1 }, { x: 2, y: 4, targetValue: 1 }, { x: 3, y: 4, targetValue: 1 }, { x: 4, y: 4, targetValue: 1 },
    ],
    availableCarpets: [
      {
        id: 'c-north-west',
        name: 'Persian Blue Rug (North-West 3x3)',
        color: '#38bdf8',
        tiles: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
        ],
      },
      {
        id: 'c-east-strip',
        name: 'Amber Runner (East 2x5)',
        color: '#fbbf24',
        tiles: [
          { x: 3, y: 0 }, { x: 4, y: 0 },
          { x: 3, y: 1 }, { x: 4, y: 1 },
          { x: 3, y: 2 }, { x: 4, y: 2 },
          { x: 3, y: 3 }, { x: 4, y: 3 },
          { x: 3, y: 4 }, { x: 4, y: 4 },
        ],
      },
      {
        id: 'c-south-strip',
        name: 'Emerald Runner (South 3x2)',
        color: '#2dd4bf',
        tiles: [
          { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 },
          { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 },
        ],
      },
      {
        id: 'c-center-patch',
        name: 'Reinforcement Patch (Center 2x2)',
        color: '#fb7185',
        tiles: [
          { x: 1, y: 1 }, { x: 2, y: 1 },
          { x: 1, y: 2 }, { x: 2, y: 2 },
        ],
        notes: 'Overlaps cracked tiles to satisfy v(t)=2, leaving (1,1) with potential conflict unless balanced.',
      },
      {
        id: 'c-redundant-waste',
        name: 'Wasted Excess Carpet (1x1)',
        color: '#a855f7',
        tiles: [{ x: 2, y: 2 }],
        notes: 'If placed, causes multiplicity to exceed target v(2,2)=2 and has no unique tile!',
      },
    ],
    defaultSelected: ['c-north-west', 'c-east-strip', 'c-south-strip'],
    satisfyingWitness: ['c-north-west', 'c-east-strip', 'c-south-strip'],
  },
  {
    id: 'toroidal-ringworld',
    name: 'Toroidal Ringworld Carpet (4x4 Cylindrical Wrap)',
    badge: 'Topology Variation',
    width: 4,
    height: 4,
    isToroidal: true,
    summaryLayman:
      'Team variation idea: "We are carpeting a ringworld or something!" Carpets wrap around the left-right edges of a cylinder. Every tile requires target multiplicity v(t) = 1.',
    summaryRigorous:
      'Instance with cylindrical boundary identification (x = 0 adjacent to x = 3). Eliminates boundary artifacts and simplifies gadget wire crossings for 3-SAT reductions.',
    isSatisfiable: true,
    tiles: Array.from({ length: 16 }).map((_, i) => ({
      x: i % 4,
      y: Math.floor(i / 4),
      targetValue: 1,
      label: `(${i % 4},${Math.floor(i / 4)})`,
    })),
    availableCarpets: [
      {
        id: 'wrap-c1',
        name: 'Ring Carpet Alpha (Wraps x=0..3, y=0..1)',
        color: '#38bdf8',
        tiles: [
          { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
        ],
      },
      {
        id: 'wrap-c2',
        name: 'Ring Carpet Beta (Wraps x=0..3, y=2..3)',
        color: '#2dd4bf',
        tiles: [
          { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
          { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
        ],
      },
      {
        id: 'wrap-c3',
        name: 'Vertical Splice (x=1..2, y=0..3)',
        color: '#fbbf24',
        tiles: [
          { x: 1, y: 0 }, { x: 2, y: 0 },
          { x: 1, y: 1 }, { x: 2, y: 1 },
          { x: 1, y: 2 }, { x: 2, y: 2 },
          { x: 1, y: 3 }, { x: 2, y: 3 },
        ],
      },
    ],
    defaultSelected: ['wrap-c1', 'wrap-c2'],
    satisfyingWitness: ['wrap-c1', 'wrap-c2'],
  },
  {
    id: 'unique-cover-paradox',
    name: 'Wasted Carpet Paradox (Unique Cover Failure)',
    badge: 'Constraint 3 Demonstration',
    width: 3,
    height: 3,
    isToroidal: false,
    summaryLayman:
      'Demonstrates the crucial rule: "We don\'t want to waste carpets, so each carpet must cover at least one tile uniquely." Carpet C3 is completely subsumed by C1 and C2, so placing C3 is rejected as a wasted carpet!',
    summaryRigorous:
      'Demonstrates Constraint 3 violation: ∃Q ∈ B such that ∀t ∈ Q, mult_M(t) > 1. Guarantees minimality and prevents trivial padding in reduction proofs.',
    isSatisfiable: false,
    tiles: Array.from({ length: 9 }).map((_, i) => ({
      x: i % 3,
      y: Math.floor(i / 3),
      targetValue: i === 4 ? 2 : 1,
    })),
    availableCarpets: [
      {
        id: 'p-c1',
        name: 'Carpet Left (2x3)',
        color: '#38bdf8',
        tiles: [
          { x: 0, y: 0 }, { x: 1, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 },
          { x: 0, y: 2 }, { x: 1, y: 2 },
        ],
      },
      {
        id: 'p-c2',
        name: 'Carpet Right (2x3)',
        color: '#2dd4bf',
        tiles: [
          { x: 1, y: 0 }, { x: 2, y: 0 },
          { x: 1, y: 1 }, { x: 2, y: 1 },
          { x: 1, y: 2 }, { x: 2, y: 2 },
        ],
      },
      {
        id: 'p-c3-waste',
        name: 'Carpet Center (1x3 Wasted Subsumed)',
        color: '#fb7185',
        tiles: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
        notes: 'Covers only column 1, which is already shared by C1 and C2. Has ZERO uniquely covered tiles!',
      },
    ],
    defaultSelected: ['p-c1', 'p-c2', 'p-c3-waste'],
    satisfyingWitness: ['p-c1', 'p-c2'],
  },
];

/**
 * Deterministic Polynomial-Time Verifier for "Carpets":
 * Checks:
 * 1. Full coverage: every non-wall tile is covered by at least one carpet.
 * 2. Overlap constraint: multiplicity matches v(t) for all target tiles.
 * 3. Unique cover constraint: every carpet Q in B has at least one tile with multiplicity = 1.
 * Runtime: O(|B| * Area + N * M) operations.
 */
export function verifyCarpets(
  preset: CarpetsPreset,
  selectedCarpetIds: string[]
): CarpetsVerificationResult {
  const selectedCarpets = preset.availableCarpets.filter((c) =>
    selectedCarpetIds.includes(c.id)
  );

  // 1. Calculate multiplicity per tile
  const tileMultiplicities: Record<string, number> = {};
  for (let y = 0; y < preset.height; y++) {
    for (let x = 0; x < preset.width; x++) {
      tileMultiplicities[`${x},${y}`] = 0;
    }
  }

  for (const carpet of selectedCarpets) {
    for (const t of carpet.tiles) {
      if (t.x >= 0 && t.x < preset.width && t.y >= 0 && t.y < preset.height) {
        tileMultiplicities[`${t.x},${t.y}`] = (tileMultiplicities[`${t.x},${t.y}`] || 0) + 1;
      }
    }
  }

  // 2. Check coverage of non-wall tiles
  const uncoveredTiles: CarpetTileCoord[] = [];
  let nonWallCount = 0;
  let coveredCount = 0;

  for (const tile of preset.tiles) {
    if (tile.isWall || tile.targetValue === 0) continue;
    nonWallCount++;
    const mult = tileMultiplicities[`${tile.x},${tile.y}`] || 0;
    if (mult > 0) {
      coveredCount++;
    } else {
      uncoveredTiles.push({ x: tile.x, y: tile.y });
    }
  }

  const isFullyCovered = uncoveredTiles.length === 0;

  // 3. Check target multiplicity constraints
  const multiplicityViolations: CarpetsVerificationResult['multiplicityViolations'] = [];
  for (const tile of preset.tiles) {
    if (tile.targetValue === null) continue;
    const mult = tileMultiplicities[`${tile.x},${tile.y}`] || 0;
    if (mult !== tile.targetValue) {
      multiplicityViolations.push({
        x: tile.x,
        y: tile.y,
        actual: mult,
        target: tile.targetValue,
      });
    }
  }

  // 4. Check Unique Cover Constraint: ∀ Q ∈ B, ∃ t ∈ Q such that mult(t) = 1
  const carpetUniqueTiles: Record<string, CarpetTileCoord[]> = {};
  const wastedCarpets: string[] = [];

  for (const carpet of selectedCarpets) {
    const uniqueTiles: CarpetTileCoord[] = [];
    for (const t of carpet.tiles) {
      if ((tileMultiplicities[`${t.x},${t.y}`] || 0) === 1) {
        uniqueTiles.push(t);
      }
    }
    carpetUniqueTiles[carpet.id] = uniqueTiles;
    if (uniqueTiles.length === 0) {
      wastedCarpets.push(carpet.id);
    }
  }

  const isValid =
    isFullyCovered &&
    multiplicityViolations.length === 0 &&
    wastedCarpets.length === 0 &&
    selectedCarpets.length > 0;

  return {
    isValid,
    totalTiles: nonWallCount,
    coveredTilesCount: coveredCount,
    isFullyCovered,
    uncoveredTiles,
    tileMultiplicities,
    multiplicityViolations,
    carpetUniqueTiles,
    wastedCarpets,
    selectedCarpetsCount: selectedCarpets.length,
    operationsCount: selectedCarpets.length * 15 + preset.width * preset.height,
  };
}
