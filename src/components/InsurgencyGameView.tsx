import React, { useState } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import {
  INSURGENCY_PRESETS,
  simulateInsurgencyDay,
  type InsurgencyPreset,
  type DaySimulationRecord,
} from '../logic/insurgencyGame';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const InsurgencyGameView: React.FC<Props> = ({ explainMode }) => {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const activePreset: InsurgencyPreset = INSURGENCY_PRESETS[selectedPresetIdx];

  // Simulation state
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [armyHistory, setArmyHistory] = useState<string[]>([]);
  const [records, setRecords] = useState<DaySimulationRecord[]>([]);

  // Node weights state: -1 (Army/pacified), 0 (Peaceful), 1 (Simmering), 2 (Active Insurgent)
  const [nodeWeights, setNodeWeights] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const n of activePreset.nodes) {
      init[n.id] = activePreset.initialInsurgentIds.includes(n.id) ? 2 : 0;
    }
    return init;
  });

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    const p = INSURGENCY_PRESETS[idx];
    setCurrentDay(0);
    setArmyHistory([]);
    setRecords([]);
    const init: Record<string, number> = {};
    for (const n of p.nodes) {
      init[n.id] = p.initialInsurgentIds.includes(n.id) ? 2 : 0;
    }
    setNodeWeights(init);
  };

  const handleDeployArmyToNode = (targetNodeId: string) => {
    if (currentDay >= activePreset.totalDays) return;
    if (armyHistory.includes(targetNodeId)) return; // Army cannot revisit

    const nextDay = currentDay + 1;
    const { newWeights, newVisited, record } = simulateInsurgencyDay(
      activePreset,
      nodeWeights,
      armyHistory,
      targetNodeId,
      nextDay
    );

    setNodeWeights(newWeights);
    setArmyHistory(newVisited);
    setRecords((prev) => [...prev, record]);
    setCurrentDay(nextDay);
  };

  const handleReset = () => {
    setCurrentDay(0);
    setArmyHistory([]);
    setRecords([]);
    const init: Record<string, number> = {};
    for (const n of activePreset.nodes) {
      init[n.id] = activePreset.initialInsurgentIds.includes(n.id) ? 2 : 0;
    }
    setNodeWeights(init);
  };

  const handleAutoSolve = () => {
    handleReset();
    let weights: Record<string, number> = {};
    for (const n of activePreset.nodes) {
      weights[n.id] = activePreset.initialInsurgentIds.includes(n.id) ? 2 : 0;
    }
    let visited: string[] = [];
    const simRecords: DaySimulationRecord[] = [];

    for (let day = 1; day <= activePreset.totalDays; day++) {
      const target = activePreset.optimalArmyStrategy[day - 1] || activePreset.nodes[0].id;
      const res = simulateInsurgencyDay(activePreset, weights, visited, target, day);
      weights = res.newWeights;
      visited = res.newVisited;
      simRecords.push(res.record);
    }

    setNodeWeights(weights);
    setArmyHistory(visited);
    setRecords(simRecords);
    setCurrentDay(activePreset.totalDays);
  };

  // Compute current total positive weight
  let currentTotalWeight = 0;
  for (const nid of Object.keys(nodeWeights)) {
    const w = nodeWeights[nid] || 0;
    if (w > 0) currentTotalWeight += w;
  }

  const isGameOver = currentDay >= activePreset.totalDays;
  const isWon = isGameOver && currentTotalWeight <= activePreset.targetMaxWeight;

  return (
    <div className="tab-stage">
      {/* Hero Header */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <ShieldAlert size={32} className="text-amber" />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Team Discussion Original Candidate</span>
            <span className="edu-hero-badge blue">Firefighter NP-Hard Variant</span>
            <span className="edu-hero-badge teal">{activePreset.badge}</span>
          </div>
          <h2 className="edu-hero-title">&ldquo;Quell the Insurgency&rdquo; &mdash; Dictator vs Insurgent Outbreak</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Overview:</strong> You are a dictator quelling an armed rebellion. Each day, insurgent cells
                (weight 2) spread influence to neighbours (+1 weight). Deploy your army (weight -1) to strategic sectors:
                your presence not only pacifies that sector permanently, but shockwaves adjacent low-level agitators (w &le; 1)
                back to 0! Can you keep total unrest below {activePreset.targetMaxWeight} after {activePreset.totalDays} days?
              </>
            ) : (
              <>
                <strong>Algorithmic Connection (The Firefighter Problem):</strong> Generalization of the classic Firefighter Problem
                (Finbow et al. 2007). Vertices evolve via two-phase daily dynamics: discrete contagion spread (w &larr; min(2, w+1))
                followed by point pacification (w &larr; -1) and neighbor suppression shockwave. Can total weight be &le; n after m days?
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
            <span className="card-title-text">Select Insurgency Map / Scenario</span>
          </div>
        </div>
        <div className="preset-pill-row">
          {INSURGENCY_PRESETS.map((p, idx) => (
            <button
              key={p.id}
              className={`preset-pill ${selectedPresetIdx === idx ? 'active' : ''}`}
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
        {/* Left Column: Interactive Map */}
        <div className="left-panel">
          <div className="neu-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <ShieldAlert size={18} className="text-amber" />
                <span className="card-title-text">
                  Tactical Map &bull; Day {currentDay} of {activePreset.totalDays}
                </span>
              </div>
              <div className="btn-group">
                <button className="neu-btn" onClick={handleAutoSolve} title="Run optimal strategy">
                  <Sparkles size={14} />
                  <span>Oracle Strategy</span>
                </button>
                <button className="neu-btn" onClick={handleReset} title="Reset simulation">
                  <RotateCcw size={14} />
                  <span>Restart Day 0</span>
                </button>
              </div>
            </div>

            {/* SVG Tactical Graph Canvas */}
            <div className="insurgency-canvas-wrap" style={{ marginTop: '14px' }}>
              <svg viewBox="0 0 760 380" className="insurgency-svg">
                {/* Edges */}
                {activePreset.edges.map(([u, v], eIdx) => {
                  const n1 = activePreset.nodes.find((n) => n.id === u);
                  const n2 = activePreset.nodes.find((n) => n.id === v);
                  if (!n1 || !n2) return null;
                  return (
                    <line
                      key={`edge-${eIdx}`}
                      x1={n1.x}
                      y1={n1.y}
                      x2={n2.x}
                      y2={n2.y}
                      stroke="rgba(255, 191, 0, 0.7)"
                      strokeWidth={2}
                    />
                  );
                })}

                {/* Nodes */}
                {activePreset.nodes.map((node) => {
                  const w = nodeWeights[node.id] || 0;
                  const isArmy = w === -1;
                  const isInsurgent = w === 2;
                  const isSimmering = w === 1;
                  const isVisited = armyHistory.includes(node.id);

                  // Theme Palette: -1 (Mint Army #D4F8E8), 0 (Cream #fffaf4), 1 (Lavender #E8D4F8), 2 (Blush #F8D6D4)
                  const fillColor = isArmy
                    ? '#D4F8E8'
                    : isInsurgent
                    ? '#F8D6D4'
                    : isSimmering
                    ? '#E8D4F8'
                    : '#fffaf4';
                  const strokeColor = isArmy
                    ? '#0f766e'
                    : isInsurgent
                    ? '#be123c'
                    : isSimmering
                    ? '#7e22ce'
                    : '#FFBF00';

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="insurgency-hex-group"
                      onClick={() => !isGameOver && !isVisited && handleDeployArmyToNode(node.id)}
                    >
                      <circle
                        r={28}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isArmy || isInsurgent ? 2.5 : 1.5}
                      />
                      <text y={-4} fill="#2723a9" className="insurgency-weight-badge">
                        {isArmy ? 'ARM' : `w = ${w}`}
                      </text>
                      <text
                        y={14}
                        fill="#2723a9"
                        fontSize="0.68rem"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="hint-text" style={{ textAlign: 'center', marginTop: '10px' }}>
              Click any unvisited vertex to deploy your Army for the current day.
              <br />
              <span style={{ color: '#be123c', fontWeight: 700 }}>Blush (w=2)</span> = Insurgent &bull;{' '}
              <span style={{ color: '#7e22ce', fontWeight: 700 }}>Lavender (w=1)</span> = Agitator &bull;{' '}
              <span style={{ color: '#0f766e', fontWeight: 700 }}>Mint (w=-1)</span> = Pacified Garrison &bull;{' '}
              <span style={{ color: '#2723a9', fontWeight: 700 }}>Cream (w=0)</span> = Neutral
            </p>
          </div>
        </div>

        {/* Right Column: Simulation Verdict & Daily Logs */}
        <div className="right-panel">
          <div className="verifier-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <Zap size={18} className="text-teal" />
                <span className="card-title-text">Simulation Verdict</span>
              </div>
              <span className="complexity-tag">Target: Total Weight &le; {activePreset.targetMaxWeight}</span>
            </div>

            {/* Verdict Box */}
            <div className={`verdict-box ${isGameOver ? (isWon ? 'accept' : 'reject') : ''}`}>
              <div className="verdict-icon-row">
                {isGameOver ? (
                  isWon ? (
                    <CheckCircle2 size={24} className="text-teal" />
                  ) : (
                    <AlertTriangle size={24} className="text-rose" />
                  )
                ) : (
                  <Play size={24} className="text-blue" />
                )}
                <div>
                  <h4 className="verdict-heading">
                    {!isGameOver
                      ? `Day ${currentDay} In Progress...`
                      : isWon
                      ? 'VICTORY — Insurgency Successfully Quelled!'
                      : 'DEFEAT — Insurgency Out of Control!'}
                  </h4>
                  <p className="verdict-subtext">
                    {!isGameOver
                      ? `Deploy your army to suppress unrest. ${activePreset.totalDays - currentDay} day(s) remain.`
                      : isWon
                      ? `Total unrest is ${currentTotalWeight} &le; ${activePreset.targetMaxWeight}. Order restored!`
                      : `Total unrest reached ${currentTotalWeight} > ${activePreset.targetMaxWeight}.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="audit-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">Current Unrest</span>
                <span
                  className="metric-value"
                  style={{
                    color: currentTotalWeight <= activePreset.targetMaxWeight ? '#2dd4bf' : '#fb7185',
                  }}
                >
                  {currentTotalWeight} / {activePreset.targetMaxWeight}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Days Elapsed</span>
                <span className="metric-value">
                  {currentDay} / {activePreset.totalDays}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Army Deployments</span>
                <span className="metric-value">{armyHistory.length}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">Map Vertices</span>
                <span className="metric-value">{activePreset.nodes.length}</span>
              </div>
            </div>

            {/* Day by Day Log */}
            <div style={{ marginTop: '14px' }}>
              <span className="section-subtitle">Turn-by-Turn Operational Log:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {records.length === 0 ? (
                  <span className="text-muted text-xs">No days simulated yet. Deploy army to begin Day 1.</span>
                ) : (
                  records.map((rec) => (
                    <div
                      key={rec.day}
                      className="trace-entry valid"
                      style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                    >
                      <strong>Day {rec.day}:</strong> Army deployed to <code>{rec.armyTargetId}</code> (Garrisoned).
                      Shockwave quelled {rec.quelldCount} adjacent node(s) to 0. Total unrest: <strong>{rec.totalWeight}</strong>.
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Team Discussion Box */}
            <div className="gadget-walkthrough-card" style={{ marginTop: '16px' }}>
              <div className="gadget-title">
                <Code2 size={16} className="text-teal" />
                <span>Firefighter Problem Connection</span>
              </div>
              <div className="gadget-body">
                <p>
                  <strong>NP-Completeness Origin:</strong> Finbow, Hartnell, Li, and Schmeisser (2007) proved the
                  Firefighter problem is NP-complete even on trees of maximum degree 3.
                </p>
                <div className="latex-snippet-block">
                  {`Insurgent (w=2) spreads +1 to non-pacified neighbors.\n` +
                   `Army (w=-1) sets adjacent 0 <= w <= 1 back to 0.\n` +
                   `Decision: Is total weight <= n after m days?`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
