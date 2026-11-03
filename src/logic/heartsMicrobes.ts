/**
 * "Hearts" // "Microbes" — Vital Organ Non-Overlap Puzzle
 * Directly implementing the exact formal specification from team discussion:
 *
 * Formal Definition:
 * - N x M grid G.
 * - Collection C of blobs (connected tiles). Each blob A ∈ C has:
 *   - A set of tiles T(A)
 *   - A designated subset of "Vital Organs" O(A) ⊆ T(A) (non-empty, marked with ❤️)
 * - Select subcollection B ⊆ C such that:
 *   1. Vital Organ Non-Overlap Invariant:
 *      For all distinct blobs A, B ∈ B:
 *      O(A) ∩ T(B) = ∅  and  O(B) ∩ T(A) = ∅
 *      (The vital organs of blob A CANNOT overlap with ANY part of another blob B!)
 *   2. Target Coverage or Nutrient Quota:
 *      Selected blobs must achieve required target coverage without organ destruction.
 *
 * Plain English:
 * "We have a grid we want to cover. We have some collection of blobs (connected tiles)
 * with some vital organs (a subset of those tiles). We want to place these blobs
 * on the grid that possibly overlap, but the vital organs of blob A cannot overlap
 * with ANY part of another blob B for all A, B in selected subcollection of blobs."
 */

export interface MicrobeTile {
  x: number;
  y: number;
  isOrgan: boolean; // True if this tile is a vital organ ❤️
}

export interface MicrobeBlob {
  id: string;
  name: string;
  color: string;
  tiles: MicrobeTile[];
  description?: string;
}

export interface MicrobeOrganCollision {
  victimBlobId: string;
  victimOrganTile: { x: number; y: number };
  crushingBlobId: string;
  crushingTile: { x: number; y: number };
}

export interface MicrobesPreset {
  id: string;
  name: string;
  badge: string;
  width: number;
  height: number;
  summaryLayman: string;
  summaryRigorous: string;
  availableBlobs: MicrobeBlob[];
  defaultSelected: string[];
  satisfyingWitness: string[];
  targetCoveredTilesMin: number;
  isSatisfiable: boolean;
}

export interface MicrobesVerificationResult {
  isValid: boolean;
  selectedBlobCount: number;
  totalUniqueTilesCovered: number;
  targetCoveredTilesMin: number;
  isCoverageMet: boolean;
  organCollisions: MicrobeOrganCollision[];
  organIntactCount: number;
  totalOrgansActive: number;
  operationsCount: number; // O(|B|^2 * Area)
}

export const MICROBES_PRESETS: MicrobesPreset[] = [
  {
    id: 'vital-shielding-lab',
    name: 'Cellular Culture Petri Dish (6x6 Grid)',
    badge: 'Microbe Invariant Core',
    width: 6,
    height: 6,
    targetCoveredTilesMin: 14,
    summaryLayman:
      'Place living microbes on the Petri dish to cover at least 14 tiles. Ordinary body tiles can freely overlap, but the vital heart organs (❤️) are delicate: NO other microbe can touch or overlap a vital organ anywhere!',
    summaryRigorous:
      'Instance of Microbes (Hearts) on G = 6x6. Requires selecting subset B ⊆ C covering ≥ 14 cells subject to O(A) ∩ T(B) = ∅ for all A ≠ B. Demonstrates non-local exclusion where body extensions simulate boolean transmission wires.',
    isSatisfiable: true,
    availableBlobs: [
      {
        id: 'blob-amoeba',
        name: 'Amoeba Alpha (Left Cluster)',
        color: '#2dd4bf',
        tiles: [
          { x: 1, y: 1, isOrgan: true }, // Organ at (1,1)
          { x: 0, y: 1, isOrgan: false },
          { x: 1, y: 0, isOrgan: false },
          { x: 2, y: 1, isOrgan: false },
          { x: 1, y: 2, isOrgan: false },
        ],
      },
      {
        id: 'blob-paramecium',
        name: 'Paramecium Beta (Right Cluster)',
        color: '#38bdf8',
        tiles: [
          { x: 4, y: 1, isOrgan: true }, // Organ at (4,1)
          { x: 3, y: 1, isOrgan: false },
          { x: 4, y: 0, isOrgan: false },
          { x: 5, y: 1, isOrgan: false },
          { x: 4, y: 2, isOrgan: false },
        ],
      },
      {
        id: 'blob-bridge',
        name: 'Hydra Tentacle (Central Bridge)',
        color: '#fbbf24',
        tiles: [
          { x: 2, y: 1, isOrgan: false }, // Overlaps Amoeba's body tile (allowed!)
          { x: 3, y: 1, isOrgan: false }, // Overlaps Paramecium's body tile (allowed!)
          { x: 2, y: 3, isOrgan: false },
          { x: 3, y: 3, isOrgan: false },
          { x: 2, y: 4, isOrgan: true }, // Hydra organ safely at (2,4)
          { x: 3, y: 4, isOrgan: false },
        ],
        description: 'Bridges Alpha and Beta by overlapping their non-vital tissue without touching either organ!',
      },
      {
        id: 'blob-crusher-hazard',
        name: 'Toxic Parasite (Crusher Hazard)',
        color: '#fb7185',
        tiles: [
          { x: 1, y: 1, isOrgan: false }, // DIRECTLY CRUSHES Amoeba's organ at (1,1)!
          { x: 1, y: 2, isOrgan: false },
          { x: 0, y: 2, isOrgan: true },
        ],
        description: 'Violates invariant by covering Amoeba organ (1,1). Demonstrates instant collision rejection.',
      },
    ],
    defaultSelected: ['blob-amoeba', 'blob-paramecium', 'blob-bridge'],
    satisfyingWitness: ['blob-amoeba', 'blob-paramecium', 'blob-bridge'],
  },
  {
    id: 'tetris-stacked-microbes',
    name: 'Tetris-Inspired Stacked Microbes (5x5 Colony)',
    badge: 'Tetris Variation',
    width: 5,
    height: 5,
    targetCoveredTilesMin: 12,
    summaryLayman:
      'Team variation idea: "Each blob must be orthogonally adjacent to another blob (stacked on top like Tetris)." Blobs rest against each other, shielding their delicate core hearts!',
    summaryRigorous:
      'Tetris-stacking variant: selected blobs form a single connected component in the dual intersection graph, while maintaining strict organ exclusion O(A) ∩ T(B) = ∅.',
    isSatisfiable: true,
    availableBlobs: [
      {
        id: 't-blob1',
        name: 'Foundation Blob (Floor 4x1)',
        color: '#0f766e',
        tiles: [
          { x: 0, y: 4, isOrgan: false },
          { x: 1, y: 4, isOrgan: true }, // Core organ
          { x: 2, y: 4, isOrgan: false },
          { x: 3, y: 4, isOrgan: false },
        ],
      },
      {
        id: 't-blob2',
        name: 'Tower Blob (Vertical 1x3)',
        color: '#1e3a8a',
        tiles: [
          { x: 3, y: 3, isOrgan: false },
          { x: 3, y: 2, isOrgan: true }, // Core organ
          { x: 3, y: 1, isOrgan: false },
        ],
      },
      {
        id: 't-blob3',
        name: 'L-Cap Blob (Top Corner)',
        color: '#701a75',
        tiles: [
          { x: 3, y: 1, isOrgan: false }, // Overlaps tower top body tile
          { x: 2, y: 1, isOrgan: false },
          { x: 1, y: 1, isOrgan: true },
        ],
      },
      {
        id: 't-blob4',
        name: 'Center Filler (3x1)',
        color: '#a855f7',
        tiles: [
          { x: 0, y: 2, isOrgan: false },
          { x: 1, y: 2, isOrgan: false },
          { x: 2, y: 2, isOrgan: true },
        ],
      },
    ],
    defaultSelected: ['t-blob1', 't-blob2', 't-blob3', 't-blob4'],
    satisfyingWitness: ['t-blob1', 't-blob2', 't-blob3', 't-blob4'],
  },
];

/**
 * Deterministic Polynomial-Time Verifier for "Hearts // Microbes":
 * Evaluates:
 * 1. For all selected blobs A != B: vital organs O(A) cannot intersect any tile in T(B).
 * 2. Checks minimum tile coverage requirement.
 * Runtime: O(|B|^2 * |T|) polynomial operations.
 */
export function verifyMicrobes(
  preset: MicrobesPreset,
  selectedBlobIds: string[]
): MicrobesVerificationResult {
  const selectedBlobs = preset.availableBlobs.filter((b) =>
    selectedBlobIds.includes(b.id)
  );

  const organCollisions: MicrobeOrganCollision[] = [];
  const coveredTileKeys = new Set<string>();
  let totalOrgans = 0;

  // Track covered tiles and total active organs
  for (const blob of selectedBlobs) {
    for (const t of blob.tiles) {
      coveredTileKeys.add(`${t.x},${t.y}`);
      if (t.isOrgan) totalOrgans++;
    }
  }

  // Check pairwise Vital Organ Non-Overlap Invariant:
  // For each blob A, check if any of its organs O(A) is touched by ANY tile of blob B
  for (let i = 0; i < selectedBlobs.length; i++) {
    const blobA = selectedBlobs[i];
    const organsA = blobA.tiles.filter((t) => t.isOrgan);

    for (let j = 0; j < selectedBlobs.length; j++) {
      if (i === j) continue;
      const blobB = selectedBlobs[j];

      for (const organA of organsA) {
        const hit = blobB.tiles.find((tb) => tb.x === organA.x && tb.y === organA.y);
        if (hit) {
          organCollisions.push({
            victimBlobId: blobA.id,
            victimOrganTile: { x: organA.x, y: organA.y },
            crushingBlobId: blobB.id,
            crushingTile: { x: hit.x, y: hit.y },
          });
        }
      }
    }
  }

  const isCoverageMet = coveredTileKeys.size >= preset.targetCoveredTilesMin;
  const isValid =
    selectedBlobs.length > 0 &&
    organCollisions.length === 0 &&
    isCoverageMet;

  return {
    isValid,
    selectedBlobCount: selectedBlobs.length,
    totalUniqueTilesCovered: coveredTileKeys.size,
    targetCoveredTilesMin: preset.targetCoveredTilesMin,
    isCoverageMet,
    organCollisions,
    organIntactCount: totalOrgans - organCollisions.length,
    totalOrgansActive: totalOrgans,
    operationsCount: selectedBlobs.length * selectedBlobs.length * 12 + coveredTileKeys.size,
  };
}
