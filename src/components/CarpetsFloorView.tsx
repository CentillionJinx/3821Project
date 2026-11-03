import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Code2,
} from 'lucide-react';
import {
  CARPETS_PRESETS,
  verifyCarpets,
  type CarpetsPreset,
  type CarpetDef,
} from '../logic/carpetsFloor';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const CarpetsFloorView: React.FC<Props> = ({ explainMode }) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const activePreset: CarpetsPreset = CARPETS_PRESETS[selectedPresetIndex];

  const [selectedCarpetIds, setSelectedCarpetIds] = useState<string[]>(
    activePreset.defaultSelected
  );

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    setSelectedCarpetIds(CARPETS_PRESETS[idx].defaultSelected);
  };

  const toggleCarpet = (id: string) => {
    if (selectedCarpetIds.includes(id)) {
      setSelectedCarpetIds(selectedCarpetIds.filter((cId) => cId !== id));
    } else {
      setSelectedCarpetIds([...selectedCarpetIds, id]);
    }
  };

  const handleLoadWitness = () => {
    setSelectedCarpetIds(activePreset.satisfyingWitness);
  };

  const handleClear = () => {
    setSelectedCarpetIds([]);
  };

  const verification = verifyCarpets(activePreset, selectedCarpetIds);

  return (
    <div className="tab-stage">
      {/* Hero Header */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <Layers size={32} className="text-blue" />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Team Discussion Original Candidate</span>
            <span className="edu-hero-badge blue">Grid Multiplicity &amp; Unique Cover</span>
            <span className="edu-hero-badge teal">{activePreset.badge}</span>
          </div>
          <h2 className="edu-hero-title">&ldquo;Carpets&rdquo; &mdash; Floor Repair Multiplicity Puzzle</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Overview:</strong> We get a bunch of grid-aligned carpets and want to cover the grid with them.
                We don't want to waste carpets, so <strong>each carpet must cover at least one tile uniquely</strong>. Some parts
                of the floor are damaged, so we want to cover those parts with more carpets (target v(t)). Can you find an arrangement
                of carpets that covers the floor fully and satisfies our engineers?
              </>
            ) : (
              <>
                <strong>Rigorous Problem Formulation:</strong> Given grid G = N &times; M, candidate carpet collection C,
                and target multiplicity function v: G &rarr; &#8469;, select B &sube; C such that &cup;_(S &in; B) S = G,
                mult_M(t) = v(t) for all target tiles, and &forall; Q &in; B, &exist; t &in; Q with mult_M(t) = 1.
                Deterministic polynomial verifier runs in O(|B| &middot; |S| + NM) time.
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
            <span className="card-title-text">Select Carpets Instance / Variation</span>
          </div>
        </div>
        <div className="preset-pill-row">
          {CARPETS_PRESETS.map((p, idx) => (
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

      {/* Main Workspace */}
      <div className="dungeon-workspace">
        {/* Left Column: Interactive Floor Board */}
        <div className="left-panel">
          <div className="card-neu">
            <div className="card-header-row">
              <div className="card-title-group">
                <Layers size={18} className="text-teal" />
                <span className="card-title-text">
                  Floor Grid ({activePreset.width} &times; {activePreset.height}) {activePreset.isToroidal ? '&bull; Toroidal Wrap' : ''}
                </span>
              </div>
              <div className="btn-group">
                <button className="neu-btn" onClick={handleLoadWitness} title="Load satisfying carpet arrangement">
                  <Sparkles size={14} />
                  <span>Oracle Witness</span>
                </button>
                <button className="neu-btn" onClick={handleClear} title="Remove all carpets">
                  <RotateCcw size={14} />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Floor Grid Board */}
            <div
              className="carpet-floor-board"
              style={{
                gridTemplateColumns: `repeat(${activePreset.width}, 1fr)`,
                maxWidth: `${activePreset.width * 62}px`,
                marginTop: '14px',
              }}
            >
              {Array.from({ length: activePreset.height }).map((_, y) =>
                Array.from({ length: activePreset.width }).map((__, x) => {
                  const key = `${x},${y}`;
                  const mult = verification.tileMultiplicities[key] || 0;
                  const tileConfig = activePreset.tiles.find((t) => t.x === x && t.y === y);
                  const target = tileConfig?.targetValue ?? null;
                  const isViolated = target !== null && mult !== target;
                  const isSatisfied = target !== null && mult === target;
                  const isUniqueForAny = Object.values(verification.carpetUniqueTiles).some(
                    (arr) => arr.some((t) => t.x === x && t.y === y)
                  );

                  return (
                    <div
                      key={key}
                      className={`carpet-tile ${mult > 0 ? 'covered' : ''} ${
                        isSatisfied ? 'target-satisfied' : ''
                      } ${isViolated ? 'target-violated' : ''} ${
                        isUniqueForAny ? 'uniquely-covered' : ''
                      }`}
                      title={`Tile (${x}, ${y}): ${mult} layer(s)${
                        target !== null ? ` (Target v = ${target})` : ''
                      }${isUniqueForAny ? ' [Uniquely covered for a carpet]' : ''}`}
                    >
                      {tileConfig?.label && (
                        <span className="carpet-tile-badge">{tileConfig.label}</span>
                      )}
                      <span className="cell-count-text">{mult}</span>
                      {target !== null && (
                        <span className="carpet-tile-target">v={target}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="hint-text" style={{ textAlign: 'center', marginTop: '10px' }}>
              Numbers show current carpet layers mult(t). Cyan border = Target matched! Red = Multiplicity error.
              Yellow dashed outline = Uniquely covered tile (satisfies Constraint 3).
            </p>

            {/* Available Carpets Selector */}
            <div style={{ marginTop: '16px' }}>
              <span className="section-subtitle">
                Available Carpets (|C| = {activePreset.availableCarpets.length}):
              </span>
              <div className="xor-squares-selector-grid" style={{ marginTop: '8px' }}>
                {activePreset.availableCarpets.map((carpet: CarpetDef) => {
                  const isActive = selectedCarpetIds.includes(carpet.id);
                  const uniqueCount = verification.carpetUniqueTiles[carpet.id]?.length ?? 0;
                  const isWasted = isActive && uniqueCount === 0;

                  return (
                    <div
                      key={carpet.id}
                      className={`xor-square-card ${isActive ? 'active' : ''}`}
                      onClick={() => toggleCarpet(carpet.id)}
                      style={{
                        borderLeft: `4px solid ${carpet.color}`,
                        borderColor: isWasted ? '#fb7185' : undefined,
                      }}
                    >
                      <div className="xor-square-info">
                        <span className="xor-square-name">{carpet.name}</span>
                        <span className="xor-square-dims">
                          {carpet.tiles.length} tiles &bull; {isActive ? `${uniqueCount} unique tiles` : 'Inactive'}
                        </span>
                        {isWasted && (
                          <span style={{ color: '#fb7185', fontSize: '0.68rem', fontWeight: 700 }}>
                            &bull; WASTED CARPET (0 unique tiles)
                          </span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => {}}
                        aria-label={`Toggle ${carpet.name}`}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verifier Audit & Metrics */}
        <div className="right-panel">
          <div className="verifier-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <Zap size={18} className="text-teal" />
                <span className="card-title-text">Carpets Deterministic Verifier</span>
              </div>
              <span className="complexity-tag">O(|B| &middot; |S| + NM)</span>
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
                      ? 'ACCEPT — Valid Floor Carpet Arrangement'
                      : 'REJECT — Constraint Violations'}
                  </h4>
                  <p className="verdict-subtext">
                    {verification.isValid
                      ? 'Whole floor covered, all target multiplicities matched, and every carpet is uniquely utilized!'
                      : !verification.isFullyCovered
                      ? `${verification.uncoveredTiles.length} tile(s) uncovered.`
                      : verification.wastedCarpets.length > 0
                      ? `${verification.wastedCarpets.length} carpet(s) wasted (no unique tile).`
                      : `${verification.multiplicityViolations.length} multiplicity error(s).`}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="audit-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Floor Covered</span>
                <span className="metric-value">
                  {verification.coveredTilesCount} / {verification.totalTiles}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Multiplicity Errors</span>
                <span
                  className="metric-value"
                  style={{ color: verification.multiplicityViolations.length > 0 ? '#fb7185' : '#2dd4bf' }}
                >
                  {verification.multiplicityViolations.length}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Wasted Carpets</span>
                <span
                  className="metric-value"
                  style={{ color: verification.wastedCarpets.length > 0 ? '#fb7185' : '#2dd4bf' }}
                >
                  {verification.wastedCarpets.length}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Runtime Ops</span>
                <span className="metric-value">{verification.operationsCount}</span>
              </div>
            </div>

            {/* Team LaTeX Spec Box */}
            <div className="gadget-walkthrough-card" style={{ marginTop: '16px' }}>
              <div className="gadget-title">
                <Code2 size={16} className="text-teal" />
                <span>Team Discussion Formal Formulation</span>
              </div>
              <div className="gadget-body">
                <div className="latex-snippet-block">
                  {`Let M be the multiset from additive union of all S in B.\n` +
                   `1. \\bigcup_{S \\in B} S = G (Whole grid covered)\n` +
                   `2. \\forall t \\in G: \\text{mult}_M(t) = v(t) (Target overlap)\n` +
                   `3. \\forall Q \\in B, \\exists t \\in Q: \\text{mult}_M(t) = 1 (No waste)`}
                </div>
                <p style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <strong>Theoretical Role:</strong> Constraint 3 prevents padding reductions with empty/useless carpets,
                  making Carpets NP-complete via direct reduction from Exact Cover by 3-Sets (X3C) or 3-SAT.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
