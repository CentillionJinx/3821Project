#!/usr/bin/env python3
"""Regenerate the poster's Microbes figure from figures/poster-microbes.tsv.

The poster embeds the SVG inline so it prints without external requests.
Run this after editing the board: it rewrites public/figures/poster-microbes.svg
and replaces the inline block in public/poster.html, so the two cannot drift.
"""

from __future__ import annotations

from pathlib import Path

import grid

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "figures" / "poster-microbes.tsv"
EXPORT = ROOT / "public" / "figures" / "poster-microbes.svg"
POSTER = ROOT / "public" / "poster.html"
ANCHOR = "<!-- High-Contrast Crisp SVG Diagram: Discrete Grid-Based Polyominoes -->"
TITLE = "Hearts // Microbes: vital-organ non-overlap"
CELL = 34
CLASS = "w-full max-w-[380px] h-auto"


def main() -> int:
    board, diagnostics = grid.parse_board(
        SOURCE.read_text(encoding="utf-8"), str(SOURCE.relative_to(ROOT))
    )
    grid.validate(board, diagnostics)
    if diagnostics.errors:
        for diagnostic in diagnostics.items:
            print(diagnostic.format())
        print("update_poster_figure.py: board has errors; poster left unchanged")
        return 1

    palette = grid.PALETTES["poster"]
    colors = grid.color_map(board, palette)
    svg = grid.emit_svg(
        board, palette, colors, diagnostics, title=TITLE, cell=CELL
    ).rstrip("\n")

    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    EXPORT.write_text(svg + "\n", encoding="utf-8")

    html = POSTER.read_text(encoding="utf-8")
    if html.count(ANCHOR) != 1:
        print(f"update_poster_figure.py: expected one {ANCHOR!r} marker")
        return 1

    anchor_at = html.index(ANCHOR)
    start = html.index("<svg", anchor_at)
    end = html.index("</svg>", start) + len("</svg>")
    line_start = html.rfind("\n", 0, start) + 1
    indent = html[line_start:start]

    inline = svg.replace("<svg xmlns=", f'<svg class="{CLASS}" xmlns=', 1)
    block = "\n".join(indent + line for line in inline.splitlines())
    POSTER.write_text(html[:line_start] + block + html[end:], encoding="utf-8")

    print(
        f"update_poster_figure.py: {board.width}x{board.height} board, "
        f"{len(colors.names())} region(s) -> {EXPORT.relative_to(ROOT)} + inline poster"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
