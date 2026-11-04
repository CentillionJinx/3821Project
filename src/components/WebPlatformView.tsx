import React from 'react';
import {
  Cpu,
  Layers,
  Zap,
  Code2,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const WebPlatformView: React.FC<Props> = ({ explainMode }) => {
  return (
    <div className="tab-stage">
      {/* Hero Header */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <Cpu size={32} />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">System Architecture</span>
            <span className="edu-hero-badge blue">Client-Side Runtime Engine</span>
            <span className="edu-hero-badge teal">PWA &bull; React 19 &bull; TypeScript 5.8</span>
          </div>
          <h2 className="edu-hero-title">Interactive Web Platform &amp; Verifier Pipeline</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Overview:</strong> How our app works under the hood! Every time you click or place a token,
                an ultra-fast deterministic algorithm runs right in your browser to verify whether your solution is valid
                in less than a millisecond. No slow cloud servers needed!
              </>
            ) : (
              <>
                <strong>System Engineering Architecture:</strong> Technical specification of the client-side execution environment:
                immutable frontend state machine &Sigma;, deterministic polynomial-time verifier pipeline,
                and polynomial reduction compilers (3-SAT &le;_p X).
              </>
            )}
          </p>
        </div>
      </div>

      <div className="dungeon-workspace">
        {/* Left Column: State Machine & Verifiers */}
        <div className="left-panel">
          {/* Section 5.1 */}
          <div className="card-neu">
            <div className="card-header-row">
              <div className="card-title-group">
                <Layers size={18} className="text-teal" />
                <span className="card-title-text">5.1 Frontend State Machine &amp; Dual Rendering Engine</span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              The client maintains an immutable state tuple &Sigma; updated deterministically on every user action:
            </p>
            <div className="math-callout" style={{ fontSize: '0.78rem', margin: '8px 0' }}>
              &Sigma; = (Board, S&prime; &sube; S, Hearts &sube; V, &pi; &isin; V^*, Trapped &sube; V, History)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', marginTop: '10px' }}>
              <div style={{ padding: '8px 10px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px' }}>
                <strong className="text-primary">1. CSS Grid Tensor Engine:</strong> Renders XOR Squares (W &times; H)
                and Carpets &amp; Hearts (N &times; N) using responsive CSS Grid layouts with 0-latency hover and click detection.
              </div>
              <div style={{ padding: '8px 10px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '6px' }}>
                <strong className="text-primary">2. Vector SVG Graph Engine (760 &times; 380):</strong> Renders Trap-Path
                dungeon topologies G = (V, E) and directed trap curves (u, v) &isin; D using quadratic B&eacute;zier arcs
                with real-time step badges.
              </div>
            </div>
          </div>

          {/* Section 5.2 */}
          <div className="card-neu" style={{ marginTop: '18px' }}>
            <div className="card-header-row">
              <div className="card-title-group">
                <Zap size={18} className="text-amber" />
                <span className="card-title-text">5.2 Client-Side Polynomial-Time Verifier Pipeline</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div style={{ padding: '10px 12px', background: 'var(--mint)', borderRadius: '6px', border: '1px solid #0f766e', borderLeft: '4.5px solid #0f766e' }}>
                <strong style={{ color: '#0f766e' }}>XOR Squares Verifier &bull; O(W &middot; H + |S|)</strong>
                <p style={{ margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  Evaluates cell overlap counts, computes modulo-2 parities, and audits target cell constraints.
                  Executed in 0.05ms for 8&times;8 grids.
                </p>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--blush)', borderRadius: '6px', border: '1px solid #be123c', borderLeft: '4.5px solid #be123c' }}>
                <strong style={{ color: '#be123c' }}>Carpets &amp; Hearts Verifier &bull; O(N&sup2;)</strong>
                <p style={{ margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  Audits row quotas, column quotas, region quotas, and checks pairwise 8-neighbourhood distances
                  dist_&infin;(h_1, h_2) &ge; 2.
                </p>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--lavender)', borderRadius: '6px', border: '1px solid #581c87', borderLeft: '4.5px solid #581c87' }}>
                <strong style={{ color: '#581c87' }}>Trap-Path Dungeon Verifier &bull; O(|V| + |D|)</strong>
                <p style={{ margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  Executes the Sequential Trap Marking Procedure: checks adjacency (v_i, v_&lcub;i+1&rcub;) &isin; E,
                  verifies trapped[v_i] == false, and updates trapped[w] = true for all (v_i, w) &isin; D.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Instance Compiler */}
        <div className="right-panel">
          <div className="card-neu">
            <div className="card-header-row">
              <div className="card-title-group">
                <Code2 size={18} className="text-blue" />
                <span className="card-title-text">5.3 Dynamic 3-SAT Compilation Pipeline</span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              The web platform includes an automated compilation engine that transforms arbitrary 3-CNF formulas
              &phi; = &and;_j (l_j1 &lor; l_j2 &lor; l_j3) into playable puzzle instances in polynomial time:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', marginTop: '12px' }}>
              <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-gold-soft)', borderRadius: '6px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>1. Variable Diamond Synthesis:</strong> For each variable x_i,
                compiles two parallel literal corridor choices T_i and F_i with mutex parity locks.
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-gold-soft)', borderRadius: '6px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>2. Clause Corridor Coupling:</strong> Synthesizes clause detector cells
                or rooms connected to the variable literal tracks.
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-gold-soft)', borderRadius: '6px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>3. Oracle Witness Solver (Backtracking DPLL):</strong> A client-side
                SAT oracle searches the 2^n assignment tree to synthesize verified winning paths for demonstration.
              </div>
            </div>

            {/* Offline PWA Ready */}
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(45, 212, 191, 0.08)', borderRadius: '8px', border: '1px solid rgba(45, 212, 191, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} className="text-teal" />
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>Progressive Web App (PWA) Certified</strong>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Equipped with Workbox service workers, web app manifest, offline asset caching, and standalone installability
                for mobile and desktop devices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
