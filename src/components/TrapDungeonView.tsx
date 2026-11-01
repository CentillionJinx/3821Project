import React, { useState } from 'react';
import {
  Route,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  TRAP_DUNGEON_PRESETS,
  verifyTrapPath,
  compile3SatToTrapDungeon,
  type TrapDungeonPreset,
} from '../logic/candidates';
import { SAMPLE_FORMULAS } from '../logic/verifier';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const TrapDungeonView: React.FC<Props> = ({ explainMode }) => {
  const [trapPresetIdx, setTrapPresetIdx] = useState<number>(0);
  const currentTrapPreset: TrapDungeonPreset =
    trapPresetIdx === -1
      ? compile3SatToTrapDungeon(SAMPLE_FORMULAS[0].formula, { x1: true, x2: false, x3: true })
      : TRAP_DUNGEON_PRESETS[trapPresetIdx];

  const [trapCandidatePath, setTrapCandidatePath] = useState<string[]>(
    currentTrapPreset.validWitnessPath
  );

  const handleSelectTrapPreset = (idx: number) => {
    setTrapPresetIdx(idx);
    if (idx === -1) {
      const dyn = compile3SatToTrapDungeon(SAMPLE_FORMULAS[0].formula, { x1: true, x2: false, x3: true });
      setTrapCandidatePath(dyn.validWitnessPath);
    } else {
      setTrapCandidatePath(TRAP_DUNGEON_PRESETS[idx].validWitnessPath);
    }
  };

  const handleClickTrapRoom = (roomId: string) => {
    setTrapCandidatePath((prev) => {
      if (prev.length > 1 && prev[prev.length - 1] === roomId) {
        return prev.slice(0, -1);
      }
      if (prev.includes(roomId)) {
        const idx = prev.indexOf(roomId);
        return prev.slice(0, idx + 1);
      }
      return [...prev, roomId];
    });
  };

  const trapVerification = verifyTrapPath(currentTrapPreset, trapCandidatePath);

  return (
    <div className="tab-stage">
      {/* Hero Header */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <Route size={32} />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Original NP-Complete Puzzle Candidate</span>
            <span className="edu-hero-badge blue">Directed Trap DAG &amp; Portcullis Traversal</span>
            <span className="edu-hero-badge teal">{currentTrapPreset.badge}</span>
          </div>
          <h2 className="edu-hero-title">3-SAT Trap Dungeon (Switch &amp; Trap Traversal)</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Overview:</strong> Navigate through a dungeon visiting every single room without getting trapped!
                Entering a room locks it behind you and fires laser triggers to disable other rooms. Variable diamond rooms
                force you to pick True or False paths to reach the clause exit safely.
              </>
            ) : (
              <>
                <strong>Rigorous Complexity Statement:</strong> Given undirected navigation graph G = (V, E) and directed
                trap arcs D &sube; V &times; V, decide whether there exists a Hamiltonian path &pi; such that no step
                violates the topological order imposed by D. Verified deterministically in O(|V| + |D|) operations.
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
            <span className="card-title-text">Select Dungeon Instance / Gadget Preset</span>
          </div>
        </div>
        <div className="preset-pill-row">
          {TRAP_DUNGEON_PRESETS.map((p, idx) => (
            <button
              key={p.id}
              className={`preset-pill ${trapPresetIdx === idx ? 'active' : ''}`}
              onClick={() => handleSelectTrapPreset(idx)}
            >
              <span>{p.name}</span>
              <span className="pill-badge">{p.badge}</span>
            </button>
          ))}
          <button
            className={`preset-pill ${trapPresetIdx === -1 ? 'active' : ''}`}
            onClick={() => handleSelectTrapPreset(-1)}
          >
            <span>Live Compiled from 3-SAT &phi;</span>
            <span className="pill-badge">Dynamic</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="dungeon-workspace">
        {/* Left Column: Interactive SVG Graph */}
        <div className="left-panel">
          <div className="neu-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title-text">{currentTrapPreset.name}</h3>
                <span className="text-muted text-xs">
                  Click rooms in order to construct path &pi;. Click current room to undo.
                </span>
              </div>
              <div className="btn-group">
                <button
                  className="neu-btn"
                  onClick={() => setTrapCandidatePath(currentTrapPreset.validWitnessPath)}
                >
                  <Sparkles size={14} />
                  <span>Oracle Witness</span>
                </button>
                <button
                  className="neu-btn"
                  onClick={() => setTrapCandidatePath([currentTrapPreset.nodes[0].id])}
                >
                  <RotateCcw size={14} />
                  <span>Restart at Entry</span>
                </button>
              </div>
            </div>

            {/* SVG Graph Canvas */}
            <div className="trap-graph-canvas-wrap" style={{ marginTop: '14px' }}>
              <svg viewBox="0 0 760 380" className="trap-graph-svg">
                <defs>
                  <marker
                    id="trap-arrow"
                    viewBox="0 0 10 10"
                    refX="28"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#fb7185" />
                  </marker>
                </defs>

                {/* Navigation Edges */}
                {currentTrapPreset.edges.map(([u, v], eIdx) => {
                  const n1 = currentTrapPreset.nodes.find((n) => n.id === u);
                  const n2 = currentTrapPreset.nodes.find((n) => n.id === v);
                  if (!n1 || !n2) return null;

                  let isTraversed = false;
                  for (let i = 0; i < trapCandidatePath.length - 1; i++) {
                    if (
                      (trapCandidatePath[i] === u && trapCandidatePath[i + 1] === v) ||
                      (trapCandidatePath[i] === v && trapCandidatePath[i + 1] === u)
                    ) {
                      isTraversed = true;
                      break;
                    }
                  }

                  return (
                    <line
                      key={`e-${eIdx}`}
                      x1={n1.x}
                      y1={n1.y}
                      x2={n2.x}
                      y2={n2.y}
                      className={`corridor-edge ${isTraversed ? 'edge-traversed' : ''}`}
                    />
                  );
                })}

                {/* Directed Trap Trigger Edges */}
                {currentTrapPreset.trapEdges.map((tEdge, tIdx) => {
                  const n1 = currentTrapPreset.nodes.find((n) => n.id === tEdge.from);
                  const n2 = currentTrapPreset.nodes.find((n) => n.id === tEdge.to);
                  if (!n1 || !n2) return null;

                  const isFired = trapCandidatePath.includes(tEdge.from);
                  const midX = (n1.x + n2.x) / 2;
                  const midY = (n1.y + n2.y) / 2 - 36;

                  return (
                    <g key={`trap-${tIdx}`}>
                      <path
                        d={`M ${n1.x} ${n1.y} Q ${midX} ${midY} ${n2.x} ${n2.y}`}
                        fill="none"
                        markerEnd="url(#trap-arrow)"
                        className={`trap-trigger-edge ${isFired ? 'trap-edge-fired' : ''}`}
                      />
                      <text x={midX} y={midY - 4} className="trap-edge-label">
                        trap ({tEdge.from}&rarr;{tEdge.to})
                      </text>
                    </g>
                  );
                })}

                {/* Room Vertices */}
                {currentTrapPreset.nodes.map((node) => {
                  const stepIdx = trapCandidatePath.indexOf(node.id);
                  const isVisited = stepIdx !== -1;
                  const isCurrentHead =
                    trapCandidatePath[trapCandidatePath.length - 1] === node.id;
                  const trappedByRoom = trapVerification.activeTrappedRooms[node.id];
                  const stepTrace = trapVerification.stepTraces.find((s) => s.roomId === node.id);
                  const steppedIntoTrap = Boolean(stepTrace?.wasAlreadyTrapped);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="room-node-group"
                      onClick={() => handleClickTrapRoom(node.id)}
                    >
                      <circle
                        r={30}
                        className={`room-circle ${
                          steppedIntoTrap
                            ? 'room-violated'
                            : isCurrentHead
                            ? 'room-head'
                            : isVisited
                            ? 'room-visited'
                            : trappedByRoom
                            ? 'room-trapped-unvisited'
                            : 'room-open'
                        }`}
                      />
                      <text y={-3} className="room-id-text">
                        {node.label}
                      </text>
                      <text y={14} className="room-sub-text">
                        {node.sublabel}
                      </text>
                      {isVisited && (
                        <g transform="translate(22, -22)">
                          <circle r={11} className="step-order-badge" />
                          <text y={4} className="step-order-text">
                            {stepIdx + 1}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Path Breadcrumb */}
            <div style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Current Path &pi;:</strong>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-teal)' }}>
                {trapCandidatePath.join(' &rarr; ') || '(Empty)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Verifier Audit & Metrics */}
        <div className="right-panel">
          <div className="verifier-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <Zap size={18} className="text-teal" />
                <span className="card-title-text">Theorem 2 Verifier Pipeline</span>
              </div>
              <span className="complexity-tag">O(|V| + |D|)</span>
            </div>

            {/* Verdict Box */}
            <div className={`verdict-box ${trapVerification.isValid ? 'accept' : 'reject'}`}>
              <div className="verdict-icon-row">
                {trapVerification.isValid ? (
                  <CheckCircle2 size={24} className="text-teal" />
                ) : (
                  <AlertTriangle size={24} className="text-rose" />
                )}
                <div>
                  <h4 className="verdict-heading">
                    {trapVerification.isValid ? 'ACCEPT — Valid Hamiltonian Path' : 'REJECT — Invalid Traversal'}
                  </h4>
                  <p className="verdict-subtext">
                    {trapVerification.isValid
                      ? 'All rooms visited exactly once with zero trap trigger collisions.'
                      : trapVerification.failureReason}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="audit-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Rooms Visited</span>
                <span className="metric-value">
                  {trapVerification.visitedCount} / {trapVerification.totalVertices}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Adjacency</span>
                <span
                  className="metric-value"
                  style={{ color: trapVerification.isAdjacencyValid ? '#2dd4bf' : '#fb7185' }}
                >
                  {trapVerification.isAdjacencyValid ? 'VALID' : 'VIOLATED'}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Trap Free?</span>
                <span
                  className="metric-value"
                  style={{ color: trapVerification.isTrapFree ? '#2dd4bf' : '#fb7185' }}
                >
                  {trapVerification.isTrapFree ? 'YES' : 'TRAPPED!'}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Runtime Ops</span>
                <span className="metric-value">{trapVerification.operationsCount}</span>
              </div>
            </div>

            {/* Step Trace */}
            <div style={{ marginTop: '14px' }}>
              <span className="section-subtitle">Sequential Trap Marking Trace:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {trapVerification.stepTraces.map((st) => (
                  <div
                    key={st.stepIndex}
                    className={`trace-entry ${st.wasAlreadyTrapped || !st.wasAdjacentToPrev ? 'invalid' : 'valid'}`}
                    style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                  >
                    <span>Step {st.stepIndex}: {st.roomLabel} &bull;</span>
                    {st.wasAlreadyTrapped ? (
                      <span className="text-rose"> Trapped by {st.trappedByEarlierRoom}!</span>
                    ) : !st.wasAdjacentToPrev ? (
                      <span className="text-rose"> Non-adjacent move!</span>
                    ) : (
                      <span className="text-teal"> OK</span>
                    )}
                    {st.newlyTrappedRooms.length > 0 && (
                      <span className="text-muted"> &rarr; Triggered trap on [{st.newlyTrappedRooms.join(', ')}]</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
