#!/usr/bin/env python3
"""Tests for grid.py.

Run with:  python3 -m unittest discover -s tests -v
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import grid  # noqa: E402


def run_cli(board: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(ROOT / "grid.py"), *args],
        input=board,
        capture_output=True,
        text=True,
        cwd=ROOT,
        check=False,
    )


def codes(text: str) -> list[str]:
    return re.findall(r"\b([EWI]-[A-Z-]+)\b", text)


class ParseTests(unittest.TestCase):
    def test_dimensions_and_cells(self):
        board, diags = grid.parse_board("A\tB\nA\tA\n")
        self.assertEqual((board.width, board.height), (2, 2))
        self.assertEqual([c.var for c in board.rows[0]], ["A", "B"])
        self.assertEqual(diags.errors, [])

    def test_comments_and_blank_lines_are_ignored(self):
        board, diags = grid.parse_board("# title\n\nA\tB\n\nA\tA\n")
        self.assertEqual((board.width, board.height), (2, 2))
        self.assertEqual(diags.errors, [])

    def test_ragged_board_is_an_error(self):
        board, diags = grid.parse_board("A\tB\nA\n")
        self.assertTrue(any(d.code == "E-RAGGED" for d in diags.errors))
        self.assertEqual(board.height, 2)

    def test_allow_ragged_pads_with_warning(self):
        board, diags = grid.parse_board("A\nA\tB\n", allow_ragged=True)
        self.assertEqual(board.width, 2)
        self.assertEqual(board.rows[0][1].var, "")
        self.assertTrue(any(d.code == "W-RAGGED" for d in diags.warnings))

    def test_empty_board_is_an_error(self):
        _board, diags = grid.parse_board("   \n# only a comment\n")
        self.assertTrue(any(d.code == "E-EMPTY" for d in diags.errors))

    def test_label_override_and_suppression(self):
        board, _ = grid.parse_board("A!♥\tA!\n.\tB!x_1\n")
        self.assertEqual(board.rows[0][0].text, "♥")
        self.assertEqual(board.rows[0][1].text, "")
        self.assertEqual(board.rows[1][1].text, "x_1")

    def test_corner_tokens(self):
        board, _ = grid.parse_board("A,0\tB,.\nA,7\tB\n")
        self.assertEqual(board.rows[0][0].corner, "0")
        self.assertEqual(board.rows[0][1].corner, "0")
        self.assertEqual(board.rows[1][0].corner, "7")
        self.assertIsNone(board.rows[1][1].corner)

    def test_extra_comma_is_reported(self):
        _board, diags = grid.parse_board("A,1,2\tB\n")
        self.assertTrue(any(d.code == "E-CELL" for d in diags.errors))


class ColourTests(unittest.TestCase):
    def test_slots_reserve_zero_and_one(self):
        board, _ = grid.parse_board("A\tB\nB\tA\n")
        colors = grid.color_map(board, grid.PALETTES["poster"])
        self.assertEqual(colors.slot("A"), 2)
        self.assertEqual(colors.slot("B"), 3)

    def test_literal_zero_and_one_keep_their_slots(self):
        board, _ = grid.parse_board("1\t0\n0\t1\n")
        colors = grid.color_map(board, grid.PALETTES["poster"])
        self.assertEqual(colors.slot("0"), 0)
        self.assertEqual(colors.slot("1"), 1)
        self.assertEqual(colors["0"], "#ffffff")

    def test_generated_colours_beyond_the_palette(self):
        rows = "\n".join("\t".join(f"v{c}" for c in range(10)) for _ in range(3))
        result = run_cli(rows, "--format", "tikz")
        self.assertEqual(result.returncode, 0, result.stderr)
        refs = set(re.findall(r"\\fill\[(color\d+)\]", result.stdout))
        defs = set(re.findall(r"\\definecolor\{(color\d+)\}", result.stdout))
        self.assertEqual(refs - defs, set())

    def test_text_contrast_is_computed_not_hardcoded(self):
        result = run_cli("1\tA\nA\t1\n", "--format", "tikz")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("text=white", result.stdout)


class CornerTests(unittest.TestCase):
    def test_uniform_block_emits_zero_node(self):
        result = run_cli("A\tA\nA\tA\n")
        self.assertIn(r"\(0\)", result.stdout)

    def test_marker_on_mixed_corner_is_ringed(self):
        board = "A\tA\tB\nA,1\tA\tB\nB\tB\tB\n"
        result = run_cli(board)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("draw=red!85!black", result.stdout)
        self.assertIn(r"\(1\)", result.stdout)

    def test_corner_on_outer_boundary_warns_and_is_skipped(self):
        board = "A\tB\nA,1\tB\n"
        result = run_cli(board)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("W-CORNER-UNRENDERED", result.stderr)
        self.assertNotIn("draw=red!85!black", result.stdout)

    def test_marker_inside_uniform_block_warns(self):
        board = "A\tA\tA\nA,1\tA\tA\nA\tA\tA\n"
        result = run_cli(board)
        self.assertIn("W-CORNER-CONFLICT", result.stderr)
        self.assertIn(r"\(0\)", result.stdout)

    def test_strict_promotes_warnings_to_errors(self):
        board = "A\tB\nA,1\tB\n"
        result = run_cli(board, "--strict")
        self.assertEqual(result.returncode, 1)
        self.assertIn("error", result.stderr)

    def test_box_marker_style_restores_v1_emphasis(self):
        board = "A\tA\tB\nA,1\tA\tB\nB\tB\tB\n"
        result = run_cli(board, "--marker-style", "box")
        self.assertIn("rectangle", result.stdout)


class OutputTests(unittest.TestCase):
    def test_tikz_wraps_and_defines_background(self):
        result = run_cli("A\tB\nA\tA\n")
        self.assertIn(r"\begin{tikzpicture}", result.stdout)
        self.assertIn(r"\end{tikzpicture}", result.stdout)
        self.assertIn(r"\definecolor{gridbg}", result.stdout)
        self.assertNotIn(r"\begin{tikzpicture}", run_cli("A\n", "--no-wrap").stdout)

    def test_tikz_background_follows_palette(self):
        self.assertIn("gridbg}{HTML}{F8E8D4", run_cli("A\tB\nA\tA\n", "--palette", "poster").stdout)
        self.assertIn("gridbg}{HTML}{F2F2F2", run_cli("A\tB\nA\tA\n").stdout)

    def test_named_colours_keep_the_classic_spec(self):
        result = run_cli("A\tB\nA\tA\n", "--colors", "named")
        self.assertIn(r"\colorlet{color2}{red!20}", result.stdout)

    def test_text_mode_escapes_latex_specials(self):
        result = run_cli("A!50%\tB\nA\tB\n", "--text-mode", "text")
        self.assertIn(r"50\%", result.stdout)
        self.assertNotIn(r"\(50%\)", result.stdout)

    def test_svg_is_well_formed_and_has_legend(self):
        result = run_cli("A\tB\nA!♥\tB\n", "--format", "svg")
        self.assertEqual(result.returncode, 0, result.stderr)
        root = ET.fromstring(result.stdout)
        self.assertTrue(root.tag.endswith("svg"))
        self.assertIsNotNone(root.find("{http://www.w3.org/2000/svg}title"))
        self.assertIn("organ", result.stdout)
        self.assertIn("<path", result.stdout)

    def test_svg_geometry_aligns_with_cells(self):
        result = run_cli("A\tB\nA\tA\n", "--format", "svg", "--cell", "40", "--no-legend")
        root = ET.fromstring(result.stdout)
        rects = [el for el in root.iter() if el.tag.endswith("rect")]
        # background + 4 tiles + frame
        self.assertGreaterEqual(len(rects), 6)
        tile = next(r for r in rects if r.get("rx") == "3")
        self.assertEqual(float(tile.get("x")), 8.6)

    def test_legend_names_rename_entries(self):
        result = run_cli(
            "A\tB\nA\tA\n", "--format", "svg", "--legend-names", "A=Alpha"
        )
        self.assertIn(">Alpha<", result.stdout)

    def test_json_structure(self):
        result = run_cli("A\tB\nA\tA\n", "--format", "json")
        payload = json.loads(result.stdout)
        self.assertEqual(payload["width"], 2)
        self.assertEqual(payload["regions"]["A"]["slot"], 2)
        self.assertEqual(len(payload["rows"]), 2)
        self.assertIn("corners", payload)


class CliTests(unittest.TestCase):
    def test_check_mode_reports_and_exits_zero(self):
        result = run_cli("A\tB\nA\tA\n", "--check")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")
        self.assertIn("2x2 board", result.stderr)

    def test_check_mode_exits_one_on_error(self):
        result = run_cli("A\tB\nA\n", "--check")
        self.assertEqual(result.returncode, 1)

    def test_invalid_boards_emit_no_figure(self):
        result = run_cli("A\tB\nA\n")
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, "")
        self.assertIn("E-RAGGED", result.stderr)

    def test_bad_legend_names_is_a_usage_error(self):
        result = run_cli("A\n", "--format", "svg", "--legend-names", "A")
        self.assertEqual(result.returncode, 2)

    def test_missing_file_is_a_usage_error(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "grid.py"), "does-not-exist.tsv"],
            capture_output=True,
            text=True,
            cwd=ROOT,
            check=False,
        )
        self.assertEqual(result.returncode, 2)

    def test_output_file(self):
        target = ROOT / "tests" / "_out.svg"
        try:
            result = run_cli("A\n", "--format", "svg", "-o", str(target))
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(target.exists())
            self.assertIn("<svg", target.read_text(encoding="utf-8"))
        finally:
            target.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
