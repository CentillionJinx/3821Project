/**
 * Grid Figure Studio -- TypeScript mirror of grid.py.
 *
 * The poster, the report and this app must show the same discrete grids.
 * grid.py is the reference implementation; this module re-implements its
 * parser, colour slots and geometry so the browser can preview a board and
 * hand back the exact same SVG/TikZ without a server round-trip.
 *
 * Keep the rules in sync with grid.py (same diagnostics codes, same slot
 * reservation for regions "0" and "1", same 34px cell geometry).
 */

export interface FigureCell {
  region: string;
  label: string | null;
  corner: string | null;
}

export interface FigureBoard {
  rows: FigureCell[][];
  width: number;
  height: number;
}

export type IssueLevel = 'error' | 'warning';

export interface FigureIssue {
  level: IssueLevel;
  code: string;
  message: string;
  line?: number;
  column?: number;
}

export interface FigurePalette {
  ink: string;
  background: string;
  surface: string;
  grid: string;
  organFill: string;
  organStroke: string;
  colors: string[];
}

export interface FigureColors {
  order: string[];
  hex: Record<string, string>;
  slot: Record<string, number>;
}

export interface CornerNode {
  row: number;
  col: number;
  label: string;
  uniform: boolean;
}

export interface FigureOptions {
  cell?: number;
  legend?: boolean;
  frame?: boolean;
  title?: string;
  legendNames?: Record<string, string>;
}

export const POSTER_PALETTE: FigurePalette = {
  ink: '#2723a9',
  background: '#f8e8d4',
  surface: '#fffaf4',
  grid: '#d8bd93',
  organFill: '#f8d6d4',
  organStroke: '#be123c',
  colors: [
    '#ffffff',
    '#2723a9',
    '#2dd4bf',
    '#f59e0b',
    '#6ee7b7',
    '#a78bfa',
    '#fb7185',
    '#38bdf8',
    '#a3e635',
    '#fb923c',
  ],
};

const EMPTY_TOKENS = new Set(['', '.', '-', '~']);
const ZERO_CORNER_TOKENS = new Set(['0', '.', '-']);
const HEART_TOKENS = new Set(['♥', '❤', '❤️', 'heart', '<3']);

export function isHeart(text: string | null | undefined): boolean {
  if (!text) return false;
  return HEART_TOKENS.has(text.trim().toLowerCase()) || text.trim() === '♥';
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

function parseCell(
  raw: string,
  line: number,
  column: number,
  issues: FigureIssue[]
): FigureCell {
  let text = raw.trim();
  let corner: string | null = null;

  const commas = (text.match(/,/g) ?? []).length;
  if (commas > 1) {
    issues.push({
      level: 'error',
      code: 'E-CELL',
      message: 'cell has more than one comma; use a single corner annotation',
      line,
      column,
    });
    const first = text.indexOf(',');
    corner = text.slice(first + 1).trim();
    text = text.slice(0, first);
  } else if (commas === 1) {
    const first = text.indexOf(',');
    corner = text.slice(first + 1).trim();
    text = text.slice(0, first);
  }

  let region = text;
  let label: string | null = null;
  const bang = text.indexOf('!');
  if (bang >= 0) {
    region = text.slice(0, bang).trim();
    label = text.slice(bang + 1).trim();
    if (!region) {
      issues.push({
        level: 'error',
        code: 'E-LABEL',
        message: 'label given without a region name',
        line,
        column,
      });
    }
  } else {
    region = region.trim();
  }

  if (EMPTY_TOKENS.has(region)) {
    if (label) {
      issues.push({
        level: 'error',
        code: 'E-LABEL',
        message: 'empty cell cannot carry a label',
        line,
        column,
      });
    }
    region = '';
    label = null;
  }

  if (corner !== null) {
    if (corner === '') {
      issues.push({
        level: 'warning',
        code: 'W-CORNER-EMPTY',
        message: 'empty corner annotation treated as 0',
        line,
        column,
      });
      corner = '0';
    } else if (ZERO_CORNER_TOKENS.has(corner)) {
      corner = '0';
    }
  }

  return { region, label, corner };
}

export function parseGrid(text: string): {
  board: FigureBoard;
  issues: FigureIssue[];
} {
  const issues: FigureIssue[] = [];
  const rows: FigureCell[][] = [];
  let expected: number | null = null;

  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const lineNumber = index + 1;
    const cells = line
      .split('\t')
      .map((raw, column) => parseCell(raw, lineNumber, column, issues));

    if (expected === null) {
      expected = cells.length;
    } else if (cells.length !== expected) {
      issues.push({
        level: 'error',
        code: 'E-RAGGED',
        message: `expected ${expected} columns (from row 1), found ${cells.length}`,
        line: lineNumber,
      });
    }
    rows.push(cells);
  });

  if (!rows.length) {
    issues.push({
      level: 'error',
      code: 'E-EMPTY',
      message: 'no grid rows found (input is empty or all comments)',
    });
    return { board: { rows: [], width: 0, height: 0 }, issues };
  }

  const width = Math.max(...rows.map((row) => row.length));
  const padded = rows.map((row) =>
    row.length < width
      ? [...row, ...Array.from({ length: width - row.length }, () => ({
          region: '',
          label: null,
          corner: null,
        }))]
      : row
  );

  return { board: { rows: padded, width, height: padded.length }, issues };
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

function hslToHex(h: number, s: number, l: number): string {
  // Same p/q formulation as grid.py so generated pastels match exactly.
  const hue = ((h % 360) + 360) % 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (input: number): number => {
    let t = input % 1;
    if (t < 0) t += 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const r = channel(hue / 360 + 1 / 3);
  const g = channel(hue / 360);
  const b = channel(hue / 360 - 1 / 3);
  const hex = (value: number) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function paletteSlots(palette: FigurePalette, count: number): string[] {
  const slots = [...palette.colors];
  while (slots.length < count) {
    slots.push(hslToHex(slots.length * 137.508, 0.62, 0.74));
  }
  return slots.slice(0, count);
}

export function buildColors(
  board: FigureBoard,
  palette: FigurePalette = POSTER_PALETTE
): FigureColors {
  const order: string[] = [];
  for (const row of board.rows) {
    for (const cell of row) {
      if (cell.region && !order.includes(cell.region)) order.push(cell.region);
    }
  }
  const dynamic = order.filter((name) => name !== '0' && name !== '1');
  const slots = paletteSlots(palette, 2 + dynamic.length);
  const hex: Record<string, string> = {};
  const slot: Record<string, number> = {};
  if (order.includes('0')) {
    hex['0'] = slots[0];
    slot['0'] = 0;
  }
  if (order.includes('1')) {
    hex['1'] = slots[1];
    slot['1'] = 1;
  }
  dynamic.forEach((name, offset) => {
    hex[name] = slots[2 + offset];
    slot[name] = 2 + offset;
  });
  return { order, hex, slot };
}

function rgb(hexColor: string): [number, number, number] {
  const value = hexColor.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function linear(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hexColor: string): number {
  const [r, g, b] = rgb(hexColor);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function readableText(fill: string, ink = '#111111'): string {
  const lum = luminance(fill);
  const onWhite = 1.05 / (lum + 0.05);
  const onInk = (lum + 0.05) / (luminance(ink) + 0.05);
  return onWhite >= onInk ? '#ffffff' : ink;
}

/* ------------------------------------------------------------------ */
/* Corner analysis                                                     */
/* ------------------------------------------------------------------ */

export function cornerNodes(board: FigureBoard): CornerNode[] {
  const nodes: CornerNode[] = [];
  for (let row = 0; row < board.height - 1; row += 1) {
    for (let col = 0; col < board.width - 1; col += 1) {
      const quad = [
        board.rows[row][col],
        board.rows[row][col + 1],
        board.rows[row + 1][col],
        board.rows[row + 1][col + 1],
      ];
      const uniform =
        Boolean(quad[0].region) && quad.every((cell) => cell.region === quad[0].region);
      const marker = board.rows[row][col].corner;
      if (uniform) {
        nodes.push({ row, col, label: '0', uniform: true });
      } else if (marker !== null) {
        nodes.push({ row, col, label: marker, uniform: false });
      }
    }
  }
  return nodes;
}

export function validateCorners(board: FigureBoard, issues: FigureIssue[]): void {
  board.rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.corner === null) return;
      if (rowIndex >= board.height - 1 || colIndex >= board.width - 1) {
        issues.push({
          level: 'warning',
          code: 'W-CORNER-UNRENDERED',
          message: `corner annotation at (${colIndex},${rowIndex}) lies on the outer boundary and is not drawn`,
          line: rowIndex + 1,
          column: colIndex,
        });
        return;
      }
      const quad = [
        board.rows[rowIndex][colIndex],
        board.rows[rowIndex][colIndex + 1],
        board.rows[rowIndex + 1][colIndex],
        board.rows[rowIndex + 1][colIndex + 1],
      ];
      const uniform =
        Boolean(quad[0].region) && quad.every((other) => other.region === quad[0].region);
      if (uniform && cell.corner !== '0') {
        issues.push({
          level: 'warning',
          code: 'W-CORNER-CONFLICT',
          message: `corner '${cell.corner}' sits inside a uniform 2x2 block and is rendered as 0`,
          line: rowIndex + 1,
          column: colIndex,
        });
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* SVG                                                                 */
/* ------------------------------------------------------------------ */

function escapeXml(text: string, attribute = false): string {
  let out = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (attribute) {
    out = out.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  return out;
}

export function renderSvg(
  board: FigureBoard,
  colors: FigureColors,
  options: FigureOptions = {},
  palette: FigurePalette = POSTER_PALETTE
): string {
  const cell = options.cell ?? 34;
  const legend = options.legend ?? true;
  const frame = options.frame ?? true;
  const title = options.title ?? 'Discrete grid figure';
  const marginLeft = 8;
  const marginTop = 8;
  const marginRight = 8;
  const marginBottom = 10;

  const vars = colors.order;
  const hasOrgans = board.rows.some((row) =>
    row.some((tile) => tile.region !== '' && isHeart(tile.label ?? tile.region))
  );

  const legendNames = options.legendNames ?? {};
  const legendEntries: Array<{ name: string; hex: string; offset: number }> = [];
  let legendHeight = 0;
  if (legend) {
    const wrapped: Array<Array<{ name: string; hex: string; offset: number }>> = [];
    let row: Array<{ name: string; hex: string; offset: number }> = [];
    let rowWidth = 0;
    const available = board.width * cell;
    const entries = vars.map((name) => ({
      name: legendNames[name] ?? name,
      hex: colors.hex[name],
    }));
    if (hasOrgans) {
      entries.push({ name: 'organ', hex: palette.organStroke });
    }
    for (const entry of entries) {
      const width = 18 + Math.round(5.2 * entry.name.length);
      if (row.length && rowWidth + width > available) {
        wrapped.push(row);
        row = [];
        rowWidth = 0;
      }
      row.push({ ...entry, offset: rowWidth });
      rowWidth += width;
    }
    if (row.length) wrapped.push(row);
    wrapped.forEach((entryRow, rowIndex) => {
      entryRow.forEach((entry) => {
        legendEntries.push({ ...entry, offset: entry.offset });
      });
      legendHeight += 15;
      if (rowIndex === 0) legendHeight += 6;
    });
  }

  const width = marginLeft + board.width * cell + marginRight;
  const height = marginTop + board.height * cell + marginBottom + legendHeight;

  const cx = (col: number) => marginLeft + col * cell;
  const cy = (row: number) => marginTop + row * cell;
  const ink = palette.ink;

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(title, true)}">`
  );
  out.push(`  <title>${escapeXml(title)}</title>`);
  out.push(`  <rect x="0" y="0" width="${width}" height="${height}" fill="${palette.surface}"/>`);

  for (let col = 1; col < board.width; col += 1) {
    out.push(
      `  <line x1="${cx(col)}" y1="${marginTop}" x2="${cx(col)}" y2="${marginTop + board.height * cell}" stroke="${palette.grid}" stroke-width="0.75" stroke-dasharray="2 2"/>`
    );
  }
  for (let row = 1; row < board.height; row += 1) {
    out.push(
      `  <line x1="${marginLeft}" y1="${cy(row)}" x2="${marginLeft + board.width * cell}" y2="${cy(row)}" stroke="${palette.grid}" stroke-width="0.75" stroke-dasharray="2 2"/>`
    );
  }

  board.rows.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (!tile.region) return;
      const x = cx(colIndex);
      const y = cy(rowIndex);
      const heart = isHeart(tile.label ?? tile.region);
      const fill = heart ? palette.organFill : colors.hex[tile.region];
      const stroke = heart ? palette.organStroke : colors.hex[tile.region];
      const opacity = heart ? 1 : 0.38;
      const strokeWidth = heart ? 1.8 : 1.3;
      out.push(
        `  <rect x="${x + 0.6}" y="${y + 0.6}" width="${cell - 1.2}" height="${cell - 1.2}" rx="3" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
      );
    });
  });

  board.rows.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (!tile.region) return;
      const text = tile.label !== null ? tile.label : tile.region;
      if (!text) return;
      const x = cx(colIndex);
      const y = cy(rowIndex);
      if (isHeart(text)) {
        const scale = (cell * 0.52) / 24;
        out.push(
          `  <g transform="translate(${x + cell / 2},${y + cell / 2 + 1}) scale(${scale.toFixed(4)}) translate(-12,-11)"><path d="M12 21s-7.6-4.9-9.6-9.2C.6 8.4 2.5 4.8 6.2 4.8c2 0 3.5 1.1 4.4 2.5l1.4 1.9 1.4-1.9c.9-1.4 2.4-2.5 4.4-2.5 3.7 0 5.6 3.6 3.8 7C19.6 16.1 12 21 12 21z" fill="${palette.organStroke}"/></g>`
        );
        out.push(
          `  <text x="${x + 3.5}" y="${y + 9}" font-family="JetBrains Mono, monospace" font-size="${Math.max(6, cell * 0.22).toFixed(1)}" font-weight="700" fill="${palette.ink}">${escapeXml(tile.region)}</text>`
        );
      } else {
        out.push(
          `  <text x="${x + cell / 2}" y="${y + cell / 2}" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace" font-size="${Math.max(7, cell * 0.28).toFixed(1)}" font-weight="600" fill="${readableText(colors.hex[tile.region], ink)}">${escapeXml(text)}</text>`
        );
      }
    });
  });

  cornerNodes(board).forEach((node) => {
    const nodeX = cx(node.col + 1);
    const nodeY = cy(node.row + 1);
    const radius = Math.max(5, cell * 0.175);
    const zero = node.label === '0' || node.uniform;
    out.push(
      `  <circle cx="${nodeX}" cy="${nodeY}" r="${radius.toFixed(1)}" fill="${zero ? '#fffdf8' : '#FFD966'}" stroke="${zero ? '#1b1b1b' : '#b91c1c'}" stroke-width="${zero ? 1.1 : 1.8}"/>`
    );
    out.push(
      `  <text x="${nodeX}" y="${nodeY}" text-anchor="middle" dominant-baseline="central" font-family="JetBrains Mono, monospace" font-size="${Math.max(6.5, cell * 0.24).toFixed(1)}" fill="#1b1b1b">${escapeXml(zero ? '0' : node.label)}</text>`
    );
  });

  if (frame) {
    out.push(
      `  <rect x="${marginLeft - 3.5}" y="${marginTop - 3.5}" width="${board.width * cell + 7}" height="${board.height * cell + 7}" fill="none" stroke="#FFBF00" stroke-width="1.5" rx="4"/>`
    );
  }

  if (legendEntries.length) {
    const baseY = marginTop + board.height * cell + 12;
    let currentRow = 0;
    let lastOffset = 0;
    legendEntries.forEach((entry, index) => {
      if (index > 0 && entry.offset <= lastOffset) currentRow += 1;
      lastOffset = entry.offset;
      const x = marginLeft + entry.offset;
      const y = baseY + currentRow * 15;
      out.push(
        `  <rect x="${x}" y="${y}" width="10" height="10" rx="2" fill="${entry.hex}" stroke="${palette.ink}" stroke-opacity="0.35" stroke-width="0.8"/>`
      );
      out.push(
        `  <text x="${x + 14}" y="${y + 5.2}" dominant-baseline="central" font-family="JetBrains Mono, monospace" font-size="7.5" fill="${palette.ink}">${escapeXml(entry.name)}</text>`
      );
    });
  }

  out.push('</svg>');
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* TikZ                                                                */
/* ------------------------------------------------------------------ */

function escapeLatex(text: string): string {
  return text
    .replace(/%/g, '\\%')
    .replace(/&/g, '\\&')
    .replace(/#/g, '\\#')
    .replace(/\$/g, '\\$');
}

export function renderTikz(
  board: FigureBoard,
  colors: FigureColors,
  _options: FigureOptions = {},
  palette: FigurePalette = POSTER_PALETTE
): string {
  const out: string[] = [];
  out.push('% Grid figure -- generated by the NP-GridLab figure studio');
  out.push(`% board: ${board.width}x${board.height}`);
  colors.order.forEach((name) => {
    out.push(
      `\\definecolor{color${colors.slot[name]}}{HTML}{${colors.hex[name].replace('#', '').toUpperCase()}} % ${name}`
    );
  });
  out.push(
    `\\definecolor{gridbg}{HTML}{${palette.background.replace('#', '').toUpperCase()}}`
  );
  out.push('\\begin{tikzpicture}[x=1cm,y=1cm]');
  out.push(`\\fill[gridbg] (0,0) rectangle (${board.width},${-board.height});`);

  board.rows.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (!tile.region) return;
      out.push(
        `\\fill[color${colors.slot[tile.region]}] (${colIndex},${-rowIndex}) rectangle (${colIndex + 1},${-rowIndex - 1});`
      );
    });
  });

  board.rows.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (!tile.region) return;
      const text = tile.label !== null ? tile.label : tile.region;
      if (!text) return;
      const light = readableText(colors.hex[tile.region]) === '#ffffff';
      out.push(
        `\\node[font=\\small${light ? ', text=white' : ''}] at (${colIndex + 0.5},${-rowIndex - 0.5}) {\\(${escapeLatex(text)}\\)};`
      );
    });
  });

  out.push(`\\draw (0,0) grid (${board.width},${-board.height});`);

  cornerNodes(board).forEach((node) => {
    const zero = node.label === '0' || node.uniform;
    const style = zero
      ? 'circle, draw=black, fill=white, inner sep=2pt, font=\\scriptsize'
      : 'circle, draw=red!85!black, very thick, fill=yellow!60, inner sep=2pt, font=\\scriptsize';
    out.push(
      `\\node[${style}] at (${node.col + 1},${-node.row - 1}) {\\(${zero ? '0' : escapeLatex(node.label)}\\)};`
    );
  });

  out.push('\\end{tikzpicture}');
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* Convenience                                                         */
/* ------------------------------------------------------------------ */

export function buildFigure(
  input: string,
  options: FigureOptions = {}
): {
  board: FigureBoard;
  issues: FigureIssue[];
  colors: FigureColors;
  svg: string;
  tikz: string;
} {
  const { board, issues } = parseGrid(input);
  if (board.width > 0) validateCorners(board, issues);
  const colors = buildColors(board);
  return {
    board,
    issues,
    colors,
    svg: board.width > 0 ? renderSvg(board, colors, options) : '',
    tikz: board.width > 0 ? renderTikz(board, colors, options) : '',
  };
}
