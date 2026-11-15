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
  /**
   * Embedded in the final-puzzle page, which supplies its own hero and section
   * headings. Skips the standalone hero and outer tab-stage padding.
   */
  embedded?: boolean;
}

export const HeartsMicrobesView: React.FC<Props> = ({ explainMode, embedded = false }) => {
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
    <div className={embedded ? 'final-embedded' : 'tab-stage'}>
      {/* Hero Header — suppressed when embedded in the final-puzzle view */}
      {!embedded && (
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <Heart size={32} className="text-rose" />
        </div>
        <div className="edu-hero-text">
          <h2 className="edu-hero-title">Grid-Organ (Hearts)</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman version.</strong> Place microbes on the grid. Their bodies may overlap, but
                no microbe may touch another microbe&apos;s organ. Cover at least k tiles.
              </>
            ) : (
              <>
                <strong>Rigorous Problem Formulation:</strong> Given an integer lattice grid <em>G = [0..N-1] &times; [0..M-1] &subset; &Zopf;&sup2;</em> and a collection <em>C</em> of connected polyominoes <em>A = (T(A), O(A))</em> where <em>T(A) &subset; G</em> is 4-connected and <em>O(A) &sube; T(A)</em> denotes vital organ coordinates, select <em>B &sube; C</em> such that <em>&forall; A, A&prime; &in; B, A &ne; A&prime;: O(A) &cap; T(A&prime;) = &empty;</em> and <em>|&cup;&lsaquo;A &in; B&rsaquo; T(A)| &ge; k</em>. Deterministic polynomial verifier executes in <em>O(|B|&sup2; &middot; |T|)</em> operations.
              </>
            )}
          </p>
        </div>
      </div>
      )}

      {/* Preset Selector */}
      <div className="card-neu preset-card">
        <div className="card-header-row">
          <div className="card-title-group">
            <Sparkles size={18} className="text-amber" />
            <span className="card-title-text">Preset</span>
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
                  Board ({activePreset.width} &times; {activePreset.height}) &bull; Target Coverage: &ge; {activePreset.targetCoveredTilesMin} tiles
                </span>
              </div>
              <div className="btn-group">
                <button className="neu-btn" onClick={handleLoadWitness} title="Load verified non-colliding colony">
                  <Sparkles size={14} />
                  <span>Load solution</span>
                </button>
                <button className="neu-btn" onClick={handleClear} title="Clear all microbes">
                  <RotateCcw size={14} />
                  <span>Clear</span>
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
              Microbes may overlap on body cells. No microbe may touch another microbe&apos;s organ.
              A collision turns the organ red.
            </p>

            {/* Available Blobs Selector */}
            <div style={{ marginTop: '16px' }}>
              <span className="section-subtitle">
                Available microbes (|C| = {activePreset.availableBlobs.length}):
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
                <span className="card-title-text">Verifier</span>
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
                      ? 'ACCEPT — organs protected'
                      : 'REJECT — organ collision'}
                  </h4>
                  <p className="verdict-subtext">
                    {verification.isValid
                      ? 'No organ overlap, and the coverage quota is met.'
                      : verification.organCollisions.length > 0
                      ? `${verification.organCollisions.length} organ(s) overlap another microbe.`
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
                <span className="section-subtitle">Collisions:</span>
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
                  {`∀ A, A′ ∈ B, A ≠ A′:  O(A) ∩ T(A′) = ∅
Bodies may share tiles; organs may not.`}
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
