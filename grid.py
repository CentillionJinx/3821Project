#!/usr/bin/env python3
"""grid.py -- deterministic grid figure generator.

Reads a tab-separated grid description and emits a TikZ picture, an SVG
figure, or machine-readable JSON.  The same board always produces the same
colours, in the same order, in every output format.

WHY THIS EXISTS
---------------
The COMP3821 report, poster and web app all show the same discrete tile
grids (microbe polyominoes, carpet multiplicities).  Hand-drawing those
figures in three places guarantees that they drift apart.  This script is
the single source of truth: describe the board once, generate every
figure from it.

BOARD FORMAT
------------
* One tab-separated row per grid row.
* Blank lines and lines starting with ``#`` are ignored.
* Each cell is ``VAR``, ``VAR!LABEL``, ``VAR,CORNER`` or ``VAR!LABEL,CORNER``.
    - ``VAR``    region name.  Determines the fill colour and, unless
                 suppressed, the centred text.
    - ``!LABEL`` override the centred text.  ``A!`` means "colour only".
                 ``A!♥`` draws a heart and marks the cell as a vital organ.
    - ``,CORNER`` annotate the bottom-right corner of the cell.  ``0``
                 (or ``.``) draws a zero node; any other text draws a
                 labelled corner node.  Corners are only drawn when the
                 crossing is interior to the board.
* Empty cells are ``.``, ``-``, ``~`` or an empty field.
* A single unescaped ``/`` is no longer rewritten to ``\\neg``: use an
  explicit ``!`` label instead (``x!x_1``, ``a!a\\neg b``).

EXAMPLES
--------
    $ python3 grid.py board.tsv > figure.tex
    $ python3 grid.py board.tsv --format svg --legend -o figure.svg
    $ python3 grid.py board.tsv --check          # validate only
    $ printf 'A\\tB\\nB\\tA\\n' | python3 grid.py --format json

Exit codes: 0 ok, 1 invalid board, 2 usage error.

Style note: the rendered figure is intentionally reproducible -- colours
are assigned by first appearance (row-major), and palettes are plain hex
values so TikZ and SVG cannot disagree.
"""

from __future__ import annotations

import argparse
import json
import sys
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, Sequence

VERSION = "2.0.0"

EMPTY_TOKENS = {"", ".", "-", "~"}
ZERO_CORNER_TOKENS = {"0", ".", "-"}
HEART_TOKENS = {"♥", "❤", "❤️", "heart", "<3"}

# ---------------------------------------------------------------------------
# Palettes
# ---------------------------------------------------------------------------
# Index 0 and 1 are reserved for the literal region names "0" and "1" so that
# existing boards keep their meaning: 0 is the paper/white region, 1 is ink.
PALETTES: dict[str, dict[str, object]] = {
    "poster": {
        "ink": "#2723a9",
        "background": "#f8e8d4",
        "surface": "#fffaf4",
        "grid": "#d8bd93",
        "organ_fill": "#f8d6d4",
        "organ_stroke": "#be123c",
        "colors": [
            "#ffffff",
            "#2723a9",
            "#2dd4bf",  # teal
            "#f59e0b",  # amber
            "#6ee7b7",  # mint (shared / blend)
            "#a78bfa",  # lavender
            "#fb7185",  # blush
            "#38bdf8",  # sky
            "#a3e635",  # lime
            "#fb923c",  # orange
        ],
    },
    "classic": {
        "ink": "#111111",
        "background": "#f2f2f2",
        "surface": "#ffffff",
        "grid": "#9a9a9a",
        "organ_fill": "#ffe4e6",
        "organ_stroke": "#e11d48",
        "colors": [
            "#ffffff",
            "#111111",
            "#ff9999",
            "#9999ff",
            "#99cc99",
            "#ffe699",
            "#99e6e6",
            "#cc99ff",
            "#ffcc99",
            "#ff99ff",
            "#ff6666",
            "#6666ff",
            "#66b366",
            "#ffd966",
            "#66d9d9",
            "#b366ff",
            "#ffb366",
            "#ff66ff",
        ],
    },
}

# LaTeX colour specs kept for --colors named (legacy look).
CLASSIC_LATEX = [
    "white",
    "black",
    "red!20",
    "blue!20",
    "green!20",
    "yellow!20",
    "cyan!20",
    "purple!20",
    "orange!20",
    "magenta!20",
    "red!40",
    "blue!40",
    "green!40",
    "yellow!40",
    "cyan!40",
    "purple!40",
    "orange!40",
    "magenta!40",
    "red!60",
    "blue!60",
    "green!60",
    "yellow!60",
    "cyan!60",
    "purple!60",
    "orange!60",
    "magenta!60",
]


# ---------------------------------------------------------------------------
# Diagnostics
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Diagnostic:
    level: str  # "error" | "warning" | "info"
    code: str
    message: str
    line: int | None = None
    column: int | None = None

    def format(self) -> str:
        where = ""
        if self.line is not None:
            where = f"line {self.line}"
            if self.column is not None:
                where += f", col {self.column + 1}"
            where = f" ({where})"
        return f"{self.level:<7} {self.code:<22}{where} {self.message}"


class Diagnostics:
    def __init__(self) -> None:
        self.items: list[Diagnostic] = []

    def add(self, level: str, code: str, message: str, line=None, column=None) -> None:
        self.items.append(Diagnostic(level, code, message, line, column))

    def error(self, code: str, message: str, line=None, column=None) -> None:
        self.add("error", code, message, line, column)

    def warning(self, code: str, message: str, line=None, column=None) -> None:
        self.add("warning", code, message, line, column)

    def info(self, code: str, message: str, line=None, column=None) -> None:
        self.add("info", code, message, line, column)

    @property
    def errors(self) -> list[Diagnostic]:
        return [d for d in self.items if d.level == "error"]

    @property
    def warnings(self) -> list[Diagnostic]:
        return [d for d in self.items if d.level == "warning"]

    def __bool__(self) -> bool:
        return bool(self.items)


# ---------------------------------------------------------------------------
# Model + parser
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Cell:
    var: str = ""
    label: str | None = None  # None -> use var, "" -> draw nothing
    corner: str | None = None  # None -> no annotation, "0" -> zero node

    @property
    def is_empty(self) -> bool:
        return self.var == ""

    @property
    def text(self) -> str:
        if self.label is not None:
            return self.label
        return self.var


@dataclass
class Board:
    rows: list[list[Cell]]
    source: str = "<stdin>"

    @property
    def width(self) -> int:
        return len(self.rows[0]) if self.rows else 0

    @property
    def height(self) -> int:
        return len(self.rows)

    def cells(self) -> Iterator[Cell]:
        for row in self.rows:
            yield from row

    def vars_in_order(self) -> list[str]:
        seen: list[str] = []
        for cell in self.cells():
            if cell.var and cell.var not in seen:
                seen.append(cell.var)
        return seen


def _parse_cell(raw: str, line: int, column: int, diags: Diagnostics) -> Cell:
    raw = raw.strip()

    corner: str | None = None
    if raw.count(",") > 1:
        diags.error(
            "E-CELL",
            "cell has more than one comma; quote the label or use '!' instead",
            line,
            column,
        )
        raw, _, rest = raw.partition(",")
        corner = rest.strip()
    elif "," in raw:
        raw, corner = raw.split(",", 1)
        corner = corner.strip()

    var, bang, label = raw.partition("!")
    var = var.strip()
    if bang:
        label = label.strip()
        if not var:
            diags.error("E-LABEL", "label given without a region name", line, column)
    else:
        label = None

    if var in EMPTY_TOKENS:
        if bang and label:
            diags.error("E-LABEL", "empty cell cannot carry a label", line, column)
        var = ""
        label = None

    if corner is not None:
        if corner == "":
            diags.warning(
                "W-CORNER-EMPTY",
                "empty corner annotation treated as 0",
                line,
                column,
            )
            corner = "0"
        elif corner in ZERO_CORNER_TOKENS:
            corner = "0"

    return Cell(var=var, label=label, corner=corner)


def parse_board(
    text: str,
    source: str = "<stdin>",
    allow_ragged: bool = False,
) -> tuple[Board, Diagnostics]:
    diags = Diagnostics()
    rows: list[tuple[int, list[Cell]]] = []
    expected: int | None = None

    for lineno, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        raw_cells = line.split("\t")
        cells = [
            _parse_cell(raw, lineno, idx, diags) for idx, raw in enumerate(raw_cells)
        ]

        if expected is None:
            expected = len(cells)
        elif len(cells) != expected:
            if allow_ragged:
                diags.warning(
                    "W-RAGGED",
                    f"row 1 has {expected} columns, this row has {len(cells)}; padded "
                    "to the widest row",
                    lineno,
                )
            else:
                diags.error(
                    "E-RAGGED",
                    f"expected {expected} columns (from row 1), found {len(cells)}",
                    lineno,
                )

        rows.append((lineno, cells))

    if not rows:
        diags.error("E-EMPTY", "no grid rows found (input is empty or all comments)")
        return Board(rows=[], source=source), diags

    width = max(len(cells) for _, cells in rows)
    if width == 0:
        diags.error("E-EMPTY", "board has zero columns")
        return Board(rows=[], source=source), diags

    # Pad short rows so the board object is always rectangular, even for an
    # invalid (ragged) input: diagnostics and JSON consumers still work.
    padded = [
        cells + [Cell()] * (width - len(cells)) if len(cells) < width else cells
        for _, cells in rows
    ]
    return Board(rows=padded, source=source), diags


# ---------------------------------------------------------------------------
# Colours
# ---------------------------------------------------------------------------
def _hsl_to_hex(h: float, s: float, light: float) -> str:
    h = h % 360.0

    def channel(p: float, q: float, t: float) -> float:
        t = t % 1.0
        if t < 1 / 6:
            return p + (q - p) * 6 * t
        if t < 1 / 2:
            return q
        if t < 2 / 3:
            return p + (q - p) * (2 / 3 - t) * 6
        return p

    q = light * (1 + s) if light < 0.5 else light + s - light * s
    p = 2 * light - q
    r = channel(p, q, h / 360 + 1 / 3)
    g = channel(p, q, h / 360)
    b = channel(p, q, h / 360 - 1 / 3)
    return "#{:02x}{:02x}{:02x}".format(
        round(r * 255), round(g * 255), round(b * 255)
    )


def _generated_color(index: int) -> str:
    """Deterministic pastel for regions beyond the hand-tuned palette."""
    hue = (index * 137.508) % 360.0
    return _hsl_to_hex(hue, 0.62, 0.74)


def palette_colors(palette: dict[str, object], count: int) -> list[str]:
    base = list(palette["colors"])  # type: ignore[arg-type]
    while len(base) < count:
        base.append(_generated_color(len(base)))
    return base[:count]


@dataclass(frozen=True)
class FigureColors:
    """Stable colour slots: '0'->0, '1'->1, everything else 2, 3, 4..."""

    hex: dict[str, str]
    index: dict[str, int]

    def __getitem__(self, name: str) -> str:
        return self.hex[name]

    def slot(self, name: str) -> int:
        return self.index[name]

    def names(self) -> list[str]:
        return list(self.hex)


def color_map(board: Board, palette: dict[str, object]) -> FigureColors:
    names = board.vars_in_order()
    dynamic = [name for name in names if name not in {"0", "1"}]
    slots = palette_colors(palette, 2 + len(dynamic))
    hex_map: dict[str, str] = {}
    index_map: dict[str, int] = {}
    if "0" in names:
        hex_map["0"], index_map["0"] = slots[0], 0
    if "1" in names:
        hex_map["1"], index_map["1"] = slots[1], 1
    for offset, name in enumerate(dynamic):
        hex_map[name] = slots[2 + offset]
        index_map[name] = 2 + offset
    return FigureColors(hex=hex_map, index=index_map)


def _rgb(hex_color: str) -> tuple[int, int, int]:
    value = hex_color.lstrip("#")
    if len(value) == 3:
        value = "".join(ch * 2 for ch in value)
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def _linear(channel: int) -> float:
    s = channel / 255.0
    return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_color: str) -> float:
    r, g, b = _rgb(hex_color)
    return 0.2126 * _linear(r) + 0.7152 * _linear(g) + 0.0722 * _linear(b)


def readable_text(fill: str, ink: str = "#111111") -> str:
    """Pick white or near-black text for a solid fill."""
    lum = relative_luminance(fill)
    contrast_white = 1.05 / (lum + 0.05)
    contrast_ink = (lum + 0.05) / (relative_luminance(ink) + 0.05)
    return "#ffffff" if contrast_white >= contrast_ink else ink


# ---------------------------------------------------------------------------
# Corner analysis
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class CornerNode:
    row: int  # crossing between row and row+1
    col: int  # crossing between col and col+1
    label: str  # "0" for a zero node
    uniform: bool  # all four quadrants share one non-empty region
    owner: tuple[int, int]  # cell that declared the annotation (row, col)


def corner_nodes(board: Board) -> list[CornerNode]:
    nodes: list[CornerNode] = []
    for i in range(board.height - 1):
        for j in range(board.width - 1):
            quad = (
                board.rows[i][j],
                board.rows[i][j + 1],
                board.rows[i + 1][j],
                board.rows[i + 1][j + 1],
            )
            uniform = bool(quad[0].var) and all(c.var == quad[0].var for c in quad)
            marker = board.rows[i][j].corner
            if uniform:
                nodes.append(CornerNode(i, j, "0", True, (i, j)))
            elif marker is not None:
                nodes.append(CornerNode(i, j, marker, False, (i, j)))
    return nodes


def validate(board: Board, diags: Diagnostics) -> None:
    """Semantic checks that need the whole board."""
    for i, row in enumerate(board.rows):
        for j, cell in enumerate(row):
            if cell.corner is None:
                continue
            if i >= board.height - 1 or j >= board.width - 1:
                diags.warning(
                    "W-CORNER-UNRENDERED",
                    f"corner annotation at ({j},{i}) lies on the outer boundary "
                    "and is not drawn",
                    i + 1,
                    j,
                )
                continue
            quad = (
                board.rows[i][j],
                board.rows[i][j + 1],
                board.rows[i + 1][j],
                board.rows[i + 1][j + 1],
            )
            uniform = bool(quad[0].var) and all(c.var == quad[0].var for c in quad)
            if uniform and cell.corner != "0":
                diags.warning(
                    "W-CORNER-CONFLICT",
                    f"corner '{cell.corner}' sits inside a uniform 2x2 block "
                    "and is rendered as 0",
                    i + 1,
                    j,
                )


# ---------------------------------------------------------------------------
# TikZ emitter
# ---------------------------------------------------------------------------
def latex_escape(text: str, math_mode: bool) -> str:
    if math_mode:
        # Preserve sub/superscripts, only neutralise alignment/comment chars.
        return (
            text.replace("%", r"\%")
            .replace("&", r"\&")
            .replace("#", r"\#")
            .replace("$", r"\$")
        )
    table = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(table.get(ch, ch) for ch in text)


def emit_tikz(
    board: Board,
    palette: dict[str, object],
    colors: FigureColors,
    diags: Diagnostics,
    *,
    title: str = "",
    background: str | None = None,
    coords: bool = False,
    wrap: bool = True,
    marker_style: str = "ring",
    named_colors: bool = False,
    text_mode: str = "math",
) -> str:
    math_mode = text_mode == "math"
    out: list[str] = []
    comment = f"% {title}" if title else "% Grid figure"
    out.append(f"{comment} -- generated by grid.py {VERSION}")
    out.append(f"% source: {board.source}  ({board.width}x{board.height})")

    # Colour definitions. Every referenced colour is always defined, which
    # the old script failed to do past 26 regions.
    names = colors.names()
    for name in names:
        idx = colors.slot(name)
        hex_color = colors[name]
        latex_name = CLASSIC_LATEX[idx] if idx < len(CLASSIC_LATEX) else None
        if named_colors and latex_name:
            out.append(f"\\colorlet{{color{idx}}}{{{latex_name}}}")
        else:
            out.append(f"\\definecolor{{color{idx}}}{{HTML}}{{{hex_color.lstrip('#').upper()}}}")
        out.append(f"%   color{idx} = {name} ({hex_color})")

    bg_spec = background if background is not None else str(palette["background"])
    out.append(
        f"\\definecolor{{gridbg}}{{HTML}}{{{bg_spec.lstrip('#').upper()}}}"
    )

    if wrap:
        out.append("\\begin{tikzpicture}[x=1cm,y=1cm]")

    out.append(f"\\fill[gridbg] (0,0) rectangle ({board.width},{-board.height});")

    for i, row in enumerate(board.rows):
        for j, cell in enumerate(row):
            if cell.is_empty:
                continue
            out.append(
                f"\\fill[color{colors.slot(cell.var)}] "
                f"({j},{-i}) rectangle ({j + 1},{-i - 1});"
            )

    for i, row in enumerate(board.rows):
        for j, cell in enumerate(row):
            if cell.is_empty or not cell.text:
                continue
            label = latex_escape(cell.text, math_mode)
            text_spec = f"\\({label}\\)" if math_mode else label
            fill = colors[cell.var]
            ink = readable_text(fill)
            option = ", text=white" if ink == "#ffffff" else ""
            out.append(
                f"\\node[font=\\small{option}] "
                f"at ({j + 0.5},{-i - 0.5}) {{{text_spec}}};"
            )

    out.append(f"\\draw (0,0) grid ({board.width},{-board.height});")

    if coords:
        for j in range(board.width):
            out.append(
                f"\\node[font=\\scriptsize, text=black] "
                f"at ({j + 0.5},{-board.height - 0.28}) {{{j}}};"
            )
        for i in range(board.height):
            out.append(
                f"\\node[font=\\scriptsize, text=black, anchor=east] "
                f"at (-0.12,{-i - 0.5}) {{{i}}};"
            )

    for node in corner_nodes(board):
        cx, cy = node.col + 1, -node.row - 1
        if node.label == "0":
            style = "circle, draw=black, fill=white, inner sep=2pt, font=\\scriptsize"
            text = "0"
        else:
            text = latex_escape(node.label, math_mode)
            if node.uniform:
                # Explicit marker contradicted by a uniform block; validate()
                # warned and we render the invariant instead of the marker.
                style = "circle, draw=black, fill=white, inner sep=2pt, font=\\scriptsize"
                text = "0"
            else:
                style = (
                    "circle, draw=red!85!black, very thick, fill=yellow!60, "
                    "inner sep=2pt, font=\\scriptsize"
                )
            if marker_style == "box" and not node.uniform:
                out.append(
                    f"\\begin{{scope}}\\clip ({node.col},{-node.row}) rectangle "
                    f"({node.col + 2},{-(node.row + 2)});"
                    f"\\draw[very thick, red] ({node.col},{-node.row}) rectangle "
                    f"({node.col + 2},{-(node.row + 2)});\\end{{scope}}"
                )
        label_math = f"\\({text}\\)"
        out.append(f"\\node[{style}] at ({cx},{cy}) {{{label_math}}};")

    if wrap:
        out.append("\\end{tikzpicture}")

    return "\n".join(out) + "\n"


# ---------------------------------------------------------------------------
# SVG emitter
# ---------------------------------------------------------------------------
def _svg_escape(text: str, attribute: bool = False) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    if attribute:
        text = text.replace('"', "&quot;").replace("'", "&apos;")
    return text


def _is_heart(text: str) -> bool:
    return text.strip().lower() in HEART_TOKENS or text.strip() == "♥"


def emit_svg(
    board: Board,
    palette: dict[str, object],
    colors: FigureColors,
    diags: Diagnostics,
    *,
    title: str = "",
    cell: int = 34,
    legend: bool = True,
    frame: bool = True,
    coords: bool = False,
    fill_opacity: float = 0.38,
    transparent: bool = False,
    legend_names: dict[str, str] | None = None,
) -> str:
    margin_l = 22 if coords else 8
    margin_t = 20 if coords else 8
    margin_r = 8
    margin_b = 10

    vars_in_order = colors.names()
    has_organs = any(_is_heart(c.text) for c in board.cells() if not c.is_empty)

    legend_names = legend_names or {}
    legend_entries: list[tuple[str, str]] = []
    if legend:
        legend_entries = [
            (legend_names.get(name, name), colors[name]) for name in vars_in_order
        ]
        if has_organs:
            legend_entries.append(("organ", str(palette["organ_stroke"])))

    # Pack legend entries greedily so long region names wrap instead of
    # colliding; the row height drives the overall viewBox height.
    legend_rows: list[list[tuple[str, str, int]]] = []
    row: list[tuple[str, str, int]] = []
    row_width = 0
    available = board.width * cell
    for name, hex_color in legend_entries:
        entry_width = 18 + round(5.2 * len(name))
        if row and row_width + entry_width > available:
            legend_rows.append(row)
            row, row_width = [], 0
        row.append((name, hex_color, row_width))
        row_width += entry_width
    if row:
        legend_rows.append(row)
    legend_h = len(legend_rows) * 15 + (6 if legend_rows else 0)

    width = margin_l + board.width * cell + margin_r
    height = margin_t + board.height * cell + margin_b + legend_h

    # Grid geometry, aligned exactly to cell boundaries.
    def cx(col: int) -> int:
        return margin_l + col * cell

    def cy(row: int) -> int:
        return margin_t + row * cell

    ink = str(palette["ink"])
    grid = str(palette["grid"])
    surface = str(palette["surface"])
    background = str(palette["background"])

    out: list[str] = []
    alt = title or "Discrete grid figure"
    out.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" role="img" '
        f'aria-label="{_svg_escape(alt, True)}">'
    )
    out.append(f"  <title>{_svg_escape(alt)}</title>")
    out.append(f"  <!-- generated by grid.py {VERSION} from {_svg_escape(board.source)} -->")

    if not transparent:
        out.append(
            f'  <rect x="0" y="0" width="{width}" height="{height}" '
            f'fill="{surface}"/>'
        )

    # Grid lines first: tiles sit on top of them.
    for col in range(1, board.width):
        x = cx(col)
        out.append(
            f'  <line x1="{x}" y1="{margin_t}" x2="{x}" '
            f'y2="{margin_t + board.height * cell}" stroke="{grid}" '
            f'stroke-width="0.75" stroke-dasharray="2 2"/>'
        )
    for row in range(1, board.height):
        y = cy(row)
        out.append(
            f'  <line x1="{margin_l}" y1="{y}" x2="{margin_l + board.width * cell}" '
            f'y2="{y}" stroke="{grid}" stroke-width="0.75" stroke-dasharray="2 2"/>'
        )

    # Tiles.
    for i, row in enumerate(board.rows):
        for j, tile in enumerate(row):
            if tile.is_empty:
                continue
            x, y = cx(j), cy(i)
            heart = _is_heart(tile.text)
            if heart:
                fill = str(palette["organ_fill"])
                stroke = str(palette["organ_stroke"])
                opacity = 1.0
                stroke_width = 1.8
            else:
                fill = colors[tile.var]
                stroke = fill
                opacity = fill_opacity
                stroke_width = 1.3
            out.append(
                f'  <rect x="{x + 0.6}" y="{y + 0.6}" width="{cell - 1.2}" '
                f'height="{cell - 1.2}" rx="3" fill="{fill}" '
                f'fill-opacity="{opacity:.2f}" stroke="{stroke}" '
                f'stroke-width="{stroke_width}"/>'
            )

    # Tile labels.
    for i, row in enumerate(board.rows):
        for j, tile in enumerate(row):
            if tile.is_empty or not tile.text:
                continue
            x, y = cx(j), cy(i)
            heart = _is_heart(tile.text)
            if heart:
                scale = (cell * 0.52) / 24.0
                out.append(
                    f'  <g transform="translate({x + cell / 2},{y + cell / 2 + 1}) '
                    f'scale({scale:.4f}) translate(-12,-11)">'
                    f'<path d="M12 21s-7.6-4.9-9.6-9.2C.6 8.4 2.5 4.8 6.2 4.8c2 0 3.5 1.1 4.4 2.5l1.4 1.9 1.4-1.9c.9-1.4 2.4-2.5 4.4-2.5 3.7 0 5.6 3.6 3.8 7C19.6 16.1 12 21 12 21z" '
                    f'fill="{palette["organ_stroke"]}"/></g>'
                )
                # Tag the organ with its owning region; the ink colour keeps
                # the letter legible on the blush organ fill.
                out.append(
                    f'  <text x="{x + 3.5}" y="{y + 9}" font-family="JetBrains Mono, monospace" '
                    f'font-size="{max(6, cell * 0.22):.1f}" font-weight="700" '
                    f'fill="{ink}">{_svg_escape(tile.var)}</text>'
                )
            else:
                out.append(
                    f'  <text x="{x + cell / 2}" y="{y + cell / 2}" text-anchor="middle" '
                    f'dominant-baseline="central" font-family="JetBrains Mono, monospace" '
                    f'font-size="{max(7, cell * 0.28):.1f}" font-weight="600" '
                    f'fill="{readable_text(colors[tile.var], ink)}">{_svg_escape(tile.text)}</text>'
                )

    # Corner nodes.
    for node in corner_nodes(board):
        node_x = cx(node.col + 1)
        node_y = cy(node.row + 1)
        radius = max(5.0, cell * 0.175)
        if node.label == "0" or node.uniform:
            fill, stroke, text = "#fffdf8", "#1b1b1b", "0"
        else:
            fill, stroke, text = "#FFD966", "#b91c1c", node.label
        out.append(
            f'  <circle cx="{node_x}" cy="{node_y}" r="{radius:.1f}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{1.8 if node.label != "0" and not node.uniform else 1.1}"/>'
        )
        out.append(
            f'  <text x="{node_x}" y="{node_y}" text-anchor="middle" '
            f'dominant-baseline="central" font-family="JetBrains Mono, monospace" '
            f'font-size="{max(6.5, cell * 0.24):.1f}" fill="#1b1b1b">{_svg_escape(text)}</text>'
        )

    # Outer frame.
    if frame:
        out.append(
            f'  <rect x="{margin_l - 3.5}" y="{margin_t - 3.5}" '
            f'width="{board.width * cell + 7}" height="{board.height * cell + 7}" '
            f'fill="none" stroke="#FFBF00" stroke-width="1.5" rx="4"/>'
        )

    # Axis labels.
    if coords:
        for j in range(board.width):
            out.append(
                f'  <text x="{cx(j) + cell / 2}" y="{margin_t - 6}" text-anchor="middle" '
                f'font-family="JetBrains Mono, monospace" font-size="7" fill="{ink}" '
                f'opacity="0.65">x={j}</text>'
            )
        for i in range(board.height):
            out.append(
                f'  <text x="{margin_l - 5}" y="{cy(i) + cell / 2}" text-anchor="end" '
                f'dominant-baseline="central" font-family="JetBrains Mono, monospace" '
                f'font-size="7" fill="{ink}" opacity="0.65">y={i}</text>'
            )

    # Legend.
    if legend_rows:
        base_y = margin_t + board.height * cell + 12
        for row_index, entries in enumerate(legend_rows):
            ly = base_y + row_index * 15
            for name, hex_color, offset in entries:
                lx = margin_l + offset
                out.append(
                    f'  <rect x="{lx}" y="{ly}" width="10" height="10" rx="2" '
                    f'fill="{hex_color}" stroke="{str(palette["ink"])}" '
                    f'stroke-opacity="0.35" stroke-width="0.8"/>'
                )
                out.append(
                    f'  <text x="{lx + 14}" y="{ly + 5.2}" dominant-baseline="central" '
                    f'font-family="JetBrains Mono, monospace" font-size="7.5" '
                    f'fill="{str(palette["ink"])}">{_svg_escape(name)}</text>'
                )

    out.append("</svg>")
    return "\n".join(out) + "\n"


# ---------------------------------------------------------------------------
# JSON emitter
# ---------------------------------------------------------------------------
def emit_json(
    board: Board,
    colors: FigureColors,
    diags: Diagnostics,
    *,
    title: str = "",
) -> str:
    payload = {
        "generator": f"grid.py {VERSION}",
        "title": title,
        "source": board.source,
        "width": board.width,
        "height": board.height,
        "regions": {
            name: {"slot": colors.slot(name), "hex": colors[name]}
            for name in colors.names()
        },
        "rows": [
            [
                {
                    "region": tile.var,
                    "label": tile.text,
                    "corner": tile.corner,
                }
                for tile in row
            ]
            for row in board.rows
        ],
        "corners": [
            {
                "row": node.row,
                "col": node.col,
                "label": node.label,
                "uniform": node.uniform,
            }
            for node in corner_nodes(board)
        ],
        "diagnostics": [
            {
                "level": d.level,
                "code": d.code,
                "message": d.message,
                "line": d.line,
                "column": d.column,
            }
            for d in diags.items
        ],
    }
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="grid.py",
        description="Generate TikZ, SVG or JSON figures from a tab-separated grid.",
        epilog=textwrap.dedent(
            """\
            Cell syntax:  VAR  |  VAR!LABEL  |  VAR,CORNER  |  VAR!LABEL,CORNER
            Empty cells:  .  -  ~  (or an empty field)
            Example:      printf 'A\\tB\\nA!\\u2665\\t.\\n' | python3 grid.py --format svg
            """
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "input",
        nargs="?",
        default="-",
        help="board file, or '-' for stdin (default: -)",
    )
    parser.add_argument("-o", "--output", help="write to this file instead of stdout")
    parser.add_argument(
        "-f",
        "--format",
        choices=["tikz", "svg", "json"],
        default="tikz",
        help="output format (default: tikz)",
    )
    parser.add_argument(
        "--palette",
        choices=sorted(PALETTES),
        help="colour palette (default: classic for tikz, poster for svg/json)",
    )
    parser.add_argument("--title", default="", help="figure title / accessible label")
    parser.add_argument(
        "--background",
        default=None,
        help="TikZ background colour (hex) for the board rectangle",
    )
    parser.add_argument(
        "--colors",
        choices=["html", "named"],
        default="html",
        help="TikZ colour definitions: exact HTML hex, or legacy named colours",
    )
    parser.add_argument(
        "--text-mode",
        choices=["math", "text"],
        default="math",
        help="TikZ label mode (default: math, as in v1)",
    )
    parser.add_argument(
        "--marker-style",
        choices=["ring", "box"],
        default="ring",
        help="TikZ non-zero corner emphasis (default: ring; box = v1 2x2 box)",
    )
    parser.add_argument("--no-wrap", action="store_true", help="omit the tikzpicture environment")
    parser.add_argument("--coords", action="store_true", help="add row/column coordinates")
    parser.add_argument(
        "--legend-names",
        default="",
        metavar="A=Alpha,B=Beta",
        help="SVG: rename legend entries (comma separated)",
    )
    parser.add_argument("--no-frame", action="store_true", help="SVG: omit the outer frame")
    parser.add_argument(
        "--no-legend", action="store_true", help="SVG: omit the palette legend"
    )
    parser.add_argument("--transparent", action="store_true", help="SVG: no background")
    parser.add_argument(
        "--fill-opacity",
        type=float,
        default=0.38,
        metavar="0..1",
        help="SVG fill opacity for ordinary tiles (default: 0.38)",
    )
    parser.add_argument(
        "--cell", type=int, default=34, metavar="PX", help="SVG cell size in px (default: 34)"
    )
    parser.add_argument(
        "--allow-ragged",
        action="store_true",
        help="pad ragged rows with empty cells instead of failing",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate only; print diagnostics and exit 1 on errors",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="treat warnings as errors",
    )
    parser.add_argument("-q", "--quiet", action="store_true", help="suppress diagnostics")
    parser.add_argument("--version", action="version", version=f"grid.py {VERSION}")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.input == "-":
        if sys.stdin.isatty():
            print(
                "grid.py: no input on stdin (pass a file or pipe a board); "
                "see --help",
                file=sys.stderr,
            )
            return 2
        text = sys.stdin.read()
        source = "<stdin>"
    else:
        try:
            text = Path(args.input).read_text(encoding="utf-8")
        except OSError as exc:
            print(f"grid.py: cannot read {args.input}: {exc}", file=sys.stderr)
            return 2
        source = args.input

    board, diags = parse_board(text, source, allow_ragged=args.allow_ragged)
    if board.rows:
        validate(board, diags)

    if not 0.0 <= args.fill_opacity <= 1.0:
        print("grid.py: --fill-opacity must be between 0 and 1", file=sys.stderr)
        return 2
    if args.cell < 8:
        print("grid.py: --cell must be at least 8 px", file=sys.stderr)
        return 2

    if args.strict:
        for warning in list(diags.warnings):
            diags.items.remove(warning)
            diags.error(warning.code, warning.message, warning.line, warning.column)

    status = 1 if diags.errors else 0

    if not args.quiet and diags.items:
        for diagnostic in diags.items:
            print(diagnostic.format(), file=sys.stderr)

    if args.check:
        if not args.quiet:
            print(
                f"grid.py: {board.width}x{board.height} board, "
                f"{len(board.vars_in_order())} region(s), "
                f"{len(diags.errors)} error(s), {len(diags.warnings)} warning(s)",
                file=sys.stderr,
            )
        return status

    if diags.errors:
        return status

    legend_names: dict[str, str] = {}
    for pair in filter(None, (part.strip() for part in args.legend_names.split(","))):
        if "=" not in pair:
            print(f"grid.py: --legend-names expects NAME=LABEL, got {pair!r}", file=sys.stderr)
            return 2
        key, _, value = pair.partition("=")
        legend_names[key.strip()] = value.strip()

    palette_name = args.palette or ("poster" if args.format in {"svg", "json"} else "classic")
    palette = PALETTES[palette_name]
    colors = color_map(board, palette)

    if args.format == "tikz":
        output = emit_tikz(
            board,
            palette,
            colors,
            diags,
            title=args.title,
            background=args.background,
            coords=args.coords,
            wrap=not args.no_wrap,
            marker_style=args.marker_style,
            named_colors=args.colors == "named",
            text_mode=args.text_mode,
        )
    elif args.format == "svg":
        output = emit_svg(
            board,
            palette,
            colors,
            diags,
            title=args.title,
            cell=args.cell,
            legend=not args.no_legend,
            frame=not args.no_frame,
            coords=args.coords,
            fill_opacity=args.fill_opacity,
            transparent=args.transparent,
            legend_names=legend_names,
        )
    else:
        output = emit_json(board, colors, diags, title=args.title)

    if args.output:
        try:
            with open(args.output, "w", encoding="utf-8") as handle:
                handle.write(output)
        except OSError as exc:
            print(f"grid.py: cannot write {args.output}: {exc}", file=sys.stderr)
            return 2
    else:
        sys.stdout.write(output)

    return status


if __name__ == "__main__":
    raise SystemExit(main())
