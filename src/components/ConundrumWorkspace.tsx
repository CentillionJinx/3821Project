import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import {
  ALL_2X2_STATES,
  cellKey,
  cloneBoard,
  createInitialBoard,
  solveConundrum,
  verifyConundrum,
  type Bit,
  type ClueAudit,
  type ConundrumInstance,
  type SolverResult,
  type TileValue,
} from '../logic/conundrum.ts';
import { ALL_PRESETS, extractSpineAssignment } from '../logic/planarReduction.ts';
import {
  ALL_HAIRLINE_FIGURES,
  PARITY_PLINTH_FIGURE,
  WITNESS_CALIPER_FIGURE,
} from '../logic/hairlineFigures.ts';
import { HairlineStage } from './HairlineStage.tsx';
import { ProofSchematics, type GadgetId } from './ProofSchematics.tsx';

type BrushMode = 'cycle' | '0' | '1' | 'clear';
type RightSubTab = 'spec' | 'verifier' | 'proof';
type StageMode = 'grid' | 'hairline';

export function ConundrumWorkspace() {
  const [customInstance, setCustomInstance] = useState<ConundrumInstance | null>(null);
  const [selectedId, setSelectedId] = useState<string>(ALL_PRESETS[0].id);
  const [board, setBoard] = useState<TileValue[][]>(() => createInitialBoard(ALL_PRESETS[0]));
  const [brush, setBrush] = useState<BrushMode>('cycle');
  const [stageMode, setStageMode] = useState<StageMode>('grid');
  const [hairlineId, setHairlineId] = useState<string>(PARITY_PLINTH_FIGURE.name);
  const [proofGadget, setProofGadget] = useState<GadgetId>('g3');
  const [showCuts, setShowCuts] = useState<boolean>(false);
  const [showRoles, setShowRoles] = useState<boolean>(true);
  const [rightTab, setRightTab] = useState<RightSubTab>('spec');
  const [hoveredClue, setHoveredClue] = useState<{ row: number; col: number } | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [statusMessage, setStatusMessage] = useState<string>(
    'Click any unlocked tile or use arrow keys + 0/1/Space to assign χ(r,c) ∈ {0, 1}.',
  );
  const [lastSolverRun, setLastSolverRun] = useState<SolverResult | null>(null);

  const presets = useMemo(
    () => (customInstance ? [...ALL_PRESETS, customInstance] : ALL_PRESETS),
    [customInstance],
  );

  const instance = useMemo(
    () => presets.find((p) => p.id === selectedId) ?? ALL_PRESETS[0],
    [presets, selectedId],
  );

  const verification = useMemo(() => verifyConundrum(instance, board), [instance, board]);

  const clueLookup = useMemo(() => {
    const map = new Map<string, ClueAudit>();
    for (const audit of verification.clueResults) {
      map.set(`${audit.row},${audit.col}`, audit);
    }
    return map;
  }, [verification]);

  const selectPreset = useCallback((preset: ConundrumInstance) => {
    setSelectedId(preset.id);
    setBoard(createInitialBoard(preset));
    setFocusedCell({ row: 0, col: 0 });
    setHoveredClue(null);
    setLastSolverRun(null);
    setStatusMessage(`Loaded "${preset.name}" (${preset.rows}×${preset.cols}, ${preset.clues.length} clues).`);
  }, []);

  const handleLoadCompiled = useCallback(
    (compiled: ConundrumInstance) => {
      setCustomInstance(compiled);
      selectPreset(compiled);
    },
    [selectPreset],
  );

  const applyTileEdit = useCallback(
    (r: number, c: number, explicitValue?: TileValue) => {
      const key = cellKey(r, c);
      if (Object.hasOwn(instance.fixed, key)) {
        setStatusMessage(`Cell (${r}, ${c}) is fixed anchor χ₀(${r}, ${c}) = ${instance.fixed[key]} and cannot be modified.`);
        return;
      }

      setBoard((prev) => {
        const next = cloneBoard(prev);
        const cur = next[r][c];
        let val: TileValue;
        if (explicitValue !== undefined) {
          val = explicitValue;
        } else if (brush === '0') {
          val = 0;
        } else if (brush === '1') {
          val = 1;
        } else if (brush === 'clear') {
          val = null;
        } else {
          val = cur === null ? 0 : cur === 0 ? 1 : null;
        }
        next[r][c] = val;
        return next;
      });
      setFocusedCell({ row: r, col: c });
      setStatusMessage(`Set χ(${r}, ${c}) via ${explicitValue !== undefined ? 'direct key' : `${brush} tool`}.`);
    },
    [brush, instance.fixed],
  );

  const handleSolve = useCallback(() => {
    const result = solveConundrum(instance);
    setLastSolverRun(result);
    if (result.status === 'SAT' && result.solution) {
      setBoard(result.solution.map((row) => [...row]));
      setStatusMessage(
        `Exact Solver: SAT in ${result.searchNodes} search node(s) over ${result.componentsCount} compressed GF(2) component(s).`,
      );
    } else {
      setStatusMessage(
        `Exact Solver: UNSAT (${result.searchNodes} search nodes). ${result.unsatReason ?? ''}`,
      );
    }
  }, [instance]);

  const handleInvertFree = useCallback(() => {
    setBoard((prev) =>
      prev.map((row, r) =>
        row.map((val, c) => {
          if (Object.hasOwn(instance.fixed, cellKey(r, c))) return val;
          if (val === null) return null;
          return (val ^ 1) as Bit;
        }),
      ),
    );
    setStatusMessage('Applied ℤ₂ bit-flip (1 − χ) to all unassigned-anchor cells.');
  }, [instance.fixed]);

  const handleReset = useCallback(() => {
    setBoard(createInitialBoard(instance));
    setLastSolverRun(null);
    setStatusMessage('Reset board to fixed anchors χ₀.');
  }, [instance]);

  const handleBoardKeyDown = useCallback(
    (e: KeyboardEvent<SVGSVGElement>) => {
      const { row, col } = focusedCell;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedCell({ row: (row - 1 + instance.rows) % instance.rows, col });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedCell({ row: (row + 1) % instance.rows, col });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedCell({ row, col: (col - 1 + instance.cols) % instance.cols });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedCell({ row, col: (col + 1) % instance.cols });
      } else if (e.key === '0') {
        e.preventDefault();
        applyTileEdit(row, col, 0);
      } else if (e.key === '1') {
        e.preventDefault();
        applyTileEdit(row, col, 1);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        applyTileEdit(row, col, null);
      } else if (e.key === ' ') {
        e.preventDefault();
        applyTileEdit(row, col);
      }
    },
    [applyTileEdit, focusedCell, instance.cols, instance.rows],
  );

  const solverTelemetry = useMemo(
    () => (rightTab === 'verifier' ? lastSolverRun ?? solveConundrum(instance) : lastSolverRun),
    [instance, lastSolverRun, rightTab],
  );

  // SVG Geometry
  const cellSize = 48;
  const margin = 20;
  const svgWidth = instance.cols * cellSize + margin * 2;
  const svgHeight = instance.rows * cellSize + margin * 2;
  const clueRadius = Math.max(9.5, Math.min(13.5, cellSize * 0.25));

  const decodedSpine = useMemo(
    () => extractSpineAssignment(instance, board),
    [board, instance],
  );

  const clauseCoreLive = useMemo(() => {
    if (instance.id !== 'clause-core') return null;
    const x = board[0]?.[0] ?? null;
    const y = board[0]?.[2] ?? null;
    const z11 = board[1]?.[1] ?? null;
    const z12 = board[1]?.[2] ?? null;
    const z21 = board[2]?.[1] ?? null;
    const z22 = board[2]?.[2] ?? null;
    const zUnified = z11 !== null && z11 === z12 && z11 === z21 && z11 === z22 ? z11 : null;
    return { x, y, z: zUnified };
  }, [board, instance.id]);

  const conflictCount =
    verification.violatedClues + verification.infeasibleClues + verification.fixedViolations;

  const activeHairlineFigure = useMemo(
    () => ALL_HAIRLINE_FIGURES.find((f) => f.name === hairlineId) ?? PARITY_PLINTH_FIGURE,
    [hairlineId],
  );

  const handleHairlinePick = useCallback(
    (figureName: string, idx: number) => {
      if (figureName === 'clause-turret') {
        const picked = (['g1', 'g2', 'g3', 'g4'] as const)[idx] ?? 'g3';
        setProofGadget(picked);
        setRightTab('proof');
        setStatusMessage(`Hairline bay picked ${picked.toUpperCase()} — synced NP-completeness gadget tab.`);
      } else if (figureName === 'parity-plinth') {
        const ci = (idx % 3) + 1;
        const cj = Math.floor(idx / 3) + 1;
        setHoveredClue({ row: ci, col: cj });
        setStatusMessage(`Hairline node (${ci}, ${cj}) inspected across 2×2 corner neighborhood.`);
      } else if (figureName === 'witness-caliper') {
        setStatusMessage(`Hairline verifier scanned witness register 0${idx + 1}.`);
      } else if (figureName === 'pivot-tray') {
        setStatusMessage(`Hairline archive focused specimen plate stage 0${idx + 1}.`);
      }
    },
    [],
  );

  return (
    <div className="workspace">
      {/* =====================================================================
       * LEFT COLUMN: INTERACTIVE XOR-SQUARE BOARD
       * ===================================================================== */}
      <section className="board-pane" aria-label="Interactive XOR-Square Board">
        <div className="pane-strip">
          <div className="preset-strip" role="tablist" aria-label="Puzzle Presets">
            {presets.map((p) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={stageMode === 'grid' && p.id === instance.id}
                className={`preset-pill ${stageMode === 'grid' && p.id === instance.id ? 'active' : ''}`}
                onClick={() => {
                  setStageMode('grid');
                  selectPreset(p);
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="footer-group" style={{ flexShrink: 0 }}>
            <button
              className={`preset-pill ${stageMode === 'hairline' ? 'active' : ''}`}
              onClick={() =>
                setStageMode((m) => (m === 'grid' ? 'hairline' : 'grid'))
              }
              title="Toggle between interactive 2D XOR-Square grid and full-size 3D Hairline Lab"
            >
              {stageMode === 'grid' ? '3D Hairline Lab' : '2D Grid'}
            </button>
            <span
              className="mono"
              style={{ fontSize: 12.5, color: 'var(--fg-58)', whiteSpace: 'nowrap' }}
            >
              {stageMode === 'grid'
                ? `${instance.rows}×${instance.cols} · |C|=${instance.clues.length}`
                : 'ISO 400×320'}
            </span>
          </div>
        </div>

        <div className="board-meta-line">
          <span>
            {stageMode === 'grid' ? instance.subtitle : activeHairlineFigure.title}
          </span>
          <span
            className={
              stageMode === 'grid'
                ? instance.isSatisfiable
                  ? 'badge badge-pending'
                  : 'badge badge-err-outline'
                : 'badge badge-pending'
            }
          >
            {stageMode === 'grid'
              ? instance.isSatisfiable
                ? 'SAT INSTANCE'
                : 'PROVABLY UNSAT'
              : `RULES ${activeHairlineFigure.rules.map((n) => String(n).padStart(2, '0')).join('·')}`}
          </span>
        </div>

        <div className="board-stage">
          {stageMode === 'hairline' ? (
            <HairlineStage
              figure={activeHairlineFigure}
              variant="full"
              onPick={(idx) => handleHairlinePick(activeHairlineFigure.name, idx)}
            />
          ) : (
            <svg
              className="board-svg"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              tabIndex={0}
              onKeyDown={handleBoardKeyDown}
              aria-label={`XOR-Square ${instance.rows} by ${instance.cols} grid`}
            >
            {/* Board Outer Frame */}
            <rect
              x={margin}
              y={margin}
              width={instance.cols * cellSize}
              height={instance.rows * cellSize}
              fill="#090708"
              stroke="rgba(160, 253, 244, 0.35)"
              strokeWidth={1.25}
            />

            {/* Grid Tiles */}
            {Array.from({ length: instance.rows }, (_, r) =>
              Array.from({ length: instance.cols }, (__, c) => {
                const x = margin + c * cellSize;
                const y = margin + r * cellSize;
                const val = board[r]?.[c] ?? null;
                const key = cellKey(r, c);
                const isFixed = Object.hasOwn(instance.fixed, key);
                const isFocused = focusedCell.row === r && focusedCell.col === c;
                const role = instance.roles?.[key];

                let fill = '#090708';
                if (val === 1) {
                  fill = '#a0fdf4';
                } else if (showRoles && role && val === null) {
                  if (role === 'clause') fill = 'rgba(179, 242, 179, 0.10)';
                  else if (role === 'inverter') fill = 'rgba(179, 242, 179, 0.16)';
                  else if (role === 'spine') fill = 'rgba(160, 253, 244, 0.08)';
                  else if (role === 'wire') fill = 'rgba(160, 253, 244, 0.04)';
                }

                return (
                  <g
                    key={key}
                    style={{ cursor: isFixed ? 'not-allowed' : 'pointer' }}
                    onClick={() => applyTileEdit(r, c)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      applyTileEdit(r, c, null);
                    }}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      fill={fill}
                      stroke="rgba(160, 253, 244, 0.18)"
                      strokeWidth={1}
                    />

                    {/* Subtle Role Border Highlight when toggled */}
                    {showRoles && role === 'inverter' && (
                      <rect
                        x={x + 2}
                        y={y + 2}
                        width={cellSize - 4}
                        height={cellSize - 4}
                        fill="none"
                        stroke="rgba(179, 242, 179, 0.45)"
                        strokeWidth={1}
                        strokeDasharray="3 2"
                        pointerEvents="none"
                      />
                    )}

                    {/* Fixed Anchor Lock Frame */}
                    {isFixed && (
                      <>
                        <rect
                          x={x + 3}
                          y={y + 3}
                          width={cellSize - 6}
                          height={cellSize - 6}
                          fill="none"
                          stroke={val === 1 ? '#090708' : '#a0fdf4'}
                          strokeOpacity={0.75}
                          strokeWidth={1.2}
                          strokeDasharray="2 2"
                          pointerEvents="none"
                        />
                        <rect
                          x={x + 5}
                          y={y + 5}
                          width={5}
                          height={5}
                          fill={val === 1 ? '#090708' : '#a0fdf4'}
                          pointerEvents="none"
                        />
                      </>
                    )}

                    {/* Keyboard Focus Ring */}
                    {isFocused && (
                      <rect
                        x={x + 1.5}
                        y={y + 1.5}
                        width={cellSize - 3}
                        height={cellSize - 3}
                        fill="none"
                        stroke={val === 1 ? '#b3f2b3' : '#a0fdf4'}
                        strokeWidth={1.5}
                        pointerEvents="none"
                      />
                    )}

                    {/* Bit Symbol / Unassigned Reticle */}
                    {val === null ? (
                      <circle
                        cx={x + cellSize / 2}
                        cy={y + cellSize / 2}
                        r={1.8}
                        fill="rgba(160, 253, 244, 0.28)"
                        pointerEvents="none"
                      />
                    ) : (
                      <text
                        x={x + cellSize / 2}
                        y={y + cellSize / 2 + 5}
                        textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize={Math.max(15, Math.round(cellSize * 0.4))}
                        fontWeight={val === 1 ? 700 : 500}
                        fill={val === 1 ? '#090708' : 'rgba(160, 253, 244, 0.65)'}
                        pointerEvents="none"
                      >
                        {val}
                      </text>
                    )}
                  </g>
                );
              }),
            )}

            {/* Optional Dual Edge-Cuts E_cut(chi) Overlay */}
            {showCuts &&
              verification.cutEdges.map((edge) => {
                if (edge.orientation === 'v') {
                  const x = margin + edge.col * cellSize;
                  const y1 = margin + edge.row * cellSize;
                  const y2 = y1 + cellSize;
                  return (
                    <line
                      key={`cut-v-${edge.row}-${edge.col}`}
                      x1={x}
                      y1={y1}
                      x2={x}
                      y2={y2}
                      stroke="#b3f2b3"
                      strokeWidth={3.5}
                      strokeLinecap="square"
                      pointerEvents="none"
                    />
                  );
                }
                const x1 = margin + edge.col * cellSize;
                const x2 = x1 + cellSize;
                const y = margin + edge.row * cellSize;
                return (
                  <line
                    key={`cut-h-${edge.row}-${edge.col}`}
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke="#b3f2b3"
                    strokeWidth={3.5}
                    strokeLinecap="square"
                    pointerEvents="none"
                  />
                );
              })}

            {/* Highlighted / Violated 2x2 Sub-Square Outlines */}
            {verification.clueResults.map((audit) => {
              const isHovered =
                hoveredClue?.row === audit.row && hoveredClue?.col === audit.col;
              const isBad = audit.status === 'violated' || audit.status === 'infeasible';
              if (!isHovered && !isBad) return null;

              const bx = margin + (audit.col - 1) * cellSize;
              const by = margin + (audit.row - 1) * cellSize;
              return (
                <rect
                  key={`box-${audit.row}-${audit.col}`}
                  x={bx + 1}
                  y={by + 1}
                  width={cellSize * 2 - 2}
                  height={cellSize * 2 - 2}
                  fill="none"
                  stroke={isBad ? '#b3f2b3' : '#a0fdf4'}
                  strokeWidth={isHovered ? 2.4 : 1.8}
                  strokeDasharray={isBad ? '5 3' : undefined}
                  pointerEvents="none"
                />
              );
            })}

            {/* Interior Corner Clue Badges r in {0, 2, 4} */}
            {instance.clues.map((clue) => {
              const audit = clueLookup.get(`${clue.row},${clue.col}`);
              const status = audit?.status ?? 'pending';
              const cx = margin + clue.col * cellSize;
              const cy = margin + clue.row * cellSize;

              let fill = '#090708';
              let stroke = 'rgba(160, 253, 244, 0.72)';
              let textFill = '#a0fdf4';

              if (status === 'satisfied') {
                fill = '#a0fdf4';
                stroke = '#090708';
                textFill = '#090708';
              } else if (status === 'violated' || status === 'infeasible') {
                fill = '#b3f2b3';
                stroke = '#090708';
                textFill = '#090708';
              }

              return (
                <g
                  key={`clue-${clue.row}-${clue.col}`}
                  onMouseEnter={() => setHoveredClue({ row: clue.row, col: clue.col })}
                  onMouseLeave={() => setHoveredClue(null)}
                  style={{ cursor: 'help' }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={clueRadius}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={1.6}
                  />
                  <text
                    x={cx}
                    y={cy + 4.5}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize={12.5}
                    fontWeight={700}
                    fill={textFill}
                  >
                    {clue.target}
                  </text>
                </g>
              );
            })}
            </svg>
          )}
        </div>

        <div className="board-footer">
          {stageMode === 'hairline' ? (
            <>
              <div className="footer-group">
                {ALL_HAIRLINE_FIGURES.map((fig) => (
                  <button
                    key={fig.name}
                    className={`btn ${fig.name === activeHairlineFigure.name ? 'active' : ''}`}
                    onClick={() => {
                      setHairlineId(fig.name);
                      setStatusMessage(`Mounted custom Hairline model "${fig.name}".`);
                    }}
                  >
                    {fig.name}
                  </button>
                ))}
              </div>
              <div className="footer-group">
                <button className="btn accent-outline" onClick={() => setStageMode('grid')}>
                  Back to 2D Board
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="footer-group">
                {(
                  [
                    ['cycle', 'Cycle'],
                    ['0', 'Paint 0'],
                    ['1', 'Paint 1'],
                    ['clear', 'Erase'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    className={`btn ${brush === mode ? 'active' : ''}`}
                    onClick={() => setBrush(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="footer-group">
                <button
                  className={`btn ${showCuts ? 'accent-solid' : ''}`}
                  onClick={() => setShowCuts((v) => !v)}
                  title="Overlay separating boundary segments E_cut(χ)"
                >
                  Edge Cuts
                </button>
                {instance.roles && (
                  <button
                    className={`btn ${showRoles ? 'active' : ''}`}
                    onClick={() => setShowRoles((v) => !v)}
                    title="Highlight gadget zones on reduction grids"
                  >
                    Gadgets
                  </button>
                )}
                <button
                  className="btn"
                  onClick={handleSolve}
                  title="Run Parity Union-Find + DPLL solver"
                >
                  Exact Solver
                </button>
                <button
                  className="btn"
                  onClick={handleInvertFree}
                  title="Flip all non-anchor bits (1 − χ)"
                >
                  1 − χ
                </button>
                <button className="btn accent-outline" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </>
          )}
        </div>

        <div className={`status-banner ${conflictCount > 0 ? 'has-error' : ''}`}>
          <span>{statusMessage}</span>
          <span>
            Focus ({focusedCell.row},{focusedCell.col})
            {Object.hasOwn(instance.fixed, cellKey(focusedCell.row, focusedCell.col))
              ? ' [LOCKED]'
              : ''}
          </span>
        </div>
      </section>

      {/* =====================================================================
       * RIGHT COLUMN: SWITCHED RIGOROUS REFERENCE WORKBENCH
       * ===================================================================== */}
      <aside className="reference-pane" aria-label="Formal Specification and Proof Pane">
        <div className="subtab-bar" role="tablist">
          <button
            role="tab"
            aria-selected={rightTab === 'spec'}
            className={`subtab-btn ${rightTab === 'spec' ? 'active' : ''}`}
            onClick={() => setRightTab('spec')}
          >
            01 · Spec &amp; Audit
          </button>
          <button
            role="tab"
            aria-selected={rightTab === 'verifier'}
            className={`subtab-btn ${rightTab === 'verifier' ? 'active' : ''}`}
            onClick={() => setRightTab('verifier')}
          >
            02 · Verifier &amp; Solver
          </button>
          <button
            role="tab"
            aria-selected={rightTab === 'proof'}
            className={`subtab-btn ${rightTab === 'proof' ? 'active' : ''}`}
            onClick={() => setRightTab('proof')}
          >
            03 · NP-Completeness
          </button>
        </div>

        {/* SUB-TAB 1: FORMAL SPEC & LIVE AUDIT */}
        {rightTab === 'spec' && (
          <div className="subtab-body">
            <div className="section-block">
              <div className="spec-hero-grid">
                <div>
                  <div className="section-heading">
                    <span>Formal Decision Problem · Binary XOR-Square</span>
                    <span className="math" style={{ whiteSpace: 'nowrap' }}>τ ∈ &#123;0, 2, 4&#125;</span>
                  </div>
                  <div className="formula-box">
                    <div>
                      Instance: <strong>ℐ = (N, M, χ₀, C, r)</strong> with anchors{' '}
                      <strong>χ₀ : F → &#123;0, 1&#125;</strong>, corner clues{' '}
                      <strong>r : C → &#123;0, 2, 4&#125;</strong>.
                    </div>
                    <div style={{ marginTop: 4 }}>
                      Transition sum at 2×2 corner (a, b, c, d):{' '}
                      <strong>τ(a,b,c,d) = (a ⊕ b) + (b ⊕ c) + (c ⊕ d) + (d ⊕ a) = r(S)</strong>.
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--fg-82)' }}>
                      Even Parity: (a⊕b)⊕(b⊕c)⊕(c⊕d)⊕(d⊕a) = 0 over 𝔽₂ ⇒ τ ∈ &#123;0,2,4&#125;, and{' '}
                      <strong>τ = deg_cut(#)</strong>. Diagonal law: <strong>r = 2 ⇔ (a ≠ c) ∨ (b ≠ d)</strong>.
                    </div>
                  </div>
                </div>
                <HairlineStage
                  figure={PARITY_PLINTH_FIGURE}
                  variant="compact"
                  showCaption={true}
                  onPick={(idx) => handleHairlinePick('parity-plinth', idx)}
                />
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-cell">
                <span className="metric-label">Tiles Filled</span>
                <span className="metric-value">
                  {verification.filledCount}/{verification.totalCells}
                </span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Clues Met</span>
                <span className="metric-value">
                  {verification.satisfiedClues}/{instance.clues.length}
                </span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Conflicts</span>
                <span className={`metric-value ${conflictCount > 0 ? 'is-error' : ''}`}>
                  {conflictCount}
                </span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Verdict</span>
                <span
                  className={`metric-value ${
                    verification.verdict === 'REJECT' || verification.verdict === 'INFEASIBLE'
                      ? 'is-error'
                      : ''
                  }`}
                >
                  {verification.verdict}
                </span>
              </div>
            </div>

            {/* Live Witness Extraction when viewing Clause Core or Compiled Planar 3-SAT */}
            {clauseCoreLive && (
              <div className="section-block" style={{ padding: '8px 16px' }}>
                <div className="section-heading" style={{ marginBottom: 4 }}>
                  <span>
                    Live Clause Core <span className="math">(x ∨ y ∨ z)</span> Readout
                  </span>
                  <span className="math">
                    x={clauseCoreLive.x ?? '?'} · y={clauseCoreLive.y ?? '?'} · z=
                    {clauseCoreLive.z ?? '?'}
                  </span>
                </div>
                <div className="mono" style={{ fontSize: 12.5, color: 'var(--fg-82)' }}>
                  {clauseCoreLive.x !== null && clauseCoreLive.y !== null && clauseCoreLive.z !== null
                    ? (clauseCoreLive.x | clauseCoreLive.y | clauseCoreLive.z) === 1
                      ? `x ∨ y ∨ z = 1 ⇒ valid extension w=(0,1) exists.`
                      : `x ∨ y ∨ z = 0 ⇒ NO w ∈ {0,1} satisfies both r=2 clues.`
                    : `Assign x=(0,0), y=(0,2), and z=(1,1..2,2) to observe G3 OR-gate truth behaviour.`}
                </div>
              </div>
            )}

            {instance.clauseMeta && decodedSpine && (
              <div className="section-block" style={{ padding: '8px 16px' }}>
                <div className="section-heading" style={{ marginBottom: 4 }}>
                  <span>Decoded Spine Assignment</span>
                  <span className="math" style={{ fontSize: 12 }}>
                    {instance.clauseMeta.variables
                      .map((v, i) => `${v}=${decodedSpine[i] ?? '?'}`)
                      .join(' · ')}
                  </span>
                </div>
                <div className="compiler-row" style={{ marginBottom: 0 }}>
                  {instance.clauseMeta.clauses.map((cText) => (
                    <span key={cText} className="clause-chip">
                      {cText}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="section-block grow-scroll">
              <div className="section-heading">
                <span>Live Corner Clue Audit (Hover to Highlight 2×2 Block)</span>
                <span className="math" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                  |E_cut| = {verification.cutEdges.length}
                </span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      Corner <span className="math">(i,j)</span>
                    </th>
                    <th>
                      <span className="math">r</span>
                    </th>
                    <th>
                      <span className="math">τ(a,b,c,d)</span>
                    </th>
                    <th>Valid</th>
                    <th>Cut Deg</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verification.clueResults.map((audit) => {
                    const isBad = audit.status === 'violated' || audit.status === 'infeasible';
                    return (
                      <tr
                        key={`${audit.row},${audit.col}`}
                        className={`row-hover ${isBad ? 'row-conflict' : ''}`}
                        onMouseEnter={() => setHoveredClue({ row: audit.row, col: audit.col })}
                        onMouseLeave={() => setHoveredClue(null)}
                      >
                        <td>
                          ({audit.row}, {audit.col})
                          {audit.tag ? ` · ${audit.tag}` : ''}
                        </td>
                        <td>{audit.target}</td>
                        <td>{audit.actualTau === null ? '—' : audit.actualTau}</td>
                        <td>{audit.validCompletions}</td>
                        <td>{audit.activeCutDegree}</td>
                        <td>
                          <span
                            className={`badge ${
                              audit.status === 'satisfied'
                                ? 'badge-ok'
                                : isBad
                                  ? 'badge-err'
                                  : 'badge-pending'
                            }`}
                          >
                            {audit.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: VERIFIER & EXACT SOLVER */}
        {rightTab === 'verifier' && (
          <div className="subtab-body">
            <div className="section-block">
              <div className="spec-hero-grid">
                <div>
                  <div className="section-heading">
                    <span>Deterministic O(|F| + |C|) ⊆ O(N·M) Verifier</span>
                    <span className="badge badge-pending">XOR-Square ∈ NP</span>
                  </div>
                  <pre className="code-block">
                    {`VERIFY(N, M, χ₀, C, r, certificate χ):
  1. For each (r, c) ∈ F: if χ[r,c] ≠ χ₀[r,c] return REJECT
  2. For each (i, j) ∈ C:
       t ← (χ[i-1,j-1]⊕χ[i-1,j]) + (χ[i-1,j]⊕χ[i,j]) + (χ[i,j]⊕χ[i,j-1]) + (χ[i,j-1]⊕χ[i-1,j-1])
       if t ≠ r(i,j) return REJECT
  3. Return ACCEPT   // Certificate size N·M bits; strictly linear O(N·M) time`}
                  </pre>
                </div>
                <HairlineStage
                  figure={WITNESS_CALIPER_FIGURE}
                  variant="compact"
                  showCaption={true}
                  onPick={(idx) => handleHairlinePick('witness-caliper', idx)}
                />
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-cell">
                <span className="metric-label">Anchor Checks</span>
                <span className="metric-value">{verification.opsBreakdown.anchorChecks}</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Clue Checks</span>
                <span className="metric-value">{verification.opsBreakdown.clueChecks}</span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Partial Checks</span>
                <span className="metric-value">
                  {verification.opsBreakdown.partialCompletionChecks}
                </span>
              </div>
              <div className="metric-cell">
                <span className="metric-label">Exact Total Ops</span>
                <span className="metric-value">{verification.opsBreakdown.totalOps}</span>
              </div>
            </div>

            <div className="section-block" style={{ padding: '9px 16px' }}>
              <div className="section-heading" style={{ marginBottom: 4 }}>
                <span>Exact Solver Telemetry (Parity DSU + R₂ Unit-Prop DPLL)</span>
                <button className="btn" onClick={handleSolve}>
                  Re-run Solver
                </button>
              </div>
              <div className="mono" style={{ fontSize: 12.5, color: 'var(--fg-82)' }}>
                {solverTelemetry
                  ? `Status: ${solverTelemetry.status} · GF(2) Components: ${solverTelemetry.componentsCount} · DPLL Search Nodes: ${solverTelemetry.searchNodes}${
                      solverTelemetry.unsatReason ? ` · ${solverTelemetry.unsatReason}` : ''
                    }`
                  : 'Initializing solver...'}
              </div>
            </div>

            <div className="section-block grow-scroll">
              <div className="section-heading">
                <span>
                  Complete 16-State Partition of <span className="math">&#123;0, 1&#125;⁴</span>
                </span>
                <span className="math" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                  |R₀|=2 · |R₂|=12 · |R₄|=2
                </span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      <span className="math">(a, b, c, d)</span>
                    </th>
                    <th>
                      <span className="math">a ⊕ c</span>
                    </th>
                    <th>
                      <span className="math">b ⊕ d</span>
                    </th>
                    <th>
                      <span className="math">τ(a,b,c,d)</span>
                    </th>
                    <th>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_2X2_STATES.map((row) => (
                    <tr key={`${row.a}${row.b}${row.c}${row.d}`}>
                      <td>
                        ({row.a}, {row.b}, {row.c}, {row.d})
                      </td>
                      <td>{row.diagAC}</td>
                      <td>{row.diagBD}</td>
                      <td>{row.tau}</td>
                      <td>
                        <span
                          className={`badge ${
                            row.relation === 'R2' ? 'badge-err-outline' : 'badge-pending'
                          }`}
                        >
                          {row.relation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: NP-COMPLETENESS PROOF & COMPILER */}
        {rightTab === 'proof' && (
          <ProofSchematics
            onLoadCompiled={handleLoadCompiled}
            activeGadget={proofGadget}
            onSelectGadget={setProofGadget}
          />
        )}
      </aside>
    </div>
  );
}
