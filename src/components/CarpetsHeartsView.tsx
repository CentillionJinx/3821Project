import React, { useState } from 'react';
import {
  Heart,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Code2,
} from 'lucide-react';
import {
  CARPETS_HEARTS_PRESETS,
  verifyCarpetsHearts,
  type CarpetsHeartsPreset,
} from '../logic/carpetsHearts';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const CarpetsHeartsView: React.FC<Props> = ({ explainMode }) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const activePreset: CarpetsHeartsPreset = CARPETS_HEARTS_PRESETS[selectedPresetIndex];

  const [hearts, setHearts] = useState<[number, number][]>(activePreset.defaultHearts);

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setHearts(CARPETS_HEARTS_PRESETS[index].defaultHearts);
  };

  const toggleHeart = (x: number, y: number) => {
    const exists = hearts.some(([hx, hy]) => hx === x && hy === y);
    if (exists) {
      setHearts(hearts.filter(([hx, hy]) => !(hx === x && hy === y)));
    } else {
      setHearts([...hearts, [x, y]]);
    }
  };

  const handleLoadWitness = () => {
    setHearts(activePreset.validWitness);
  };

  const handleClear = () => {
    setHearts([]);
  };

  const verification = verifyCarpetsHearts(activePreset, hearts);

  const isViolatingCell = (x: number, y: number): boolean => {
    return verification.adjacencyViolations.some(
      (v) => (v.p1[0] === x && v.p1[1] === y) || (v.p2[0] === x && v.p2[1] === y)
    );
  };

  return (
    <div className="tab-stage">
      {/* Header Banner */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <Heart size={32} className="text-rose" />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Parks Problem &bull; Star Battle Reduction</span>
            <span className="edu-hero-badge blue">Grid Non-Adjacency Exclusion</span>
            <span className="edu-hero-badge teal">{activePreset.badge}</span>
          </div>
          <h2 className="edu-hero-title">Carpets &amp; Hearts (Parks Problem Reduction)</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Explanation:</strong> Place exactly 1 Heart (❤️) in every row, column, and colored region,
                ensuring <strong>no two hearts touch</strong> (not even diagonally!). Variable tracks alternate between True and
                False slots. The Clause Room touches three literal tracks: if all three literals are False, their hearts crowd the
                doorway and leave <strong>zero legal spaces</strong> for the Clause Room's required heart!
              </>
            ) : (
              <>
                <strong>Rigorous Complexity Statement:</strong> Given an N &times; N grid partitioned into regions R_1, ..., R_N,
                decide whether there exists a subset of cells H &sube; V such that |H &cap; Row_i| = 1, |H &cap; Col_j| = 1,
                |H &cap; R_k| = 1 for all i,j,k, and dist_&infin;(h_1, h_2) &ge; 2 for all distinct h_1, h_2 &in; H.
                Polynomial-time verifier evaluates row, col, region, and 8-neighbourhood exclusion in O(N^2) time.
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
            <span className="card-title-text">Select Parks / Star-Battle Instance</span>
          </div>
        </div>
        <div className="preset-pill-row">
          {CARPETS_HEARTS_PRESETS.map((p, idx) => (
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

      {/* Workspace */}
      <div className="dungeon-workspace">
        {/* Left Panel: Interactive Board */}
        <div className="left-panel">
          <div className="hearts-board-wrapper">
            <div className="card-header-row">
              <div className="card-title-group">
                <Heart size={18} className="text-rose" />
                <span className="card-title-text">
                  Regional Grid ({activePreset.size} &times; {activePreset.size}) &bull; Target: {activePreset.quotaPerUnit} per row/col/region
                </span>
              </div>
              <div className="btn-group">
                <button className="neu-btn" onClick={handleLoadWitness} title="Load satisfying placement">
                  <Sparkles size={14} />
                  <span>Oracle Witness</span>
                </button>
                <button className="neu-btn" onClick={handleClear} title="Clear all placed hearts">
                  <RotateCcw size={14} />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Grid Board */}
            <div
              className="hearts-grid-board"
              style={{
                gridTemplateColumns: `repeat(${activePreset.size}, 1fr)`,
                maxWidth: `${activePreset.size * 60}px`,
              }}
            >
              {activePreset.grid.map((row, y) =>
                row.map((cell, x) => {
                  const hasHeart = hearts.some(([hx, hy]) => hx === x && hy === y);
                  const isViolating = hasHeart && isViolatingCell(x, y);

                  return (
                    <div
                      key={`${x},${y}`}
                      className={`hearts-cell ${hasHeart ? 'has-heart' : ''} ${
                        isViolating ? 'adjacent-violation' : ''
                      }`}
                      style={{
                        backgroundColor: `${cell.regionColor}33`,
                        borderColor: isViolating ? '#fb7185' : `${cell.regionColor}88`,
                      }}
                      onClick={() => toggleHeart(x, y)}
                      title={`Cell (${x}, ${y}) - Region ${cell.regionId}. Click to toggle heart.`}
                    >
                      {hasHeart && <span className="heart-token">❤️</span>}
                      {cell.label && <span className="hearts-cell-tag">{cell.label}</span>}
                    </div>
                  );
                })
              )}
            </div>

            <p className="hint-text" style={{ textAlign: 'center', marginTop: '8px' }}>
              Click any cell to place or remove a Heart (❤️). Adjacent hearts trigger pulsing red collision warnings!
            </p>

            {/* Region Legend */}
            <div style={{ marginTop: '16px' }}>
              <span className="section-subtitle">Partitioned Regions:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {activePreset.regions.map((r) => {
                  const count = verification.regionCounts[r.id] || 0;
                  const isOk = count === activePreset.quotaPerUnit;
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: `1px solid ${isOk ? 'rgba(45, 212, 191, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                        fontSize: '0.74rem',
                      }}
                    >
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          backgroundColor: r.color,
                        }}
                      />
                      <span>{r.name}:</span>
                      <strong style={{ color: isOk ? '#2dd4bf' : '#fb7185' }}>
                        {count} / {activePreset.quotaPerUnit}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Verifier Audit */}
        <div className="right-panel">
          <div className="verifier-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <Zap size={18} className="text-teal" />
                <span className="card-title-text">Deterministic Verifier Pipeline</span>
              </div>
              <span className="complexity-tag">O(N&sup2;)</span>
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
                      ? 'ACCEPT — Valid Independent Region Placement'
                      : 'REJECT — Placement Violations Detected'}
                  </h4>
                  <p className="verdict-subtext">
                    {verification.isValid
                      ? 'Every row, column, and region contains exactly 1 heart with zero 8-adjacency conflicts.'
                      : 'One or more row, column, region quotas or adjacency rules are unsatisfied.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Metrics */}
            <div className="audit-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Hearts Placed</span>
                <span className="metric-value">
                  {verification.totalHeartsPlaced} / {verification.expectedHearts}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Adjacency Conflicts</span>
                <span
                  className="metric-value"
                  style={{ color: verification.adjacencyViolations.length > 0 ? '#fb7185' : '#2dd4bf' }}
                >
                  {verification.adjacencyViolations.length}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Row / Col Errors</span>
                <span className="metric-value">
                  {verification.rowViolations.length + verification.colViolations.length}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Region Errors</span>
                <span className="metric-value">{verification.regionViolations.length}</span>
              </div>
            </div>

            {/* Violations breakdown */}
            {verification.adjacencyViolations.length > 0 && (
              <div className="violations-list" style={{ marginTop: '14px' }}>
                <span className="section-subtitle">Adjacency Violations (8-Neighbourhood):</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {verification.adjacencyViolations.map((v, idx) => (
                    <div
                      key={idx}
                      className="trace-entry invalid"
                      style={{ padding: '8px 10px', fontSize: '0.78rem' }}
                    >
                      Heart at ({v.p1[0]}, {v.p1[1]}) touches Heart at ({v.p2[0]}, {v.p2[1]})!
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parks Gadget Reduction Explanation */}
            <div className="gadget-walkthrough-card" style={{ marginTop: '18px' }}>
              <div className="gadget-title">
                <Code2 size={16} className="text-teal" />
                <span>Parks Reduction Gadget Architecture</span>
              </div>
              <div className="gadget-body">
                <p>
                  <strong>Variable Corridors:</strong> A 2-wide track forces hearts to alternate in parity slots.
                  Placing hearts in even positions encodes x_i = True; odd positions encode x_i = False.
                </p>
                <div className="math-callout">
                  Alternating Track &hArr; Exactly 2 maximal independent sets of size k
                </div>
                <p>
                  <strong>Clause Deadlock Gadget:</strong> The clause region borders literal tracks. If all 3 literals
                  are False, their hearts touch and eliminate all valid cells in the clause region, guaranteeing that
                  only satisfying 3-SAT assignments admit a valid Star Battle solution!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
