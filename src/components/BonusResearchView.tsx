import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Play,
  Eye,
  EyeOff,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import { NP_APPROXIMATION_TOPICS, type ApproxProblemItem } from '../logic/npApproximations';
import {
  runBlumZkpRound,
  type BlumTranscriptRound,
} from '../logic/zkpProtocols';
import { TRAP_DUNGEON_PRESETS } from '../logic/candidates';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const BonusResearchView: React.FC<Props> = ({ explainMode }) => {
  const [activeSubtab, setActiveSubtab] = useState<'approx' | 'zkp'>('approx');

  // Approximation State
  const [selectedApproxId, setSelectedApproxId] = useState<string>('vertex-cover');
  const activeApprox: ApproxProblemItem =
    NP_APPROXIMATION_TOPICS.find((t) => t.id === selectedApproxId) || NP_APPROXIMATION_TOPICS[0];

  // ZKP State
  const [zkpCheatMode, setZkpCheatMode] = useState<boolean>(false);
  const [zkpRounds, setZkpRounds] = useState<BlumTranscriptRound[]>([]);
  const [zkpRoundCounter, setZkpRoundCounter] = useState<number>(0);

  const handleStepZkp = () => {
    const nextRound = zkpRoundCounter + 1;
    const bit = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
    const roundResult = runBlumZkpRound(
      TRAP_DUNGEON_PRESETS[0],
      nextRound,
      bit,
      zkpCheatMode ? 'cheating' : 'honest'
    );
    setZkpRounds((prev) => [roundResult, ...prev]);
    setZkpRoundCounter(nextRound);
  };

  const handleRunTenRounds = () => {
    let currentRounds = [...zkpRounds];
    let counter = zkpRoundCounter;
    for (let i = 0; i < 10; i++) {
      counter++;
      const bit = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
      const res = runBlumZkpRound(
        TRAP_DUNGEON_PRESETS[0],
        counter,
        bit,
        zkpCheatMode ? 'cheating' : 'honest'
      );
      currentRounds = [res, ...currentRounds];
      if (!res.passed) break;
    }
    setZkpRounds(currentRounds);
    setZkpRoundCounter(counter);
  };

  const handleResetZkp = () => {
    setZkpRounds([]);
    setZkpRoundCounter(0);
  };

  const soundnessError = Math.pow(0.5, zkpRoundCounter).toExponential(3);

  return (
    <div className="tab-stage">
      {/* Hero Header */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <Sparkles size={32} className="text-amber" />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge amber">Bonus Research Track</span>
            <span className="edu-hero-badge blue">Extended Exploration</span>
            <span className="edu-hero-badge teal">Progression Review Scope Decision</span>
          </div>
          <h2 className="edu-hero-title">Bonus Research: Approximations &amp; Zero-Knowledge Proofs</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Overview:</strong> When a puzzle is provably NP-complete, you have two amazing backup superpowers!
                First: <em>Approximations</em> &mdash; find guaranteed near-optimal answers quickly. Second: <em>Zero-Knowledge Proofs</em> &mdash;
                prove to a friend that you solved a puzzle without spoiling the answer!
              </>
            ) : (
              <>
                <strong>Theoretical Context:</strong> Demonstrating complementary frontiers in computational complexity theory:
                polynomial-time approximation bounds (APX-hardness vs FPTAS) and interactive proof systems (IP = PSPACE, Blum zero-knowledge protocols).
              </>
            )}
          </p>
        </div>
      </div>

      {/* Scope Shift Banner */}
      <div className="scope-shift-banner">
        <AlertTriangle size={24} className="text-blue" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div className="scope-banner-content">
          <h4>Progression Review Note &bull; Decoupled from Primary Requirements</h4>
          <p>
            As documented in Section 3 of our Week 7 Progression Review, Zero-Knowledge Proofs and NP-Approximations
            were officially designated as <strong>Bonus Research</strong>. The primary creative project requirement focuses on
            our original grid puzzle reductions (XOR Squares &amp; Carpets &amp; Hearts) and deterministic verifier pipelines.
            Both bonus systems remain fully operational below for interactive experimentation!
          </p>
        </div>
      </div>

      {/* Subtab Switcher */}
      <div className="mode-toggle-container" style={{ margin: '0 0 16px' }}>
        <button
          className={`mode-btn ${activeSubtab === 'approx' ? 'active-mode' : ''}`}
          onClick={() => setActiveSubtab('approx')}
        >
          <TrendingUp size={15} />
          <span>1. NP Approximations (VC, Metric TSP, PCP)</span>
        </button>
        <button
          className={`mode-btn ${activeSubtab === 'zkp' ? 'active-mode' : ''}`}
          onClick={() => setActiveSubtab('zkp')}
        >
          <Lock size={15} />
          <span>2. Zero-Knowledge Interactive Simulator</span>
        </button>
      </div>

      {/* SUBTAB 1: NP APPROXIMATIONS */}
      {activeSubtab === 'approx' && (
        <div className="dungeon-workspace">
          {/* Left Panel: Topics Selector & Details */}
          <div className="left-panel">
            <div className="card-neu">
              <div className="card-header-row">
                <div className="card-title-group">
                  <TrendingUp size={18} className="text-amber" />
                  <span className="card-title-text">Select Approximation Frontier</span>
                </div>
              </div>

              <div className="preset-pill-row">
                {NP_APPROXIMATION_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    className={`preset-pill ${selectedApproxId === topic.id ? 'active' : ''}`}
                    onClick={() => setSelectedApproxId(topic.id)}
                  >
                    <span>{topic.name}</span>
                    <span className="pill-badge">{topic.bestApproxRatio}</span>
                  </button>
                ))}
              </div>

              {/* Active Topic Card */}
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {activeApprox.name}
                    </h3>
                    <span className="text-muted text-xs">
                      Category: {activeApprox.category} &bull; Status: {activeApprox.optimalStatus}
                    </span>
                  </div>
                  <div className="approx-badge-row">
                    <span className="approx-ratio-pill">{activeApprox.bestApproxRatio}</span>
                    <span className="researched-tag">{activeApprox.complexityClass}</span>
                  </div>
                </div>

                <div className="math-callout" style={{ fontSize: '0.82rem', margin: '4px 0' }}>
                  {explainMode === 'layman' ? activeApprox.summaryLayman : activeApprox.summaryRigorous}
                </div>

                {/* Algorithm Steps */}
                <div style={{ marginTop: '8px' }}>
                  <span className="section-subtitle">
                    Algorithm Steps &bull; {activeApprox.algorithmName}
                  </span>
                  <ol style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {activeApprox.algorithmSteps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Tightness / Lower Bound */}
                <div style={{ padding: '10px 14px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                  <strong className="text-rose" style={{ fontSize: '0.8rem' }}>
                    Mathematical Tightness &amp; Hardness Lower Bound:
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {activeApprox.tightnessNote}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Complexity Classification Matrix */}
          <div className="right-panel">
            <div className="card-neu">
              <div className="card-header-row">
                <div className="card-title-group">
                  <Calculator size={18} className="text-teal" />
                  <span className="card-title-text">Approximation Hierarchy</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
                <div style={{ padding: '10px 12px', background: 'var(--mint)', borderRadius: '6px', border: '1px solid #0f766e', borderLeft: '4.5px solid #0f766e' }}>
                  <strong style={{ color: '#0f766e' }}>FPTAS (Fully Polynomial Time Approx Scheme)</strong>
                  <p style={{ margin: '2px 0 0', color: 'var(--text-primary)' }}>
                    Approximates within (1 - &epsilon;) in poly(n, 1/&epsilon;) time. Example: 0-1 Knapsack.
                  </p>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--lavender)', borderRadius: '6px', border: '1px solid #581c87', borderLeft: '4.5px solid #581c87' }}>
                  <strong style={{ color: '#581c87' }}>PTAS (Polynomial Time Approx Scheme)</strong>
                  <p style={{ margin: '2px 0 0', color: 'var(--text-primary)' }}>
                    Approximates within (1 - &epsilon;) in O(n^f(1/&epsilon;)) time. Example: Planar TSP.
                  </p>
                </div>

                <div style={{ padding: '10px 12px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #b45309', borderLeft: '4.5px solid #b45309' }}>
                  <strong style={{ color: '#b45309' }}>APX-Complete (Constant Factor Bound)</strong>
                  <p style={{ margin: '2px 0 0', color: 'var(--text-primary)' }}>
                    Can be approximated to within a constant factor &alpha; &gt; 1, but NO PTAS exists unless P = NP. Example: Vertex Cover (factor 2), Metric TSP (factor 1.5).
                  </p>
                </div>

                <div style={{ padding: '10px 12px', background: 'var(--blush)', borderRadius: '6px', border: '1px solid #be123c', borderLeft: '4.5px solid #be123c' }}>
                  <strong style={{ color: '#be123c' }}>Inapproximable (PCP Theorem Barrier)</strong>
                  <p style={{ margin: '2px 0 0', color: 'var(--text-primary)' }}>
                    Cannot be approximated to any constant factor or better than trivial random coin flipping. Example: MAX-3-SAT (cannot beat 7/8 by Håstad 1997), General TSP (no factor &alpha;(n) possible).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ZERO-KNOWLEDGE PROOF SIMULATOR */}
      {activeSubtab === 'zkp' && (
        <div className="dungeon-workspace">
          {/* Left Panel: Protocol Control */}
          <div className="left-panel">
            <div className="card-neu">
              <div className="card-header-row">
                <div className="card-title-group">
                  <Lock size={18} className="text-teal" />
                  <span className="card-title-text">Interactive ZKP Commitment &bull; Challenge &bull; Open</span>
                </div>
                <div className="btn-group">
                  <button
                    className={`mode-btn ${zkpCheatMode ? 'active-mode' : ''}`}
                    onClick={() => setZkpCheatMode(!zkpCheatMode)}
                    style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                  >
                    {zkpCheatMode ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{zkpCheatMode ? 'Cheating Prover (No Solution)' : 'Honest Prover'}</span>
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0 14px' }}>
                The Prover permutes the secret graph isomorphism / 3-coloring, commits SHA-256 hashes of the colors/nodes,
                and the Verifier randomly challenges either (0) the permutation validity, or (1) a random incident edge.
                A cheating prover is caught with probability 1/2 each round!
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="neu-btn" onClick={handleStepZkp}>
                  <Play size={14} />
                  <span>Execute 1 Round</span>
                </button>
                <button className="neu-btn" onClick={handleRunTenRounds}>
                  <Sparkles size={14} />
                  <span>Run 10 Rounds</span>
                </button>
                <button className="neu-btn" onClick={handleResetZkp}>
                  <RotateCcw size={14} />
                  <span>Reset Protocol</span>
                </button>
              </div>

              {/* Protocol Metrics */}
              <div className="audit-metrics-grid" style={{ marginTop: '18px' }}>
                <div className="metric-box">
                  <span className="metric-label">Completed Rounds (k)</span>
                  <span className="metric-value">{zkpRoundCounter}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Soundness Error (1/2)^k</span>
                  <span className="metric-value" style={{ fontSize: '0.95rem' }}>
                    {zkpRoundCounter === 0 ? '1.0' : soundnessError}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Prover Confidence</span>
                  <span className="metric-value" style={{ color: '#2dd4bf' }}>
                    {zkpRoundCounter === 0 ? '0%' : `${((1 - Math.pow(0.5, zkpRoundCounter)) * 100).toFixed(2)}%`}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Cheater Caught?</span>
                  <span
                    className="metric-value"
                    style={{
                      color: zkpRounds.some((r) => !r.passed) ? '#fb7185' : '#2dd4bf',
                    }}
                  >
                    {zkpRounds.some((r) => !r.passed) ? 'CAUGHT!' : 'Passed'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Transcript Log */}
          <div className="right-panel">
            <div className="card-neu">
              <div className="card-header-row">
                <div className="card-title-group">
                  <ShieldCheck size={18} className="text-teal" />
                  <span className="card-title-text">Cryptographic Transcript Log</span>
                </div>
                <span className="complexity-tag">SHA-256 Commitments</span>
              </div>

              {zkpRounds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  No rounds executed yet. Click &ldquo;Execute 1 Round&rdquo; or &ldquo;Run 10 Rounds&rdquo; to start the interactive proof!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                  {zkpRounds.map((r) => (
                    <div
                      key={r.round}
                      className={`trace-entry ${r.passed ? 'valid' : 'invalid'}`}
                      style={{ padding: '8px 12px', fontSize: '0.78rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>Round #{r.round}:</strong>
                        <span style={{ color: r.passed ? '#2dd4bf' : '#fb7185', fontWeight: 700 }}>
                          {r.passed ? 'PASS' : 'REJECT (CHEAT DETECTED)'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                        Challenge: b = {r.challengeBit} &bull; Commitment Root: {r.commitmentHashG.slice(0, 16)}...
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Revealed: {r.revealedContent}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
