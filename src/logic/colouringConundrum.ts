/**
 * The Colouring Conundrum — three colours, one local corner rule.
 *
 * The board is a grid of cells partitioned into polyomino regions. Every
 * region is one unit and takes exactly one of three colours (0, 1, 2). At each
 * marked interior corner, the clue d states how many *different* colours meet
 * there, minus one:
 *
 *     d = 0  → exactly one colour around the corner
 *     d = 1  → exactly two colours around the corner
 *     d = 2  → exactly three colours around the corner
 *
 * Adjacency is deliberately NOT a rule. Neighbouring regions may share a
 * colour; the corner clue is the whole constraint. This is what makes the
 * puzzle different from ordinary map colouring, and it is exactly what the
 * original grid.py renderer encodes: a uniform 2×2 block gets a 0 node, while
 * every other annotated corner carries its own clue.
 */

export type ConundrumColour = 0 | 1 | 2;

export type ConundrumAssignment = Record<string, ConundrumColour | null>;

export interface ConundrumCell {
  x: number;
  y: number;
}

export interface ConundrumRegion {
  id: string;
  cells: ConundrumCell[];
  anchor: ConundrumCell;
  size: number;
  /** Pastel identity fill used while the region is still uncoloured. */
  fill: string;
}

export interface ConundrumClue {
  x: number;
  y: number;
  /** Region ids of the four cells around the corner, clockwise from top-left. */
  cells: [string, string, string, string];
  /** Exact number of distinct colours required at this corner (1–3). */
  distinct: 1 | 2 | 3;
}

export interface ConundrumPreset {
  id: string;
  name: string;
  badge: string;
  width: number;
  height: number;
  rows: string[];
  regions: ConundrumRegion[];
  clues: ConundrumClue[];
  fixed: Record<string, ConundrumColour>;
  solution: Record<string, ConundrumColour> | null;
  initial: ConundrumAssignment;
  isSatisfiable: boolean;
  note: string;
  labels: Record<string, string>;
}

export interface ConundrumClueReport {
  clue: ConundrumClue;
  colours: (ConundrumColour | null)[];
  distinct: number | null;
  expected: number;
  complete: boolean;
  ok: boolean;
}

export interface ConundrumVerification {
  isComplete: boolean;
  isValid: boolean;
  assignedRegions: number;
  totalRegions: number;
  satisfiedClues: number;
  totalClues: number;
  violations: number;
  fixedViolations: string[];
  operations: number;
  clues: ConundrumClueReport[];
  fixedRegions: string[];
}

export const COLOUR_NAMES: Record<ConundrumColour, string> = {
  0: 'Parchment',
  1: 'Ink',
  2: 'Gold',
};

export const COLOUR_FILLS: Record<ConundrumColour, string> = {
  0: '#fffaf0',
  1: '#2723a9',
  2: '#f2b705',
};

export const COLOUR_TEXT: Record<ConundrumColour, string> = {
  0: '#2723a9',
  1: '#fffaf0',
  2: '#2723a9',
};

const IDENTITY_FILLS = [
  '#d4f8e8',
  '#f8d6d4',
  '#e8d4f8',
  '#fde9b8',
  '#cfe8ff',
  '#ffe0c2',
  '#d9f0c8',
  '#f5d0e6',
  '#c9e7e2',
  '#e6e0ff',
];

interface PresetInput {
  id: string;
  name: string;
  badge: string;
  rows: string[];
  reference: Record<string, ConundrumColour>;
  fixed: Record<string, ConundrumColour>;
  solution: Record<string, ConundrumColour> | null;
  isSatisfiable: boolean;
  note: string;
  labels?: Record<string, string>;
  clueOverrides?: Record<string, 1 | 2 | 3>;
}

function normaliseRows(rows: string[]): string[] {
  return rows.map((row) => row.replace(/\s+/g, ''));
}

function buildPreset(input: PresetInput): ConundrumPreset {
  const rows = normaliseRows(input.rows);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;

  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`${input.id}: row ${y} has ${row.length} cells, expected ${width}`);
    }
  });

  const byId = new Map<string, ConundrumRegion>();
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const id = rows[y][x];
      const region = byId.get(id);
      if (region) {
        region.cells.push({ x, y });
        region.size += 1;
      } else {
        byId.set(id, {
          id,
          cells: [{ x, y }],
          anchor: { x, y },
          size: 1,
          fill: IDENTITY_FILLS[byId.size % IDENTITY_FILLS.length],
        });
      }
    }
  }

  const regions = Array.from(byId.values());
  const labels = input.labels ?? Object.fromEntries(regions.map((r) => [r.id, r.id]));

  const clues: ConundrumClue[] = [];
  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const cells: [string, string, string, string] = [
        rows[y - 1][x - 1],
        rows[y - 1][x],
        rows[y][x - 1],
        rows[y][x],
      ];
      if (new Set(cells).size === 1) continue;
      const reference = new Set(cells.map((id) => input.reference[id]));
      if (reference.size > 3) {
        throw new Error(`${input.id}: ${reference.size} colours at clue (${x},${y})`);
      }
      const override = input.clueOverrides?.[`${x},${y}`];
      const distinct = (override ?? reference.size) as 1 | 2 | 3;
      clues.push({ x, y, cells, distinct });
    }
  }

  const initial: ConundrumAssignment = Object.fromEntries(
    regions.map((region) => [region.id, input.fixed[region.id] ?? null])
  );

  return {
    id: input.id,
    name: input.name,
    badge: input.badge,
    width,
    height,
    rows,
    regions,
    clues,
    fixed: input.fixed,
    solution: input.solution,
    initial,
    isSatisfiable: input.isSatisfiable,
    note: input.note,
    labels,
  };
}

const FOUR_CORNERS = buildPreset({
  id: 'four-corners',
  name: 'Four Corners',
  badge: '5 × 5 · unique',
  rows: ['AABBC', 'AABBC', 'DDBEC', 'DDEEC', 'DFFEE'],
  reference: { A: 0, B: 1, C: 2, D: 0, E: 1, F: 2 },
  fixed: { A: 0, C: 2 },
  solution: { A: 0, B: 1, C: 2, D: 0, E: 1, F: 2 },
  isSatisfiable: true,
  note: 'A compact warm-up: six regions, two fixed anchors, and exactly one colouring.',
});

const GADGET_GARDEN = buildPreset({
  id: 'gadget-garden',
  name: 'Gadget Garden',
  badge: '7 × 7 · unique',
  rows: [
    'aaabbcc',
    'aaabbcc',
    'ddbbbcc',
    'ddbbbee',
    'ddffbee',
    'ggffeee',
    'ggffeee',
  ],
  reference: { a: 0, b: 1, c: 2, d: 1, e: 0, f: 2, g: 1 },
  fixed: { a: 0, c: 2 },
  solution: { a: 0, b: 1, c: 2, d: 1, e: 0, f: 2, g: 1 },
  isSatisfiable: true,
  note: 'The gadget board: literal-shaped regions, clause-shaped junctions, and two palette anchors.',
  labels: { a: 'a1', b: '¬a1', c: 'c1', d: 'b1', e: '¬b1', f: 'c2', g: 'd' },
});

const BROKEN_BOARD = buildPreset({
  id: 'broken-board',
  name: 'Broken Board',
  badge: '4 × 4 · reject',
  rows: ['AABB', 'AABB', 'CCDD', 'CCDD'],
  reference: { A: 0, B: 1, C: 1, D: 2 },
  fixed: { A: 0, B: 1, C: 1, D: 2 },
  solution: null,
  isSatisfiable: false,
  note: 'The central clue says one colour, but the four fixed regions already show three.',
  clueOverrides: { '2,2': 1 },
});

export const CONUNDRUM_PRESETS: ConundrumPreset[] = [
  FOUR_CORNERS,
  GADGET_GARDEN,
  BROKEN_BOARD,
];

export function regionAt(preset: ConundrumPreset, x: number, y: number): string {
  return preset.rows[y][x];
}

export function regionLabel(preset: ConundrumPreset, id: string): string {
  return preset.labels[id] ?? id;
}

export function resetAssignment(preset: ConundrumPreset): ConundrumAssignment {
  return { ...preset.initial };
}

export function solutionAssignment(preset: ConundrumPreset): ConundrumAssignment | null {
  if (!preset.solution) return null;
  return Object.fromEntries(
    preset.regions.map((region) => [region.id, preset.solution?.[region.id] ?? null])
  );
}

export function clueKey(clue: { x: number; y: number }): string {
  return `${clue.x},${clue.y}`;
}

export function verifyConundrum(
  preset: ConundrumPreset,
  assignment: ConundrumAssignment
): ConundrumVerification {
  const clues: ConundrumClueReport[] = preset.clues.map((clue) => {
    const colours = clue.cells.map((id) => assignment[id] ?? null);
    const complete = colours.every((colour) => colour !== null);
    const distinct = complete ? new Set(colours as ConundrumColour[]).size : null;
    return {
      clue,
      colours,
      distinct,
      expected: clue.distinct,
      complete,
      ok: complete && distinct === clue.distinct,
    };
  });

  const assignedRegions = preset.regions.filter((region) => assignment[region.id] != null).length;
  const isComplete = assignedRegions === preset.regions.length;
  const satisfiedClues = clues.filter((report) => report.ok).length;
  const fixedRegions = Object.keys(preset.fixed);
  const fixedViolations = fixedRegions.filter((id) => assignment[id] !== preset.fixed[id]);
  const violations =
    clues.filter((report) => report.complete && !report.ok).length + fixedViolations.length;

  return {
    isComplete,
    isValid: isComplete && violations === 0,
    assignedRegions,
    totalRegions: preset.regions.length,
    satisfiedClues,
    totalClues: clues.length,
    violations,
    fixedViolations,
    operations: 4 * clues.length + preset.regions.length + fixedRegions.length,
    clues,
    fixedRegions,
  };
}
