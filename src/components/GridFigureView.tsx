import React, { useMemo, useState } from 'react';
import {
  LayoutGrid,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  Code2,
  FileCode2,
  Info,
} from 'lucide-react';
import { buildFigure, POSTER_PALETTE } from '../logic/gridFigure';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

interface Preset {
  id: string;
  name: string;
  badge: string;
  note: string;
  source: string;
}

const board = (rows: string[][]): string => rows.map((row) => row.join('\t')).join('\n');

const PRESETS: Preset[] = [
  {
    id: 'poster',
    name: 'Poster board',
    badge: '6 × 3',
    note: 'A worked example: two overlapping polyominoes, both organs protected, one shared body tile.',
    source: board([
      ['.', 'A', '.', 'B', '.', '.'],
      ['A', 'A!♥', 'AB', 'B', 'B!♥', 'B'],
      ['.', 'A', '.', 'B', '.', '.'],
    ]),
  },
  {
    id: 'corners',
    name: 'Corner nodes',
    badge: '4 × 4',
    note: 'Uniform 2×2 blocks collapse to white zero nodes. A labelled marker only survives where the four quadrants disagree, drawn with a red ring.',
    source: board([
      ['A', 'A', 'A', 'B'],
      ['A', 'A', 'A', 'B'],
      ['A', 'A', 'A,2', 'B'],
      ['B', 'B', 'B', 'B'],
    ]),
  },
  {
    id: 'broken',
    name: 'Invalid input',
    badge: 'errors',
    note: 'A ragged row is rejected instead of crashing, and a corner annotation on the outer boundary is reported rather than silently dropped.',
    source: board([
      ['A', 'B', 'C'],
      ['A', 'B'],
      ['A,0', 'B', 'C'],
    ]),
  },
];

const renderIssueLocation = (line?: number, column?: number): string => {
  if (line === undefined) return '';
  return column === undefined ? `line ${line}` : `line ${line}, col ${column + 1}`;
};

const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
};

const downloadText = (filename: string, content: string, mime: string): void => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const GridFigureView: React.FC<Props> = ({ explainMode }) => {
  const [presetIndex, setPresetIndex] = useState(0);
  const [source, setSource] = useState(PRESETS[0].source);
  const [copied, setCopied] = useState<'tikz' | 'svg' | null>(null);

  const preset = PRESETS[presetIndex];
  const figure = useMemo(
    () =>
      buildFigure(source, {
        title: 'NP-GridLab grid figure',
      }),
    [source]
  );

  const errors = figure.issues.filter((issue) => issue.level === 'error');
  const warnings = figure.issues.filter((issue) => issue.level === 'warning');
  const ready = errors.length === 0 && figure.board.width > 0;

  const selectPreset = (index: number) => {
    setPresetIndex(index);
    setSource(PRESETS[index].source);
  };

  const handleCopy = async (kind: 'tikz' | 'svg') => {
    const text = kind === 'tikz' ? figure.tikz : figure.svg;
    if (await copyText(text)) {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    }
  };

  return (
    <div className="tab-stage">
      {/* Hero Header */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <LayoutGrid size={32} className="text-teal" />
        </div>
        <div className="edu-hero-text">
          <h2 className="edu-hero-title">Grid Figure Studio</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman version.</strong> A board is written once as tab-separated cells. The
                preview, the SVG, and the TikZ output all come from that one board.
              </>
            ) : (
              <>
                <strong>Figure pipeline:</strong> <code>grid.py</code> parses a TSV board, assigns colour
                slots in first-appearance order, and emits TikZ, SVG or JSON. This studio uses the same
                parser and geometry.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="dungeon-workspace">
        {/* Input */}
        <div className="left-panel">
          <div className="card-neu">
            <div className="card-header-row">
              <div className="card-title-group">
                <FileCode2 size={18} className="text-teal" />
                <span className="card-title-text">Board Source (tab-separated)</span>
              </div>
              <span className="complexity-tag">
                {figure.board.width} &times; {figure.board.height}
              </span>
            </div>

            <div className="preset-pill-row" style={{ marginTop: '4px' }}>
              {PRESETS.map((item, index) => (
                <button
                  key={item.id}
                  className={`preset-pill ${presetIndex === index ? 'active' : ''}`}
                  onClick={() => selectPreset(index)}
                >
                  <span>{item.name}</span>
                  <span className="pill-badge">{item.badge}</span>
                </button>
              ))}
            </div>

            <textarea
              className="studio-textarea"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              aria-label="Grid board source, tab separated"
              rows={8}
            />

            <p className="hint-text" style={{ marginTop: '8px' }}>
              {preset.note}
            </p>

            <div className="studio-format-grid">
              <code>VAR</code>
              <span>Region fill + centred label.</span>
              <code>VAR!LABEL</code>
              <span>Override the label. <code>A!</code> draws colour only; <code>A!♥</code> marks a vital organ.</span>
              <code>VAR,CORNER</code>
              <span>Bottom-right corner node. <code>0</code> is a zero node; anything else is labelled.</span>
              <code>. &nbsp;- &nbsp;~</code>
              <span>Empty cell (or leave the field blank).</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="right-panel">
          <div className="card-neu">
            <div className="card-header-row">
              <div className="card-title-group">
                <LayoutGrid size={18} className="text-amber" />
                <span className="card-title-text">Live Preview</span>
              </div>
              <span className="complexity-tag">O(NM)</span>
            </div>

            <div className={`verdict-box ${ready ? 'accept' : 'reject'}`} style={{ marginTop: '10px' }}>
              <div className="verdict-icon-row">
                {ready ? (
                  <CheckCircle2 size={22} className="text-teal" />
                ) : (
                  <AlertTriangle size={22} className="text-rose" />
                )}
                <div>
                  <h4 className="verdict-heading">
                    {ready ? 'VALID — figure ready to export' : 'INVALID — preview only'}
                  </h4>
                  <p className="verdict-subtext">
                    {ready
                      ? `${figure.board.width}×${figure.board.height} board · ${figure.colors.order.length} region(s) · ${warnings.length} warning(s)`
                      : `${errors.length} error(s), ${warnings.length} warning(s). The preview is diagnostic only — the CLI exits 1 and emits nothing.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="studio-preview" dangerouslySetInnerHTML={{ __html: figure.svg }} />

            <div className="studio-chip-row">
              {figure.colors.order.map((name) => (
                <span className="studio-chip" key={name}>
                  <i style={{ backgroundColor: figure.colors.hex[name] }} />
                  <span>{name}</span>
                  <code>{figure.colors.hex[name]}</code>
                  <small>slot {figure.colors.slot[name]}</small>
                </span>
              ))}
            </div>

            <ul className="studio-issue-list">
              {figure.issues.length === 0 && (
                <li className="studio-issue ok">
                  <Check size={13} />
                  <span>No issues. Rectangular board, every corner annotation is renderable.</span>
                </li>
              )}
              {figure.issues.map((issue, index) => (
                <li
                  key={`${issue.code}-${index}`}
                  className={`studio-issue ${issue.level === 'error' ? 'error' : 'warn'}`}
                >
                  {issue.level === 'error' ? <AlertTriangle size={13} /> : <Info size={13} />}
                  <span>
                    <code>{issue.code}</code> {issue.message}
                    {issue.line !== undefined && (
                      <small> ({renderIssueLocation(issue.line, issue.column)})</small>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Generated output */}
      <div className="card-neu" style={{ marginTop: '18px' }}>
        <div className="card-header-row">
          <div className="card-title-group">
            <Code2 size={18} className="text-blue" />
            <span className="card-title-text">Generated Output</span>
          </div>
          <span className="complexity-tag">grid.py compatible</span>
        </div>

        <div className="studio-output-grid">
          <div className="studio-output-block">
            <div className="studio-output-head">
              <strong>TikZ / LaTeX</strong>
              <div className="btn-group">
                <button
                  className="neu-btn"
                  onClick={() => handleCopy('tikz')}
                  disabled={!ready}
                  title="Copy TikZ to clipboard"
                >
                  {copied === 'tikz' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied === 'tikz' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  className="neu-btn"
                  onClick={() => downloadText('figure.tex', figure.tikz, 'text/x-tex')}
                  disabled={!ready}
                  title="Download .tex"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
            <pre className="studio-code">
              {ready
                ? figure.tikz
                : '% Invalid board. Fix the diagnostics above; grid.py exits 1 and emits no figure.'}
            </pre>
          </div>

          <div className="studio-output-block">
            <div className="studio-output-head">
              <strong>SVG</strong>
              <div className="btn-group">
                <button
                  className="neu-btn"
                  onClick={() => handleCopy('svg')}
                  disabled={!ready}
                  title="Copy SVG markup"
                >
                  {copied === 'svg' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied === 'svg' ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  className="neu-btn"
                  onClick={() => downloadText('figure.svg', figure.svg, 'image/svg+xml')}
                  disabled={!ready}
                  title="Download .svg"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
            <pre className="studio-code">
              {ready
                ? figure.svg
                : '<!-- Invalid board. Fix the diagnostics above; grid.py exits 1 and emits no figure. -->'}
            </pre>
          </div>
        </div>

        <p className="hint-text" style={{ marginTop: '12px', marginBottom: '6px' }}>
          Reproduce the committed figure:
        </p>
        <code className="studio-cli">python3 update_poster_figure.py</code>
        <p className="hint-text">
          The script renders <code>figures/poster-microbes.tsv</code>, writes the standalone SVG and
          updates the inline copy, so the two cannot drift.
        </p>

        <div className="studio-palette-note">
          <span>
            Palette <strong>poster</strong>: {POSTER_PALETTE.colors.slice(2, 6).join(' · ')}
          </span>
          <span>Text colour is chosen from measured luminance, not hard-coded per region.</span>
        </div>
      </div>
    </div>
  );
};
