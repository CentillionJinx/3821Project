import { useMemo, useState } from 'react';
import {
  PLANAR_FORMULAS,
  SCHAEFER_TABLE,
  compilePlanar3Sat,
  countFormulaSolutions,
  evaluateClauseCoreAll8,
  formatFormulaText,
  type Planar3SatFormula,
} from '../logic/planarReduction.ts';
import type { ConundrumInstance } from '../logic/conundrum.ts';
import { CLAUSE_TURRET_FIGURE } from '../logic/hairlineFigures.ts';
import { HairlineStage } from './HairlineStage.tsx';

export type GadgetId = 'g1' | 'g2' | 'g3' | 'g4';

interface ProofSchematicsProps {
  onLoadCompiled: (instance: ConundrumInstance) => void;
  activeGadget?: GadgetId;
  onSelectGadget?: (gadget: GadgetId) => void;
}

function GadgetDiagram({ gadget }: { gadget: GadgetId }) {
  if (gadget === 'g1') {
    // 4x2 equality wire with bend / fan-out via r=0
    return (
      <svg viewBox="0 0 160 120" className="board-svg" aria-label="G1 Equality Wire">
        <rect width="160" height="120" fill="#090708" />
        {[0, 1, 2, 3].map((c) =>
          [0, 1].map((r) => (
            <g key={`${r}-${c}`}>
              <rect
                x={20 + c * 30}
                y={30 + r * 30}
                width={30}
                height={30}
                fill="rgba(160, 253, 244, 0.14)"
                stroke="rgba(160, 253, 244, 0.45)"
                strokeWidth={1}
              />
              <text
                x={35 + c * 30}
                y={49 + r * 30}
                textAnchor="middle"
                fill="#a0fdf4"
                fontFamily="JetBrains Mono, monospace"
                fontSize={11}
                fontWeight={600}
              >
                x
              </text>
            </g>
          )),
        )}
        {[1, 2, 3].map((c) => (
          <g key={`c-${c}`}>
            <circle cx={20 + c * 30} cy={60} r={9} fill="#a0fdf4" />
            <text
              x={20 + c * 30}
              y={64}
              textAnchor="middle"
              fill="#090708"
              fontFamily="JetBrains Mono, monospace"
              fontSize={10}
              fontWeight={700}
            >
              0
            </text>
          </g>
        ))}
        <text
          x={80}
          y={108}
          textAnchor="middle"
          fill="rgba(160,253,244,0.68)"
          fontFamily="JetBrains Mono, monospace"
          fontSize={9}
        >
          2-wide r=0 strip ⇒ all bits equal x
        </text>
      </svg>
    );
  }

  if (gadget === 'g2') {
    // 4 rows x 3 cols inline NOT inverter (r=4 at row 2, col 2)
    const cells: Array<{ r: number; c: number; label: string; filled: boolean; inv?: boolean }> = [
      { r: 0, c: 0, label: '¬x', filled: false },
      { r: 0, c: 1, label: '¬x', filled: false },
      { r: 1, c: 0, label: '¬x', filled: false },
      { r: 1, c: 1, label: '¬x', filled: false },
      { r: 1, c: 2, label: 'x', filled: true, inv: true },
      { r: 2, c: 0, label: 'x', filled: true },
      { r: 2, c: 1, label: 'x', filled: true },
      { r: 2, c: 2, label: '¬x', filled: false, inv: true },
      { r: 3, c: 0, label: 'x', filled: true },
      { r: 3, c: 1, label: 'x', filled: true },
    ];
    return (
      <svg viewBox="0 0 160 120" className="board-svg" aria-label="G2 Inline Inverter">
        <rect width="160" height="120" fill="#090708" />
        {cells.map((cell) => (
          <g key={`${cell.r}-${cell.c}`}>
            <rect
              x={38 + cell.c * 28}
              y={8 + cell.r * 24}
              width={28}
              height={24}
              fill={cell.filled ? 'rgba(160, 253, 244, 0.22)' : '#090708'}
              stroke={cell.inv ? '#e8260c' : 'rgba(160, 253, 244, 0.35)'}
              strokeWidth={1}
            />
            <text
              x={52 + cell.c * 28}
              y={24 + cell.r * 24}
              textAnchor="middle"
              fill={cell.inv ? '#e8260c' : '#a0fdf4'}
              fontFamily="JetBrains Mono, monospace"
              fontSize={9.5}
              fontWeight={700}
            >
              {cell.label}
            </text>
          </g>
        ))}
        {/* Clues: r=0 at (1,1), r=4 at (2,2), r=0 at (3,1) */}
        <circle cx={66} cy={32} r={8} fill="#a0fdf4" />
        <text x={66} y={35.5} textAnchor="middle" fill="#090708" fontSize={9.5} fontWeight={700} fontFamily="JetBrains Mono, monospace">
          0
        </text>
        <circle cx={94} cy={56} r={8.5} fill="#e8260c" />
        <text x={94} y={59.5} textAnchor="middle" fill="#090708" fontSize={9.5} fontWeight={700} fontFamily="JetBrains Mono, monospace">
          4
        </text>
        <circle cx={66} cy={80} r={8} fill="#a0fdf4" />
        <text x={66} y={83.5} textAnchor="middle" fill="#090708" fontSize={9.5} fontWeight={700} fontFamily="JetBrains Mono, monospace">
          0
        </text>
        <text x={80} y={114} textAnchor="middle" fill="rgba(160,253,244,0.68)" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
          3-col corridor: r=4 flips x → ¬x
        </text>
      </svg>
    );
  }

  if (gadget === 'g3') {
    const labels = [
      ['x', 'w', 'y'],
      ['1*', 'z', 'z'],
      ['·', 'z', 'z'],
    ];
    return (
      <svg viewBox="0 0 160 120" className="board-svg" aria-label="G3 3x3 Clause Core">
        <rect width="160" height="120" fill="#090708" />
        {labels.map((row, r) =>
          row.map((lbl, c) => {
            const isAnchor = r === 1 && c === 0;
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={38 + c * 28}
                  y={10 + r * 28}
                  width={28}
                  height={28}
                  fill={isAnchor ? '#a0fdf4' : '#090708'}
                  stroke="rgba(160, 253, 244, 0.45)"
                  strokeWidth={1}
                />
                <text
                  x={52 + c * 28}
                  y={28 + r * 28}
                  textAnchor="middle"
                  fill={isAnchor ? '#090708' : '#a0fdf4'}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={10.5}
                  fontWeight={700}
                >
                  {lbl}
                </text>
              </g>
            );
          }),
        )}
        {/* Clues: r(1,1)=2, r(1,2)=2, r(2,2)=0 */}
        <circle cx={66} cy={38} r={8} fill="#e8260c" />
        <text x={66} y={41.5} textAnchor="middle" fill="#090708" fontSize={9.5} fontWeight={700} fontFamily="JetBrains Mono, monospace">
          2
        </text>
        <circle cx={94} cy={38} r={8} fill="#e8260c" />
        <text x={94} y={41.5} textAnchor="middle" fill="#090708" fontSize={9.5} fontWeight={700} fontFamily="JetBrains Mono, monospace">
          2
        </text>
        <circle cx={94} cy={66} r={8} fill="#a0fdf4" />
        <text x={94} y={69.5} textAnchor="middle" fill="#090708" fontSize={9.5} fontWeight={700} fontFamily="JetBrains Mono, monospace">
          0
        </text>
        <text x={80} y={110} textAnchor="middle" fill="rgba(160,253,244,0.68)" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
          ∃ w ∈ &#123;0,1&#125; ⇔ (x ∨ y ∨ z) = 1
        </text>
      </svg>
    );
  }

  // g4: Rectilinear Planar 3-SAT layout overview
  return (
    <svg viewBox="0 0 160 120" className="board-svg" aria-label="G4 Rectilinear Planar 3-SAT">
      <rect width="160" height="120" fill="#090708" />
      {/* Upper clause arch */}
      <path d="M 24 52 L 24 20 L 136 20 L 136 52 M 80 52 L 80 28" fill="none" stroke="#a0fdf4" strokeWidth={2} />
      <rect x={71} y={14} width={18} height={14} fill="#e8260c" />
      <text x={80} y={24} textAnchor="middle" fill="#090708" fontSize={8.5} fontWeight={700} fontFamily="JetBrains Mono, monospace">
        C₁
      </text>
      {/* Variable spine */}
      {[18, 66, 118].map((x, idx) => (
        <g key={x}>
          <rect x={x} y={52} width={28} height={14} fill="rgba(160,253,244,0.18)" stroke="#a0fdf4" strokeWidth={1} />
          <text x={x + 14} y={62} textAnchor="middle" fill="#a0fdf4" fontSize={9} fontWeight={700} fontFamily="JetBrains Mono, monospace">
            x{idx + 1}
          </text>
        </g>
      ))}
      {/* Lower clause arch */}
      <path d="M 38 66 L 38 96 L 126 96 L 126 66 M 80 66 L 80 86" fill="none" stroke="#a0fdf4" strokeWidth={2} />
      <rect x={71} y={88} width={18} height={14} fill="#e8260c" />
      <text x={80} y={98} textAnchor="middle" fill="#090708" fontSize={8.5} fontWeight={700} fontFamily="JetBrains Mono, monospace">
        C₂
      </text>
      {/* Inverter marker */}
      <circle cx={80} cy={40} r={4.5} fill="#e8260c" />
      <text x={80} y={114} textAnchor="middle" fill="rgba(160,253,244,0.68)" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
        Area O((n + m)²) · Non-crossing
      </text>
    </svg>
  );
}

const GADGET_ORDER: readonly GadgetId[] = ['g1', 'g2', 'g3', 'g4'];

export function ProofSchematics({
  onLoadCompiled,
  activeGadget,
  onSelectGadget,
}: ProofSchematicsProps) {
  const [localGadget, setLocalGadget] = useState<GadgetId>('g3');
  const gadget = activeGadget ?? localGadget;
  const setGadget = (next: GadgetId) => {
    setLocalGadget(next);
    onSelectGadget?.(next);
  };
  const [c1Neg, setC1Neg] = useState<[boolean, boolean, boolean]>([false, true, false]);
  const [c2Neg, setC2Neg] = useState<[boolean, boolean, boolean]>([true, false, true]);
  const [enableC2, setEnableC2] = useState(true);

  const clauseCoreRows = useMemo(() => evaluateClauseCoreAll8(), []);

  const customFormula = useMemo<Planar3SatFormula>(() => {
    const clauses: Planar3SatFormula['clauses'] = [
      {
        id: 'C₁',
        side: 'upper',
        layer: 0,
        literals: [
          { varIndex: 0, negated: c1Neg[0] },
          { varIndex: 1, negated: c1Neg[1] },
          { varIndex: 2, negated: c1Neg[2] },
        ],
      },
    ];
    if (enableC2) {
      clauses.push({
        id: 'C₂',
        side: 'lower',
        layer: 0,
        literals: [
          { varIndex: 0, negated: c2Neg[0] },
          { varIndex: 1, negated: c2Neg[1] },
          { varIndex: 2, negated: c2Neg[2] },
        ],
      });
    }
    return {
      id: 'custom-planar',
      name: `Custom Planar (${clauses.length}C)`,
      variables: ['x₁', 'x₂', 'x₃'],
      clauses,
    };
  }, [c1Neg, c2Neg, enableC2]);

  const customSatCount = useMemo(() => countFormulaSolutions(customFormula), [customFormula]);

  const toggleLiteral = (clause: 1 | 2, idx: 0 | 1 | 2) => {
    if (clause === 1) {
      setC1Neg((prev) => {
        const next: [boolean, boolean, boolean] = [...prev];
        next[idx] = !next[idx];
        return next;
      });
    } else {
      setC2Neg((prev) => {
        const next: [boolean, boolean, boolean] = [...prev];
        next[idx] = !next[idx];
        return next;
      });
    }
  };

  return (
    <div className="subtab-body">
      {/* Live Planar 3-SAT Compiler Strip */}
      <div className="section-block">
        <div className="section-heading">
          <span>Constructive Reduction · Planar 3-SAT ≤ₚ XOR-Square</span>
          <span className={customSatCount > 0 ? 'badge badge-ok' : 'badge badge-err'}>
            {customSatCount} / 8 SAT assignments
          </span>
        </div>

        <div className="compiler-row">
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-58)' }}>
            C₁ (upper):
          </span>
          {([0, 1, 2] as const).map((i) => (
            <button
              key={`c1-${i}`}
              className={`btn ${c1Neg[i] ? 'accent-outline' : ''}`}
              onClick={() => toggleLiteral(1, i)}
              title="Toggle literal polarity"
            >
              {c1Neg[i] ? `¬x${i + 1}` : `x${i + 1}`}
            </button>
          ))}

          <button
            className={`btn ${enableC2 ? 'active' : ''}`}
            onClick={() => setEnableC2((v) => !v)}
          >
            {enableC2 ? '− C₂' : '+ C₂'}
          </button>

          {enableC2 &&
            ([0, 1, 2] as const).map((i) => (
              <button
                key={`c2-${i}`}
                className={`btn ${c2Neg[i] ? 'accent-outline' : ''}`}
                onClick={() => toggleLiteral(2, i)}
                title="Toggle literal polarity"
              >
                {c2Neg[i] ? `¬x${i + 1}` : `x${i + 1}`}
              </button>
            ))}
        </div>

        <div className="compiler-row" style={{ marginBottom: 0 }}>
          <span className="math" style={{ fontSize: 11, flex: 1, minWidth: 160 }}>
            φ = {formatFormulaText(customFormula)}
          </span>
          <button
            className="btn active"
            onClick={() => onLoadCompiled(compilePlanar3Sat(customFormula))}
          >
            Compile &amp; Load
          </button>
          <button
            className="btn"
            onClick={() => onLoadCompiled(compilePlanar3Sat(PLANAR_FORMULAS[1]))}
            title="Compile nested 4-variable 3-clause planar formula"
          >
            4-Var Nested (31×29)
          </button>
        </div>
      </div>

      {/* Scrollable Rigorous Proof, Gadget Library & Schaefer Dichotomy */}
      <div className="section-block grow-scroll">
        <div className="section-heading">
          <span>Gadget Library (G1–G4)</span>
          <div className="gadget-tabs">
            {(
              [
                ['g1', 'G1 Wire (r=0)'],
                ['g2', 'G2 NOT (r=4)'],
                ['g3', 'G3 3×3 Clause'],
                ['g4', 'G4 Embedding'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                className={`btn ${gadget === id ? 'active' : ''}`}
                onClick={() => setGadget(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="gadget-grid" style={{ marginBottom: 12 }}>
          <div className="gadget-visual-stack">
            <HairlineStage
              figure={CLAUSE_TURRET_FIGURE}
              variant="compact"
              showCaption={false}
              onPick={(idx) => {
                const picked = GADGET_ORDER[idx];
                if (picked) setGadget(picked);
              }}
            />
            <div className="gadget-svg-box">
              <GadgetDiagram gadget={gadget} />
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-82)', lineHeight: 1.5 }}>
            {gadget === 'g1' && (
              <>
                <p>
                  <strong className="mono">G1 — Equality Wire, Turn &amp; Fan-Out:</strong> Overlapping
                  2-cell-wide blocks with <code className="math">r = 0</code> enforce{' '}
                  <code className="math">a = b = c = d</code> throughout the connected component.
                </p>
                <p style={{ marginTop: 4 }}>
                  Rotating 90° or branching T-junctions shares a 2×2 corner without introducing new
                  constraints, propagating variable spine bit <code className="math">x ∈ &#123;0, 1&#125;</code>.
                </p>
              </>
            )}
            {gadget === 'g2' && (
              <>
                <p>
                  <strong className="mono">G2 — Inline Inverter (3 Columns):</strong> An{' '}
                  <code className="math">r = 4</code> block enforces checkerboard parity{' '}
                  <code className="math">a = c = ¬b = ¬d</code>.
                </p>
                <p style={{ marginTop: 4 }}>
                  Stepping one column rightward (<code className="math">c + 2</code>) flips the bottom-left
                  bit <code className="math">x</code> into top-left <code className="math">¬x</code> and
                  resumes a 2-wide <code className="math">r = 0</code> corridor inline, preserving planarity
                  with 1-column empty gutters.
                </p>
              </>
            )}
            {gadget === 'g3' && (
              <>
                <p>
                  <strong className="mono">G3 — 3×3 Clause Core:</strong> Fixed anchor{' '}
                  <code className="math">χ₀(1,0) = 1</code> with clues{' '}
                  <code className="math">r(1,1) = 2</code>, <code className="math">r(1,2) = 2</code>,{' '}
                  <code className="math">r(2,2) = 0</code>.
                </p>
                <p style={{ marginTop: 4 }}>
                  By the Diagonal Characterization <code className="math">r = 2 ⇔ (a≠c) ∨ (b≠d)</code>:
                  corner (1,1) requires <code className="math">(x ≠ z) ∨ (w ≠ 1)</code> and corner (1,2)
                  requires <code className="math">(w ≠ z) ∨ (y ≠ z)</code>. Eliminating{' '}
                  <code className="math">w = (0,1)</code> yields a valid bit iff{' '}
                  <code className="math">(x ∨ y ∨ z) = 1</code>.
                </p>
              </>
            )}
            {gadget === 'g4' && (
              <>
                <p>
                  <strong className="mono">G4 — Rectilinear Planar Embedding:</strong> By Lichtenstein
                  (1982) and Knuth–Raghunathan (1992), Planar 3-SAT embeds on a horizontal variable spine
                  with non-crossing 3-legged upper/lower clauses.
                </p>
                <p style={{ marginTop: 4 }}>
                  Each variable uses <code className="math">O(deg)</code> columns and each clause track uses{' '}
                  <code className="math">O(1)</code> height, giving grid area{' '}
                  <code className="math">O((n + m)²)</code> and exact spine projection soundness.
                </p>
              </>
            )}
          </div>
        </div>

        {gadget === 'g3' && (
          <div style={{ marginBottom: 12 }}>
            <div className="section-heading">
              <span>Exhaustive 8-Assignment Soundness Table for G3 (Verified Live)</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <span className="math">(x, y, z)</span>
                  </th>
                  <th>
                    <span className="math">x ∨ y ∨ z</span>
                  </th>
                  <th>
                    <span className="math">w = 0</span>
                  </th>
                  <th>
                    <span className="math">w = 1</span>
                  </th>
                  <th>
                    Valid <span className="math">w</span>
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clauseCoreRows.map((row) => (
                  <tr
                    key={`${row.x}${row.y}${row.z}`}
                    className={row.satisfiable ? '' : 'row-conflict'}
                  >
                    <td>
                      ({row.x}, {row.y}, {row.z})
                    </td>
                    <td>{row.orResult}</td>
                    <td>{row.w0Status}</td>
                    <td>{row.w1Status}</td>
                    <td>&#123;{row.validWValues.join(', ')}&#125;</td>
                    <td>
                      <span className={row.satisfiable ? 'badge badge-ok' : 'badge badge-err'}>
                        {row.satisfiable ? 'SAT' : 'UNSAT'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="section-heading">
          <span>
            Schaefer&apos;s Dichotomy Theorem (1978) on <span className="math">R₀, R₄, R₂</span>
          </span>
          <span className="math" style={{ fontSize: 10 }}>
            R₀, R₄ ∈ P · R₂ breaks all 6 clones
          </span>
        </div>
        <table className="data-table" style={{ marginBottom: 10 }}>
          <thead>
            <tr>
              <th>Property</th>
              <th>Closure</th>
              <th>
                <span className="math">R₀</span>
              </th>
              <th>
                <span className="math">R₄</span>
              </th>
              <th>
                <span className="math">R₂</span>
              </th>
              <th>
                Counterexample for <span className="math">R₂</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {SCHAEFER_TABLE.map((row) => (
              <tr key={row.property}>
                <td>{row.property}</td>
                <td>{row.closure}</td>
                <td>{row.r0Holds ? 'Yes' : 'No'}</td>
                <td>{row.r4Holds ? 'Yes' : 'No'}</td>
                <td style={{ color: 'var(--accent)', fontWeight: 700 }}>
                  {row.r2Holds ? 'Yes' : 'No'}
                </td>
                <td>{row.witness}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="code-block" style={{ fontSize: 10.5 }}>
          {`Primary Literature:\n• Lichtenstein, D. (1982). Planar formulae and their uses. SIAM J. Comput. 11(2), 329–343.\n• Knuth, D. E., & Raghunathan, A. (1992). Compatible representatives. SIAM J. Discrete Math. 5(3), 422–427.\n• Schaefer, T. J. (1978). The complexity of satisfiability problems. Proc. 10th ACM STOC, 216–226.`}
        </div>
      </div>
    </div>
  );
}
