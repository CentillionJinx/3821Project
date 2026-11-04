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
  MICROBES_PRESETS,
  verifyMicrobes,
  type MicrobesPreset,
  type MicrobeBlob,
} from '../logic/heartsMicrobes';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const HeartsMicrobesView: React.FC<Props> = ({ explainMode }) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const activePreset: MicrobesPreset = MICROBES_PRESETS[selectedPresetIndex];

  const [selectedBlobIds, setSelectedBlobIds] = useState<string[]>(
    activePreset.defaultSelected
  );

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    setSelectedBlobIds(MICROBES_PRESETS[idx].defaultSelected);
  };

  const toggleBlob = (id: string) => {
    if (selectedBlobIds.includes(id)) {
      setSelectedBlobIds(selectedBlobIds.filter((bId) => bId !== id));
    } else {
      setSelectedBlobIds([...selectedBlobIds, id]);
    }
  };

  const handleLoadWitness = () => {
    setSelectedBlobIds(activePreset.satisfyingWitness);
  };

  const handleClear = () => {
    setSelectedBlobIds([]);
  };

  const verification = verifyMicrobes(activePreset, selectedBlobIds);

  // Helper to find which blob owns a tile
  const activeBlobs = activePreset.availableBlobs.filter((b) =>
    selectedBlobIds.includes(b.id)
  );

  return (
    <div className="tab-stage">
      {/* Hero Header */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <Heart size={32} className="text-rose" />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Team Discussion Original Candidate</span>
            <span className="edu-hero-badge blue">Discrete N &times; M Grid &bull; Connected Polyominoes</span>
            <span className="edu-hero-badge teal">Vital Organ Non-Overlap Invariant</span>
            <span className="edu-hero-badge amber">{activePreset.badge}</span>
          </div>
          <h2 className="edu-hero-title">&ldquo;Hearts&rdquo; // &ldquo;Microbes&rdquo; &mdash; Grid Polyominoes &amp; Delicate Vital Organs</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Overview:</strong> On a discrete <em>N &times; M</em> tile grid, we have a collection of microbes (connected grid polyominoes) with designated vital organ cells (marked with &hearts;).
                Microbes can freely overlap on standard body cells, <strong>BUT no microbe can overlap or touch any cell containing another microbe's vital organ!</strong> Can you position the polyominoes to satisfy the grid coverage quota without crushing any vital organs?
              </>
            ) : (
              <>
                <strong>Rigorous Problem Formulation:</strong> Given an integer lattice grid <em>G = [0..N-1] &times; [0..M-1] &subset; &Zopf;&sup2;</em> and a collection <em>C</em> of connected polyominoes <em>A = (T(A), O(A))</em> where <em>T(A) &subset; G</em> is 4-connected and <em>O(A) &sube; T(A)</em> denotes vital organ coordinates, select <em>B &sube; C</em> such that <em>&forall; A &ne; B &in; B: O(A) &cap; T(B) = &empty;</em> and <em>|&cup;&lsaquo;A &in; B&rsaquo; T(A)| &ge; k</em>. Deterministic polynomial verifier executes in <em>O(|B|&sup2; &middot; |T|)</em> operations.
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
            <span className="card-title-text">Select Microbes Instance</span>
          </div>
        </div>
        <div className="preset-pill-row">
          {MICROBES_PRESETS.map((p, idx) => (
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
        {/* Left Column: Petri Dish Board */}
        <div className="left-panel">
          <div className="card-neu">
            <div className="card-header-row">
              <div className="card-title-group">
                <Heart size={18} className="text-rose" />
                <span className="card-title-text">
                  Petri Dish Grid ({activePreset.width} &times; {activePreset.height}) &bull; Target Coverage: &ge; {activePreset.targetCoveredTilesMin} tiles
                </span>
              </div>
              <div className="btn-group">
                <button className="neu-btn" onClick={handleLoadWitness} title="Load verified non-colliding colony">
                  <Sparkles size={14} />
                  <span>Oracle Witness</span>
                </button>
                <button className="neu-btn" onClick={handleClear} title="Clear all microbes">
                  <RotateCcw size={14} />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Grid Board */}
            <div
              className="microbe-board-grid"
              style={{
                gridTemplateColumns: `repeat(${activePreset.width}, 1fr)`,
                maxWidth: `${activePreset.width * 60}px`,
                marginTop: '14px',
              }}
            >
              {Array.from({ length: activePreset.height }).map((_, y) =>
                Array.from({ length: activePreset.width }).map((__, x) => {
                  const key = `${x},${y}`;
                  const coveringBlobs = activeBlobs.filter((b) =>
                    b.tiles.some((t) => t.x === x && t.y === y)
                  );
                  const organTiles = activeBlobs.flatMap((b) =>
                    b.tiles.filter((t) => t.x === x && t.y === y && t.isOrgan)
                  );
                  const isOrgan = organTiles.length > 0;
                  const isCollision = verification.organCollisions.some(
                    (c) => c.victimOrganTile.x === x && c.victimOrganTile.y === y
                  );

                  return (
                    <div
                      key={key}
                      className={`microbe-grid-tile ${isOrgan ? 'has-organ' : ''} ${
                        isCollision ? 'organ-collision' : ''
                      }`}
                      style={{
                        backgroundColor:
                          coveringBlobs.length > 0
                            ? `${coveringBlobs[0].color}44`
                            : undefined,
                        borderColor: isCollision ? '#fb7185' : undefined,
                      }}
                      title={`Grid Tile (${x}, ${y}): ${
                        coveringBlobs.length > 0
                          ? `Covered by [${coveringBlobs.map((b) => b.name).join(', ')}]`
                          : 'Empty'
                      }${isOrgan ? ' [VITAL ORGAN ❤️]' : ''}${isCollision ? ' [CRUSHED BY ANOTHER BLOB!]' : ''}`}
                    >
                      <span className="microbe-grid-coord">{x},{y}</span>
                      {isOrgan && <span className="organ-heart-icon">❤️</span>}
                      {coveringBlobs.length > 0 && !isOrgan && (
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                          {coveringBlobs.length}x
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="hint-text" style={{ textAlign: 'center', marginTop: '10px' }}>
              Microbes are 4-connected grid polyominoes on &Zopf;&sup2;. They can freely overlap on regular body cells. But if another microbe touches a Vital Organ (❤️),
              it triggers an immediate pulsing red collision failure!
            </p>

            {/* Available Blobs Selector */}
            <div style={{ marginTop: '16px' }}>
              <span className="section-subtitle">
                Available Connected Polyominoes (|C| = {activePreset.availableBlobs.length}):
              </span>
              <div className="xor-squares-selector-grid" style={{ marginTop: '8px' }}>
                {activePreset.availableBlobs.map((blob: MicrobeBlob) => {
                  const isActive = selectedBlobIds.includes(blob.id);
                  const organCount = blob.tiles.filter((t) => t.isOrgan).length;

                  return (
                    <div
                      key={blob.id}
                      className={`xor-square-card ${isActive ? 'active' : ''}`}
                      onClick={() => toggleBlob(blob.id)}
                      style={{ borderLeft: `4px solid ${blob.color}` }}
                    >
                      <div className="xor-square-info">
                        <span className="xor-square-name">{blob.name}</span>
                        <span className="xor-square-dims">
                          Polyomino: {blob.tiles.length} cells ({organCount} ❤️ organ)
                        </span>
                        <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Cells: {blob.tiles.map(t => `(${t.x},${t.y})${t.isOrgan ? '❤️' : ''}`).join(', ')}
                        </div>
                        {blob.description && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {blob.description}
                          </span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => {}}
                        aria-label={`Toggle ${blob.name}`}
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
                <span className="card-title-text">Organ Non-Overlap Verifier</span>
              </div>
              <span className="complexity-tag">O(|B|&sup2; &middot; |T|)</span>
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
                      ? 'ACCEPT — All Vital Organs Protected'
                      : 'REJECT — Organ Collision Detected!'}
                  </h4>
                  <p className="verdict-subtext">
                    {verification.isValid
                      ? 'Every vital organ is 100% free of external tile overlap, and coverage quota is satisfied.'
                      : verification.organCollisions.length > 0
                      ? `${verification.organCollisions.length} vital organ(s) crushed by another microbe!`
                      : `Coverage too low: only ${verification.totalUniqueTilesCovered}/${verification.targetCoveredTilesMin} tiles covered.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="audit-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Organs Intact</span>
                <span
                  className="metric-value"
                  style={{
                    color: verification.organCollisions.length > 0 ? '#fb7185' : '#2dd4bf',
                  }}
                >
                  {verification.organIntactCount} / {verification.totalOrgansActive}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Tiles Covered</span>
                <span
                  className="metric-value"
                  style={{
                    color: verification.isCoverageMet ? '#2dd4bf' : '#fbbf24',
                  }}
                >
                  {verification.totalUniqueTilesCovered} / {verification.targetCoveredTilesMin}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Active Blobs</span>
                <span className="metric-value">{verification.selectedBlobCount}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Runtime Ops</span>
                <span className="metric-value">{verification.operationsCount}</span>
              </div>
            </div>

            {/* Collision Breakdown */}
            {verification.organCollisions.length > 0 && (
              <div className="violations-list" style={{ marginTop: '14px' }}>
                <span className="section-subtitle">Organ Collision Warnings:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {verification.organCollisions.map((col, idx) => (
                    <div
                      key={idx}
                      className="trace-entry invalid"
                      style={{ padding: '8px 10px', fontSize: '0.78rem' }}
                    >
                      Organ ❤️ of <strong>{col.victimBlobId}</strong> at ({col.victimOrganTile.x}, {col.victimOrganTile.y}) was crushed by tile of <strong>{col.crushingBlobId}</strong>!
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Formulation Box */}
            <div className="gadget-walkthrough-card" style={{ marginTop: '16px' }}>
              <div className="gadget-title">
                <Code2 size={16} className="text-teal" />
                <span>Team Discussion Formulation</span>
              </div>
              <div className="gadget-body">
                <div className="latex-snippet-block">
                  {`\\forall A, B \\in B, A \\neq B \\implies O(A) \\cap T(B) = \\emptyset\n` +
                   `Blobs can overlap on T(A) \\cap T(B), but vital organs O(A) are sacrosanct.`}
                </div>
                <p style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <strong>Gadget Construction:</strong> The organ acts as a one-way inhibitor lock.
                  Body extensions act as wires carrying truth values across the grid without cross-contamination.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
