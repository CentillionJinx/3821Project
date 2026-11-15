import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Braces,
  CheckCircle2,
  CircleHelp,
  Code2,
  GitBranch,
  Heart,
  Layers,
  Lock,
  Microscope,
  Palette,
  RotateCcw,
  Route,
  ShieldAlert,
  Sparkles,
  Square,
  Trophy,
} from 'lucide-react';
import {
  COLOUR_FILLS,
  COLOUR_NAMES,
  COLOUR_TEXT,
  CONUNDRUM_PRESETS,
  clueKey,
  regionAt,
  regionLabel,
  resetAssignment,
  solutionAssignment,
  verifyConundrum,
  type ConundrumAssignment,
  type ConundrumClueReport,
  type ConundrumColour,
} from '../logic/colouringConundrum';

type MarkerTab =
  | 'cand-carpets'
  | 'cand-microbes'
  | 'cand-insurgency'
  | 'cand-xor'
  | 'cand-dungeon';

interface Props {
  explainMode: 'layman' | 'rigorous';
  onNavigate: (tab: MarkerTab) => void;
}

const MARKERS: {
  tab: MarkerTab;
  index: string;
  name: string;
  rule: string;
  note: string;
  icon: React.ReactNode;
}[] = [
  {
    tab: 'cand-carpets',
    index: '01',
    name: '“Carpets” Floor',
    rule: 'Multiplicity and unique cover',
    note: 'Counting stayed local, but the gadget never locked hard enough to carry a reduction.',
    icon: <Layers size={17} className="text-blue" />,
  },
  {
    tab: 'cand-microbes',
    index: '02',
    name: 'Grid-Organ (Hearts)',
    rule: 'Vital organ non-overlap',
    note: 'A local invariant we liked — but the board itself did not carry the formula.',
    icon: <Heart size={17} className="text-rose" />,
  },
  {
    tab: 'cand-insurgency',
    index: '03',
    name: 'Quell Insurgency',
    rule: 'Firefighter on a hex graph',
    note: 'A global spreading process swamped the witness; verification stopped feeling like a check.',
    icon: <ShieldAlert size={17} className="text-amber" />,
  },
  {
    tab: 'cand-xor',
    index: '04',
    name: 'XOR Squares',
    rule: 'Parity over modulo-2 overlaps',
    note: 'Parity is a global sum. The final invariant had to stay a local, four-cell lock.',
    icon: <Square size={17} className="text-teal" />,
  },
  {
    tab: 'cand-dungeon',
    index: '05',
    name: '3-SAT Trap Dungeon',
    rule: 'Spatial trap DAG',
    note: 'The DAG did the hard work. We wanted the board itself to carry the hardness.',
    icon: <Route size={17} className="text-rose" />,
  },
];

const GADGETS = [
  {
    index: 'G1',
    title: 'Truth bank',
    tag: 'three-way split',
    body: 'A fixed anchor and the two literal regions x and ¬x meet at a corner. A clue of 2 forces all three colours onto that corner, so x and ¬x must take the two colours the anchor does not use. Exactly one value is readable.',
  },
  {
    index: 'G2',
    title: 'Equality wire',
    tag: 'clue 0',
    body: 'A chain of regions joined by clue-0 corners must all carry one colour. A 0 at a boundary is not a mistake: it is an equality edge, and it carries a literal across the board without a wire cell.',
  },
  {
    index: 'G3',
    title: 'Clause junction',
    tag: 'existential',
    body: 'Three literal wires meet at a corner whose clue allows only one or two colours. At least one wire must carry the true colour, so the junction is satisfied exactly when one of its literals is true.',
  },
  {
    index: 'G4',
    title: 'Palette lift',
    tag: 'global anchors',
    body: 'Fixed 0, 1 and 2 anchors name the three colours at the gadget boundaries. That turns the local corner language into one shared formula: truth, falsity and the third colour mean the same thing everywhere.',
  },
];

const FUTURE = [
  {
    title: 'Close the layout proof',
    body: 'Place G1–G4 on one planar grid with no accidental clues, bound the board size polynomially, and write the case analysis.',
    icon: <Microscope size={17} className="text-teal" />,
  },
  {
    title: 'Map the boundary',
    body: 'Two-colour boards, four-colour boards, hex and toroidal grids. Find the smallest instance that is still hard and the largest that is easy.',
    icon: <GitBranch size={17} className="text-blue" />,
  },
  {
    title: 'Solve it exactly',
    body: 'SAT and ILP encodings, FPT in the number of clues or regions, and an approximation ratio when the board is over-constrained.',
    icon: <Braces size={17} className="text-amber" />,
  },
  {
    title: 'Prove it without showing it',
    body: 'Commit to a colouring, then prove the corner counts without revealing the colours. The zero-knowledge bonus, rebuilt on the final rule.',
    icon: <ShieldAlert size={17} className="text-rose" />,
  },
  {
    title: 'Widen the generator',
    body: 'Batch instances, colour-blind palettes, accessible clue labels, and a TSV/JSON exporter so one board can feed every surface.',
    icon: <Sparkles size={17} className="text-blue" />,
  },
];

const CELL = 58;
const MARGIN = 18;

function VerdictIcon({ tone }: { tone: 'ok' | 'bad' | 'pending' }) {
  if (tone === 'ok') return <CheckCircle2 size={20} />;
  if (tone === 'bad') return <AlertTriangle size={20} />;
  return <CircleHelp size={20} />;
}

function clueTone(report: ConundrumClueReport): 'ok' | 'bad' | 'pending' {
  if (!report.complete) return 'pending';
  return report.ok ? 'ok' : 'bad';
}

export const ColouringConundrumView: React.FC<Props> = ({ explainMode, onNavigate }) => {
  const [presetIndex, setPresetIndex] = useState(0);
  const [paint, setPaint] = useState<ConundrumColour>(0);
  const [notice, setNotice] = useState('');
  const [noticeKind, setNoticeKind] = useState<'info' | 'warn'>('info');
  const preset = CONUNDRUM_PRESETS[presetIndex];
  const [assignment, setAssignment] = useState<ConundrumAssignment>(() =>
    resetAssignment(CONUNDRUM_PRESETS[0])
  );

  const verification = verifyConundrum(preset, assignment);
  const reportByKey = new Map(verification.clues.map((report) => [clueKey(report.clue), report]));
  const boardWidth = preset.width * CELL + MARGIN * 2;
  const boardHeight = preset.height * CELL + MARGIN * 2;

  const choosePreset = (index: number) => {
    const next = CONUNDRUM_PRESETS[index];
    setPresetIndex(index);
    setAssignment(resetAssignment(next));
    setNotice('');
    setNoticeKind('info');
  };

  const colourRegion = (id: string) => {
    if (preset.fixed[id] != null) {
      setNotice(`${regionLabel(preset, id)} is a fixed anchor and cannot be repainted.`);
      setNoticeKind('warn');
      return;
    }
    setAssignment((current) => ({ ...current, [id]: paint }));
    setNotice('');
    setNoticeKind('info');
  };

  const loadOracle = () => {
    const solution = solutionAssignment(preset);
    if (!solution) {
      setNotice('This board is deliberately contradictory — there is no witness to load.');
      setNoticeKind('warn');
      return;
    }
    setAssignment(solution);
    setNotice('Loaded the planted witness. Every corner should now agree.');
    setNoticeKind('info');
  };

  const resetBoard = () => {
    setAssignment(resetAssignment(preset));
    setNotice('Cleared every free region. Fixed anchors stay put.');
    setNoticeKind('info');
  };

  const verdictTone = verification.isValid ? 'ok' : verification.isComplete ? 'bad' : 'pending';
  const verdictHeading = verification.isValid
    ? 'ACCEPT — all corner clues hold'
    : verification.isComplete
      ? `REJECT — ${verification.violations} corner clue${verification.violations === 1 ? ' disagrees' : 's disagree'}`
      : `INCOMPLETE — ${verification.totalRegions - verification.assignedRegions} region${
          verification.totalRegions - verification.assignedRegions === 1 ? '' : 's'
        } uncoloured`;

  const firstViolation = verification.clues.find((report) => report.complete && !report.ok);
  const verdictText = verification.isValid
    ? 'The colouring is a certificate: four region lookups per clue, no search, no hidden work.'
    : verification.isComplete && firstViolation
      ? `At (${firstViolation.clue.x}, ${firstViolation.clue.y}) the clue needs ${firstViolation.expected} colour${firstViolation.expected === 1 ? '' : 's'}; the board shows ${firstViolation.distinct}.`
      : 'Pick a colour, then click a region. Fixed anchors are already locked; the clue badges update as you paint.';

  return (
    <div className="tab-stage final-view conundrum-view">
      {/* ================= HERO ================= */}
      <div className="edu-hero final-hero conundrum-hero">
        <div className="edu-hero-icon-box">
          <Palette size={32} className="text-teal" />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Final puzzle · the one kept</span>
            <span className="edu-hero-badge blue">3 colours · 1 corner rule</span>
            <span className="edu-hero-badge teal">Exact O(|C| + |R|) verifier</span>
            <span className="edu-hero-badge amber">Playable board</span>
          </div>
          <h2 className="edu-hero-title">Colouring Conundrum — three colours, one local rule.</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman version.</strong> The board is cut into regions. Give every region one of
                three colours. At each circled corner, the clue says how many <em>different</em> colours
                meet there, minus one: 0 means one colour, 1 means two, 2 means three. Neighbours may match —
                the corner is the only rule. Paint the board so every clue is exact.
              </>
            ) : (
              <>
                <strong>Decision problem.</strong> Given a grid <em>G</em>, a partition of its cells into
                regions <em>R</em>, a partial colouring <em>χ₀</em> on fixed regions, and a clue{' '}
                <em>d(c) ∈ &#123;0,1,2&#125;</em> at selected interior corners, find{' '}
                <em>χ: R → &#123;0,1,2&#125;</em> extending <em>χ₀</em> such that{' '}
                <em>|&#123;χ(ρ(u)) : u ∈ N(c)&#125;| = d(c) + 1</em> for every clue corner <em>c</em>.
                The verifier reads four region colours per clue and runs in{' '}
                <em>O(|C| + |R|)</em> time.
              </>
            )}
          </p>
        </div>
      </div>

      {/* ================= STAT STRIP ================= */}
      <div className="final-claim-strip" aria-label="Colouring Conundrum at a glance">
        <div className="final-claim">
          <span className="final-claim-value">3</span>
          <span className="final-claim-label">region colours</span>
        </div>
        <div className="final-claim">
          <span className="final-claim-value">0 · 1 · 2</span>
          <span className="final-claim-label">corner clues</span>
        </div>
        <div className="final-claim">
          <span className="final-claim-value">O(|C| + |R|)</span>
          <span className="final-claim-label">verifier, one pass</span>
        </div>
        <div className="final-claim">
          <span className="final-claim-value">5</span>
          <span className="final-claim-label">candidate markers</span>
        </div>
      </div>

      {/* ================= BOARD ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">Try the rule before reading the proof</span>
          <h3 className="final-section-title">Paint the regions. Watch every corner.</h3>
          <p className="final-section-lede">
            A clue <em>d</em> is an exact count of distinct colours, not an adjacency rule. A boundary 0
            means two different regions deliberately share a colour. That is the move ordinary map
            colouring forbids, and it is the move this puzzle is built on.
          </p>
        </div>

        <div className="preset-pill-row conundrum-preset-row">
          {CONUNDRUM_PRESETS.map((candidate, index) => (
            <button
              key={candidate.id}
              className={`preset-pill ${presetIndex === index ? 'active' : ''}`}
              onClick={() => choosePreset(index)}
            >
              <span>{candidate.name}</span>
              <span className="pill-badge">{candidate.badge}</span>
            </button>
          ))}
        </div>

        <div className="conundrum-workspace">
          <div className="left-panel">
            <div className="card-neu conundrum-board-card">
              <div className="card-header-row">
                <div className="card-title-group">
                  <Palette size={18} className="text-teal" />
                  <span className="card-title-text">
                    Region board ({preset.width} × {preset.height}) · {preset.regions.length} regions ·{' '}
                    {preset.clues.length} clues
                  </span>
                </div>
                <div className="btn-group">
                  <button
                    className="neu-btn"
                    onClick={loadOracle}
                    disabled={!preset.isSatisfiable}
                    title="Load the planted colouring"
                  >
                    <Sparkles size={14} />
                    <span>Oracle</span>
                  </button>
                  <button className="neu-btn" onClick={resetBoard} title="Clear free regions">
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              <div className="conundrum-board-wrap">
                <svg
                  viewBox={`0 0 ${boardWidth} ${boardHeight}`}
                  className="conundrum-svg"
                  role="group"
                  aria-label={`${preset.name}: ${preset.width} by ${preset.height} region board with ${preset.clues.length} corner clues`}
                >
                  <rect x={0} y={0} width={boardWidth} height={boardHeight} fill="#fffdf8" />

                  {preset.regions.map((region) => {
                    const assigned = assignment[region.id];
                    const fixed = preset.fixed[region.id] != null;
                    const fill = assigned == null ? region.fill : COLOUR_FILLS[assigned];
                    return (
                      <g
                        key={region.id}
                        className={`conundrum-region ${fixed ? 'is-fixed' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Region ${regionLabel(preset, region.id)}, ${
                          assigned == null ? 'uncoloured' : COLOUR_NAMES[assigned]
                        }${fixed ? ', fixed' : ''}`}
                        onClick={() => colourRegion(region.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            colourRegion(region.id);
                          }
                        }}
                      >
                        {region.cells.map((cell) => (
                          <rect
                            key={`${region.id}-${cell.x}-${cell.y}`}
                            x={MARGIN + cell.x * CELL}
                            y={MARGIN + cell.y * CELL}
                            width={CELL}
                            height={CELL}
                            fill={fill}
                            fillOpacity={assigned == null ? 0.28 : 1}
                          />
                        ))}
                      </g>
                    );
                  })}

                  {/* Thin cell grid under the thick region boundaries. */}
                  {Array.from({ length: preset.width - 1 }, (_, index) => (
                    <line
                      pointerEvents="none"
                      key={`v-${index}`}
                      x1={MARGIN + (index + 1) * CELL}
                      y1={MARGIN}
                      x2={MARGIN + (index + 1) * CELL}
                      y2={MARGIN + preset.height * CELL}
                      stroke="#b99a6b"
                      strokeWidth={0.8}
                      opacity={0.5}
                    />
                  ))}
                  {Array.from({ length: preset.height - 1 }, (_, index) => (
                    <line
                      pointerEvents="none"
                      key={`h-${index}`}
                      x1={MARGIN}
                      y1={MARGIN + (index + 1) * CELL}
                      x2={MARGIN + preset.width * CELL}
                      y2={MARGIN + (index + 1) * CELL}
                      stroke="#b99a6b"
                      strokeWidth={0.8}
                      opacity={0.5}
                    />
                  ))}

                  {/* Region boundaries, drawn once per side. */}
                  {preset.rows.flatMap((row, y) =>
                    Array.from(row, (id, x) => {
                      const left = x === 0 || regionAt(preset, x - 1, y) !== id;
                      const right = x === preset.width - 1 || regionAt(preset, x + 1, y) !== id;
                      const top = y === 0 || regionAt(preset, x, y - 1) !== id;
                      const bottom = y === preset.height - 1 || regionAt(preset, x, y + 1) !== id;
                      const x0 = MARGIN + x * CELL;
                      const y0 = MARGIN + y * CELL;
                      const x1 = x0 + CELL;
                      const y1 = y0 + CELL;
                      return (
                        <g key={`edge-${x}-${y}`} pointerEvents="none" stroke="#2723a9" strokeWidth={2.2} strokeLinecap="round">
                          {left && <line x1={x0} y1={y0} x2={x0} y2={y1} />}
                          {right && <line x1={x1} y1={y0} x2={x1} y2={y1} />}
                          {top && <line x1={x0} y1={y0} x2={x1} y2={y0} />}
                          {bottom && <line x1={x0} y1={y1} x2={x1} y2={y1} />}
                        </g>
                      );
                    })
                  )}

                  <rect
                    x={MARGIN}
                    y={MARGIN}
                    width={preset.width * CELL}
                    height={preset.height * CELL}
                    fill="none"
                    pointerEvents="none"
                    stroke="#2723a9"
                    strokeWidth={2.8}
                    strokeLinejoin="round"
                  />

                  {/* Region labels and the current colour numeral. */}
                  {preset.regions.map((region) => {
                    const assigned = assignment[region.id];
                    const fixed = preset.fixed[region.id] != null;
                    const cx = MARGIN + region.anchor.x * CELL + CELL / 2;
                    const cy = MARGIN + region.anchor.y * CELL + CELL / 2;
                    return (
                      <g key={`label-${region.id}`} pointerEvents="none" textAnchor="middle">
                        <text
                          x={cx}
                          y={cy - 3}
                          fontFamily="JetBrains Mono, monospace"
                          fontSize={8.5}
                          fontWeight={700}
                          fill={assigned == null ? '#2723a9' : COLOUR_TEXT[assigned]}
                          opacity={0.86}
                        >
                          {regionLabel(preset, region.id)}
                        </text>
                        <text
                          x={cx}
                          y={cy + 14}
                          fontFamily="Cinzel, serif"
                          fontSize={assigned == null ? 11 : 14}
                          fontWeight={800}
                          fill={assigned == null ? '#2723a9' : COLOUR_TEXT[assigned]}
                          opacity={assigned == null ? 0.4 : 1}
                        >
                          {assigned == null ? '?' : assigned}
                        </text>
                        {fixed && (
                          <text
                            x={cx}
                            y={cy + 23}
                            fontFamily="JetBrains Mono, monospace"
                            fontSize={5.4}
                            fontWeight={700}
                            letterSpacing="0.08em"
                            fill={assigned == null ? '#2723a9' : COLOUR_TEXT[assigned]}
                            opacity={0.72}
                          >
                            FIXED
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Corner clue badges. */}
                  {preset.clues.map((clue) => {
                    const report = reportByKey.get(clueKey(clue));
                    const tone = report ? clueTone(report) : 'pending';
                    const cx = MARGIN + clue.x * CELL;
                    const cy = MARGIN + clue.y * CELL;
                    return (
                      <g key={`clue-${clue.x}-${clue.y}`} pointerEvents="none" className={`conundrum-clue ${tone}`}>
                        <title>
                          {`Clue ${clue.distinct - 1}: exactly ${clue.distinct} distinct colour${
                            clue.distinct === 1 ? '' : 's'
                          } around this corner. Currently ${
                            report?.distinct == null ? 'incomplete' : `${report.distinct}`
                          }.`}
                        </title>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={10.2}
                          fill="#fffdf8"
                          stroke={tone === 'bad' ? '#be123c' : tone === 'pending' ? '#b45309' : '#2723a9'}
                          strokeWidth={1.8}
                        />
                        <text
                          x={cx}
                          y={cy + 3.4}
                          textAnchor="middle"
                          fontFamily="JetBrains Mono, monospace"
                          fontSize={9.2}
                          fontWeight={800}
                          fill={tone === 'bad' ? '#be123c' : '#2723a9'}
                        >
                          {clue.distinct - 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="conundrum-legend" aria-label="Colour legend">
                {([0, 1, 2] as ConundrumColour[]).map((colour) => (
                  <span key={colour} className="conundrum-legend-item">
                    <span
                      className="conundrum-swatch"
                      style={{ background: COLOUR_FILLS[colour], color: COLOUR_TEXT[colour] }}
                    >
                      {colour}
                    </span>
                    {COLOUR_NAMES[colour]}
                  </span>
                ))}
                <span className="conundrum-legend-rule">
                  Clue <code>d</code> asks for exactly <code>d + 1</code> colours.
                </span>
              </div>

              <p className="hint-text conundrum-board-hint">
                Click a region to paint it with the selected colour, or focus it and press Enter.
                Faint tints are identity only — painting replaces them with one of the three solid
                colours. <strong>Oracle</strong> loads the planted witness; <strong>Reset</strong> clears
                every free region. Fixed anchors carry a small <em>FIXED</em> mark.
              </p>
            </div>
          </div>

          <div className="right-panel">
            <div className="verifier-card conundrum-verifier">
              <div className="card-header-row">
                <div className="card-title-group">
                  <CheckCircle2 size={18} className="text-teal" />
                  <span className="card-title-text">Corner-diversity verifier</span>
                </div>
                <span className="complexity-tag">O(|C| + |R|)</span>
              </div>

              <div className={`verdict-box conundrum-verdict ${verdictTone === 'ok' ? 'accept' : verdictTone === 'bad' ? 'reject' : 'incomplete'}`}>
                <div className="verdict-icon-row">
                  <VerdictIcon tone={verdictTone} />
                  <div>
                    <h4 className="verdict-heading">{verdictHeading}</h4>
                    <p className="verdict-subtext">{verdictText}</p>
                  </div>
                </div>
              </div>

              <div className="audit-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Regions painted</span>
                  <span className="metric-value">
                    {verification.assignedRegions} / {verification.totalRegions}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Clues satisfied</span>
                  <span className="metric-value">
                    {verification.satisfiedClues} / {verification.totalClues}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Violations</span>
                  <span className="metric-value">{verification.violations}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Verifier ops</span>
                  <span className="metric-value">{verification.operations}</span>
                </div>
              </div>

              <div className="conundrum-palette-block">
                <span className="conundrum-minihead">Paint palette</span>
                <div className="conundrum-palette" role="group" aria-label="Paint colour">
                  {([0, 1, 2] as ConundrumColour[]).map((colour) => (
                    <button
                      key={colour}
                      className={`conundrum-paint ${paint === colour ? 'active' : ''}`}
                      onClick={() => setPaint(colour)}
                      aria-pressed={paint === colour}
                    >
                      <span
                        className="conundrum-paint-swatch"
                        style={{ background: COLOUR_FILLS[colour], color: COLOUR_TEXT[colour] }}
                      >
                        {colour}
                      </span>
                      <span>{COLOUR_NAMES[colour]}</span>
                    </button>
                  ))}
                </div>
                {notice && <p className={`conundrum-notice ${noticeKind}`}>{notice}</p>}
              </div>

              <div className="conundrum-audit">
                <div className="conundrum-minihead">
                  Corner audit <span>{verification.satisfiedClues}/{verification.totalClues}</span>
                </div>
                <div className="conundrum-audit-list">
                  {verification.clues.map((report) => {
                    const tone = clueTone(report);
                    return (
                      <div key={clueKey(report.clue)} className={`conundrum-audit-row ${tone}`}>
                        <code>
                          ({report.clue.x},{report.clue.y})
                        </code>
                        <span>needs {report.expected}</span>
                        <span>sees {report.distinct ?? '—'}</span>
                        <span className="conundrum-audit-state">
                          {tone === 'ok' ? 'ok' : tone === 'bad' ? 'bad' : '…'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="card-neu conundrum-rules">
              <div className="card-title-group">
                <Lock size={17} className="text-amber" />
                <span className="card-title-text">Three rules, no adjacency clause</span>
              </div>
              <ol className="conundrum-rule-list">
                <li>
                  <strong>One colour per region.</strong> The whole polyomino fills at once; there is no
                  per-cell colour.
                </li>
                <li>
                  <strong>The corner is the rule.</strong> A clue <code>d</code> means exactly{' '}
                  <code>d + 1</code> distinct colours among the four cells meeting there.
                </li>
                <li>
                  <strong>Neighbours may match.</strong> A 0 at a region boundary is legal and useful: it is
                  an equality edge, not a contradiction.
                </li>
              </ol>
              <p className="hint-text">{preset.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTRACT ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">The contract</span>
          <h3 className="final-section-title">Four lookups per clue, one pass, no search.</h3>
        </div>
        <div className="final-contract-grid">
          <div className="card-neu final-code-card">
            <div className="final-code-head">
              <Code2 size={14} />
              <span>verify(G, R, F, clues, χ)</span>
              <span className="pill-badge">deterministic</span>
            </div>
            <pre className="final-code">{`assert χ extends χ₀            # fixed anchors
for (x, y, d) in clues:       # one pass
    seen = { χ(ρ(x-1, y-1)), χ(ρ(x, y-1)),
             χ(ρ(x-1, y)),   χ(ρ(x, y)) }
    assert |seen| == d + 1
return ACCEPT`}</pre>
          </div>
          <div className="final-contract-side">
            <div className="final-check">
              <span>Fixed anchors</span>
              <code>O(|F|)</code>
            </div>
            <div className="final-check">
              <span>Corner scan</span>
              <code>O(4|C|)</code>
            </div>
            <div className="final-check">
              <span>Colour set</span>
              <code>O(1)</code>
            </div>
            <div className="final-check">
              <span>Total</span>
              <code>O(|C| + |R|)</code>
            </div>
            <p className="hint-text">
              Space <strong>O(|R|)</strong>. The witness is the colouring: a <em>yes</em> answer is
              checkable without trusting the solver, and a <em>no</em> answer is the hard part.
            </p>
          </div>
        </div>
      </section>

      {/* ================= REDUCTION ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">Why it is hard</span>
          <h3 className="final-section-title">3-SAT → Colouring Conundrum, in four gadgets.</h3>
          <p className="final-section-lede">
            The construction is a sketch with a complete argument at gadget level. What remains is the
            placement case analysis: putting all four gadgets on one planar grid without an accidental
            corner clue.
          </p>
        </div>
        <div className="final-gadget-grid conundrum-gadget-grid">
          {GADGETS.map((gadget) => (
            <div key={gadget.index} className="card-neu final-gadget">
              <div className="final-gadget-top">
                <span className="final-gadget-index">{gadget.index}</span>
                <span className="pill-badge">{gadget.tag}</span>
              </div>
              <h4>{gadget.title}</h4>
              <p>{gadget.body}</p>
            </div>
          ))}
        </div>
        <div className="final-proof-grid">
          <div className="final-proof">
            <span className="final-proof-tag">Forward · a satisfying assignment gives a colouring</span>
            <p>
              Colour each variable gadget by its truth value, then carry that colour along the equality
              wires. At every clause junction, colour the junction from one satisfied literal. A clue-2
              truth bank separates <em>x</em> from <em>¬x</em>; a clue-0 wire forces equality; the clause
              clue allows only the true colour to appear. Every corner agrees by construction.
            </p>
          </div>
          <div className="final-proof">
            <span className="final-proof-tag">Backward · a colouring gives a satisfying assignment</span>
            <p>
              Read each truth bank: the three-way corner gives <em>x</em> and <em>¬x</em> opposite
              readings. Equality wires preserve those readings across the board. At each clause junction,
              the corner needs at least one true-coloured wire, so at least one literal is satisfied. The
              fixed anchors name the colours consistently, so one global assignment satisfies every clause.
            </p>
          </div>
        </div>
        <div className="final-open-note">
          <CircleHelp size={17} className="text-amber" />
          <span>
            <strong>Open item, stated plainly:</strong> the gadget argument is not yet a full reduction.
            The missing step is a planar layout with a polynomial grid bound and a proof that no unintended
            corner clue appears. That is the next piece of work, not a footnote.
          </span>
        </div>
      </section>

      {/* ================= MARKERS ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">How we got here</span>
          <h3 className="final-section-title">Five markers, one final rule.</h3>
          <p className="final-section-lede">
            The earlier candidates are kept as progression markers: each one taught us which constraint we
            did not want. They are not competing proposals any more.
          </p>
        </div>
        <div className="final-marker-grid conundrum-marker-grid">
          {MARKERS.map((marker) => (
            <button
              key={marker.tab}
              className="final-marker"
              onClick={() => onNavigate(marker.tab)}
            >
              <div className="final-marker-top">
                <span className="final-marker-index">{marker.index}</span>
                {marker.icon}
              </div>
              <h4>{marker.name}</h4>
              <span className="final-marker-rule">{marker.rule}</span>
              <p>{marker.note}</p>
              <span className="final-marker-link">
                Open marker <ArrowRight size={12} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ================= FUTURE ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">Future work</span>
          <h3 className="final-section-title">What we would do with another month.</h3>
        </div>
        <div className="final-future-grid conundrum-future-grid">
          {FUTURE.map((item) => (
            <div key={item.title} className="card-neu final-future">
              <div className="final-future-top">
                {item.icon}
                <span className="final-future-index">+</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= YOUR TURN ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">Your turn</span>
          <h3 className="final-section-title">Four ways to push on the final puzzle.</h3>
        </div>
        <ol className="final-prompt-list conundrum-prompt-list">
          <li>
            <span className="final-prompt-num">1</span>
            <span>
              <strong>Beat the board.</strong> Solve Four Corners without the oracle. Then load the witness
              and compare your colouring with the planted one.
            </span>
          </li>
          <li>
            <span className="final-prompt-num">2</span>
            <span>
              <strong>Break a rule.</strong> Find a board where two neighbouring regions must share a
              colour, or prove that no such board exists under all the corner clues.
            </span>
          </li>
          <li>
            <span className="final-prompt-num">3</span>
            <span>
              <strong>Find an easy island.</strong> Name a polynomial special case — a tree of regions, one
              clue per region, or two colours only — and prove it.
            </span>
          </li>
          <li>
            <span className="final-prompt-num">4</span>
            <span>
              <strong>Break the check.</strong> Produce a colouring the verifier accepts that violates the
              intended reduction, or explain why no such colouring can exist.
            </span>
          </li>
        </ol>
      </section>

      <div className="final-open-note conundrum-endnote">
        <Trophy size={17} className="text-amber" />
        <span>
          <strong>One board, one verifier.</strong> The colouring is the whole certificate: no hidden
          solver, no witness tape, no second phase. The Clue badges are the only authority.
        </span>
      </div>
    </div>
  );
};
