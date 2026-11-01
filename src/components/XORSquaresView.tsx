import React, { useState } from 'react';
import {
  Square,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Code2,
} from 'lucide-react';
import {
  XOR_SQUARE_PRESETS,
  verifyXORSquares,
  type XORBoardPreset,
  type XORSquare,
} from '../logic/xorSquares';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const XORSquaresView: React.FC<Props> = ({ explainMode }) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const activePreset: XORBoardPreset = XOR_SQUARE_PRESETS[selectedPresetIndex];

  const [selectedSquareIds, setSelectedSquareIds] = useState<string[]>(
    activePreset.defaultSelected
  );

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setSelectedSquareIds(XOR_SQUARE_PRESETS[index].defaultSelected);
  };

  const toggleSquare = (id: string) => {
    if (selectedSquareIds.includes(id)) {
      setSelectedSquareIds(selectedSquareIds.filter((sId) => sId !== id));
    } else {
      setSelectedSquareIds([...selectedSquareIds, id]);
    }
  };

  const handleLoadWitness = () => {
    setSelectedSquareIds(activePreset.satisfyingWitness);
  };

  const handleReset = () => {
    setSelectedSquareIds([]);
  };

  const verification = verifyXORSquares(activePreset, selectedSquareIds);

  return (
    <div className="tab-stage">
      {/* Header Banner */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <Square size={32} />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Original NP-Complete Puzzle Candidate</span>
            <span className="edu-hero-badge blue">Overlapping Square Parity Grid</span>
            <span className="edu-hero-badge teal">{activePreset.badge}</span>
          </div>
          <h2 className="edu-hero-title">XOR Squares (Parity &amp; Overlap Gadgets)</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Explanation:</strong> Think of this like placing translucent colored sheets on a light board.
                When an <strong>odd</strong> number of sheets cover a square, it glows cyan (1); when an <strong>even</strong> number
                cover it, they cancel out to dark (0). Variable gadgets use overlapping sheets to force you to pick either True or False
                (never both!), and clause squares ensure at least one true statement powers each clause!
              </>
            ) : (
              <>
                <strong>Rigorous Complexity Statement:</strong> Given a grid of size W &times; H, a collection of candidate
                bounding squares S, and target cell parity constraints b &in; &#123;0, 1&#125;^M, decide whether there exists a subset
                S&prime; &sube; S such that &sum;_(s &in; S&prime;) I[c &in; s] &equiv; b_c (mod 2). Deterministic polynomial verifier
                runs in O(W &middot; H + |S|) arithmetic steps.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="card-neu preset-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <Sparkles size={18} className="text-amber" />
            <span className="card-title-text">Select Puzzle Instance / Gadget Preset</span>
          </div>
        </div>
        <div className="preset-pill-row">
          {XOR_SQUARE_PRESETS.map((p, idx) => (
            <button
              key={p.id}
              className={`preset-pill ${selectedPresetIndex === idx ? 'active' : ''}`}
              onClick={() => handleSelectPreset(idx)}
            >
              <span>{p.name}</span>
              <span className="pill-badge">{p.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="dungeon-workspace">
        {/* Left Column: Interactive Grid & Candidate Squares */}
        <div className="left-panel">
          <div className="xor-board-wrapper">
            <div className="card-header-row">
              <div className="card-title-group">
                <Square size={18} className="text-teal" />
                <span className="card-title-text">
                  Interactive Parity Grid ({activePreset.width} &times; {activePreset.height})
                </span>
              </div>
              <div className="btn-group">
                <button className="neu-btn" onClick={handleLoadWitness} title="Load verified solution">
                  <Sparkles size={14} />
                  <span>Oracle Witness</span>
                </button>
                <button className="neu-btn" onClick={handleReset} title="Clear all selections">
                  <RotateCcw size={14} />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Grid Container */}
            <div
              className="xor-grid-container"
              style={{
                gridTemplateColumns: `repeat(${activePreset.width}, 1fr)`,
                maxWidth: `${activePreset.width * 54}px`,
              }}
            >
              {Array.from({ length: activePreset.height }).map((_, y) =>
                Array.from({ length: activePreset.width }).map((__, x) => {
                  const key = `${x},${y}`;
                  const count = verification.cellOverlapCounts[key] || 0;
                  const parity = (count % 2) as 0 | 1;
                  const constraint = activePreset.constraints.find((c) => c.x === x && c.y === y);
                  const isViolated =
                    constraint && constraint.targetParity !== null && parity !== constraint.targetParity;

                  return (
                    <div
                      key={key}
                      className={`xor-cell ${parity === 1 ? 'parity-odd' : 'parity-even'} ${
                        constraint ? 'has-constraint' : ''
                      } ${isViolated ? 'constraint-violated' : ''}`}
                      title={`Cell (${x}, ${y}): ${count} squares covering (Parity = ${parity})${
                        constraint ? `, Target: ${constraint.targetParity}` : ''
                      }`}
                    >
                      {constraint?.label && (
                        <span className="xor-cell-badge">{constraint.label}</span>
                      )}
                      <span className="cell-count-text">{count}</span>
                      {constraint && constraint.targetParity !== null && (
                        <span className="xor-cell-parity-target">
                          {constraint.targetParity === 1 ? 'Odd' : 'Even'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="hint-text" style={{ textAlign: 'center', marginTop: '8px' }}>
              Cell numbers show total overlapping active squares. Odd overlaps glow Cyan (Parity 1).
              Red borders indicate violated parity constraints!
            </p>

            {/* Squares Selector Grid */}
            <div style={{ marginTop: '16px' }}>
              <div className="section-subtitle-row">
                <span className="section-subtitle">
                  Available Candidate Squares (|S| = {activePreset.candidateSquares.length})
                </span>
                <span className="text-muted text-xs">
                  {selectedSquareIds.length} of {activePreset.candidateSquares.length} active
                </span>
              </div>
              <div className="xor-squares-selector-grid">
                {activePreset.candidateSquares.map((sq: XORSquare) => {
                  const isActive = selectedSquareIds.includes(sq.id);
                  return (
                    <div
                      key={sq.id}
                      className={`xor-square-card ${isActive ? 'active' : ''}`}
                      onClick={() => toggleSquare(sq.id)}
                      style={{
                        borderLeft: `4px solid ${sq.color}`,
                      }}
                    >
                      <div className="xor-square-info">
                        <span className="xor-square-name">{sq.name}</span>
                        <span className="xor-square-dims">
                          ({sq.x},{sq.y}) &rarr; {sq.width}&times;{sq.height}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => {}}
                        aria-label={`Toggle ${sq.name}`}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Polynomial Verifier Audit */}
        <div className="right-panel">
          <div className="verifier-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <Zap size={18} className="text-teal" />
                <span className="card-title-text">Polynomial-Time Verifier Engine</span>
              </div>
              <span className="complexity-tag">O(W &middot; H + |S|)</span>
            </div>

            {/* Verdict Box */}
            <div className={`verdict-box ${verification.isValid ? 'accept' : 'reject'}`}>
              <div className="verdict-icon-row">
                {verification.isValid ? (
                  <CheckCircle2 size={24} className="text-teal" />
                ) : (
                  <AlertTriangle size={24} className="text-rose" />
                )}
                <div>
                  <h4 className="verdict-heading">
                    {verification.isValid
                      ? 'ACCEPT — Valid Certificate Verified'
                      : 'REJECT — Parity Constraints Violated'}
                  </h4>
                  <p className="verdict-subtext">
                    {verification.isValid
                      ? 'All target cells satisfy their modulo-2 parity requirements exactly.'
                      : `${verification.violatedConstraints.length} constraint(s) failed.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Metrics */}
            <div className="audit-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Satisfied Cells</span>
                <span className="metric-value">
                  {verification.satisfiedConstraints} / {verification.totalCellsChecked}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Violations</span>
                <span
                  className="metric-value"
                  style={{ color: verification.violatedConstraints.length > 0 ? '#fb7185' : '#2dd4bf' }}
                >
                  {verification.violatedConstraints.length}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Active Squares</span>
                <span className="metric-value">{verification.activeSquaresCount}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Runtime Ops</span>
                <span className="metric-value">{verification.runtimeOps}</span>
              </div>
            </div>

            {/* Violation Trace */}
            {verification.violatedConstraints.length > 0 && (
              <div className="violations-list" style={{ marginTop: '14px' }}>
                <span className="section-subtitle">Failed Parity Constraints:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {verification.violatedConstraints.map((v, idx) => (
                    <div
                      key={idx}
                      className="trace-entry invalid"
                      style={{ padding: '8px 10px', fontSize: '0.78rem' }}
                    >
                      <strong>{v.label || `Cell (${v.x}, ${v.y})`}:</strong> Had {v.actual} overlapping squares (Parity{' '}
                      {v.actual % 2}), but required {v.target === 1 ? 'Odd (1)' : 'Even (0)'}!
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reduction Mechanics Walkthrough */}
            <div className="gadget-walkthrough-card" style={{ marginTop: '18px' }}>
              <div className="gadget-title">
                <Code2 size={16} className="text-teal" />
                <span>3-SAT Reduction Gadget Mechanics</span>
              </div>
              <div className="gadget-body">
                <p>
                  <strong>Variable Gadget:</strong> For variable x_i, two candidate squares S_i^T and S_i^F intersect
                  at cell c_i^mutex with target parity 1. Because only these two squares cover this cell:
                </p>
                <div className="math-callout">
                  (I[S_i^T &in; S&prime;] + I[S_i^F &in; S&prime;]) mod 2 = 1 &hArr; Exactly ONE of &#123;S_i^T, S_i^F&#125; is active!
                </div>
                <p>
                  <strong>Clause Gadget:</strong> Clause cells c_j^clause require odd parity. When at least one literal
                  square is active, the parity equation is satisfied. If all literals are false, parity cannot be satisfied,
                  enforcing CNF clause satisfiability!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
