import React from 'react';
import {
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const ProgressionReviewView: React.FC<Props> = ({ explainMode: _explainMode }) => {
  return (
    <div className="tab-stage">
      {/* Hero Header */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <FileText size={32} />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">COMP3821 Progression Review</span>
            <span className="edu-hero-badge blue">Group 5 &bull; Term 3, 2026</span>
            <span className="edu-hero-badge amber">Week 7 Milestone</span>
          </div>
          <h2 className="edu-hero-title">Project Progression Review &amp; Revised Direction</h2>
          <p className="edu-hero-summary">
            A comprehensive account of our group's theoretical learnings, candidate puzzle discoveries,
            key obstacles encountered, strategic scope adjustments (decoupling Zero-Knowledge Proofs),
            and revised execution roadmap for the remaining 3 weeks.
          </p>
        </div>
      </div>

      {/* Scope Shift Callout Banner */}
      <div className="scope-shift-banner warning">
        <AlertTriangle size={24} className="text-amber" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div className="scope-banner-content">
          <h4>Strategic Scope Decision: Zero-Knowledge Proofs Transitioned to Bonus Research</h4>
          <p>
            In our initial proposal, we aimed to implement both NP-completeness reductions and an interactive Zero-Knowledge
            Proof (ZKP) protocol. During Week 5&ndash;7 research, we determined that combining full interactive zero-knowledge
            commitment-challenge protocols alongside multiple original NP-completeness gadget proofs introduced excessive complexity.
            To ensure highest mathematical rigour and game polish, <strong>the core project is now 100% focused on designing,
            proving, and verifying original NP-complete grid puzzles (XOR Squares &amp; Carpets &amp; Hearts)</strong>, while
            our ZKP protocol and NP-Approximation engines have been gracefully transitioned into dedicated <em>Bonus Research</em> modules.
          </p>
        </div>
      </div>

      {/* Grid of Sections: Scope & Progress */}
      <div className="dungeon-workspace">
        {/* Left Column: Scope & Progress Checklist */}
        <div className="left-panel">
          {/* Section 1: Objective & Scope */}
          <div className="card-neu">
            <div className="card-header-row">
              <div className="card-title-group">
                <TrendingUp size={18} className="text-teal" />
                <span className="card-title-text">1. Current Objective &amp; Scope</span>
              </div>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              The current objective for our creative project remains rock solid: <strong>to design an original grid-based
              puzzle that is NP-complete, and then showcase it interactively by creating a web application where users
              can input their own solutions, which the platform deterministically verifies in polynomial time.</strong>
            </p>
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(45, 212, 191, 0.08)', borderRadius: '8px', border: '1px solid rgba(45, 212, 191, 0.2)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Scope Evolution:</span>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                We dedicated concentrated research to the theoretical report until the end of <strong>Week 7</strong>,
                leaving <strong>3 weeks (Weeks 8&ndash;10)</strong> to finalize the interactive web application,
                generate clean educational materials, and design the final academic presentation poster.
              </p>
            </div>
          </div>

          {/* Section 2: Progress Completed So Far */}
          <div className="card-neu" style={{ marginTop: '18px' }}>
            <div className="card-header-row">
              <div className="card-title-group">
                <CheckCircle2 size={18} className="text-teal" />
                <span className="card-title-text">2. Work Developed So Far</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={16} className="text-teal" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong className="text-primary">Introduction &amp; Creative Intention:</strong> Established the educational
                  and theoretical motivation for making computational intractability accessible via playable puzzles.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={16} className="text-teal" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong className="text-primary">Algorithmic Connection:</strong> Authored in-depth formal analysis defining
                  classes P, NP, and NP-complete, polynomial-time reductions (3-SAT &le;_p X), and deterministic verifier criteria.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={16} className="text-teal" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong className="text-primary">Leading Candidate 1 &mdash; XOR Squares:</strong> Finished developing literal
                  mutex overlap gadgets (x_i &oplus; &not;x_i = 1) and clause parity satisfaction gadgets with polynomial verification in O(W &middot; H + |S|).
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={16} className="text-teal" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong className="text-primary">Candidate 2 &mdash; Carpets &amp; Hearts (Parks Reduction):</strong> Developed
                  3-SAT reductions leveraging the Parks Problem (Star Battle) non-adjacency exclusion corridors and clause deadlock rooms in O(N&sup2;).
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={16} className="text-teal" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong className="text-primary">Candidate 3 &mdash; 3-SAT Trap-Switch Dungeon:</strong> Implemented spatial
                  graph/grid traversal with variable choice diamonds and switch-controlled trap gates in O(|V| + |D|).
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={16} className="text-teal" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong className="text-primary">GitHub Repository &amp; PWA:</strong> Built and pushed production web platform
                  to <a href="https://github.com/CentillionJinx/3821Project" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>CentillionJinx/3821Project</a>.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Brainstorming Log */}
          <div className="card-neu" style={{ marginTop: '18px' }}>
            <div className="card-header-row">
              <div className="card-title-group">
                <Sparkles size={18} className="text-amber" />
                <span className="card-title-text">3. Notebook &amp; Team Discussion Log</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
              <div className="team-quote-card">
                <div className="team-quote-header">
                  <span className="team-quote-author">Team Discussion &bull; &ldquo;Carpets&rdquo;</span>
                  <span className="pill-badge">LaTeX Model</span>
                </div>
                <div className="latex-snippet-block">
                  {`We have an N by M grid of tiles G, and collection C of sets S of connected tiles.\n` +
                   `Select B ⊆ C covering G.\n` +
                   `Overlap constraint: multiplicity in M = ∑ B must match v(t).\n` +
                   `Unique cover constraint: ∀ Q ∈ B, ∃ t ∈ Q such that multiplicity in M is 1.`}
                </div>
                <p className="team-quote-text">
                  <em>&ldquo;We don't want to waste carpets, so each carpet must cover at least one tile uniquely.
                  Some parts of the floor are damaged, so we want to cover those parts with more carpets (target v(t))...&rdquo;</em>
                </p>
              </div>

              <div className="team-quote-card">
                <div className="team-quote-header">
                  <span className="team-quote-author">Team Discussion &bull; &ldquo;Hearts // Microbes&rdquo;</span>
                  <span className="pill-badge">Organ Invariant</span>
                </div>
                <p className="team-quote-text">
                  <em>&ldquo;We have some collection of blobs (connected tiles) with some vital organs (subset of those tiles).
                  We want to place these blobs on the grid that possibly overlap, but the vital organs of blob A cannot overlap
                  with ANY part of another blob B for all A, B in selected subcollection!&rdquo;</em>
                </p>
              </div>

              <div className="team-quote-card">
                <div className="team-quote-header">
                  <span className="team-quote-author">Team Discussion &bull; &ldquo;Quell the Insurgency&rdquo;</span>
                  <span className="pill-badge">Firefighter Variant</span>
                </div>
                <p className="team-quote-text">
                  <em>&ldquo;You are a dictator that needs to quell an insurgency. Insurgent locations have weight 2 and add 1
                  to neighbours each day. You send your army to one location each day (weight -1, quells adjacent 0 &le; w &le; 1 to 0).
                  Can total weight be below n after m days? Firefighter is the closest to this.&rdquo;</em>
                </p>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-gold-soft)', borderRadius: '6px', fontSize: '0.78rem' }}>
                <strong style={{ color: '#0f766e' }}>Grid Geometries &amp; Reductions Note:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-primary)' }}>
                  <em>&ldquo;We can do hex or triangle or square grid or toroid or cylinder to make the problem reduction
                  more restricted/harder and have more interesting proofs and visualisable gadgets.&rdquo;</em>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline Comparison & Difficulties */}
        <div className="right-panel">
          {/* Section 4: Timeline Comparison */}
          <div className="card-neu">
            <div className="card-header-row">
              <div className="card-title-group">
                <Calendar size={18} className="text-blue" />
                <span className="card-title-text">4. Project Timeline: Proposal vs Revised</span>
              </div>
            </div>

            <span className="section-subtitle" style={{ marginTop: '4px' }}>Original Proposal Plan:</span>
            <table className="review-plan-table">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Week</th>
                  <th>Original Milestone Tasks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Week 4</td>
                  <td>Begin working on the report</td>
                </tr>
                <tr>
                  <td>Week 5</td>
                  <td>Continue working on the report</td>
                </tr>
                <tr>
                  <td>Week 6</td>
                  <td>Complete report</td>
                </tr>
                <tr>
                  <td>Week 7</td>
                  <td>Begin working on the app + Progression Review</td>
                </tr>
                <tr>
                  <td>Week 8</td>
                  <td>Complete the app + begin working on poster</td>
                </tr>
                <tr>
                  <td>Week 9</td>
                  <td>Complete the poster + final revision of report</td>
                </tr>
                <tr>
                  <td>Week 10</td>
                  <td>Submit project</td>
                </tr>
              </tbody>
            </table>

            <span className="section-subtitle" style={{ marginTop: '16px' }}>Revised Progression Plan (Current):</span>
            <table className="review-plan-table">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Week</th>
                  <th>Revised Progression Tasks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Week 4</td>
                  <td>Begin working on the report (Done)</td>
                </tr>
                <tr>
                  <td>Week 5</td>
                  <td>Continue working on the report (Done)</td>
                </tr>
                <tr>
                  <td>Week 6</td>
                  <td>Continue working on report + begin working on the app (Done)</td>
                </tr>
                <tr className="current-week">
                  <td>Week 7 &bull; NOW</td>
                  <td>Continue report + continue app + Progression Review Submission</td>
                </tr>
                <tr>
                  <td>Week 8</td>
                  <td>Complete report + continue app + begin working on poster</td>
                </tr>
                <tr>
                  <td>Week 9</td>
                  <td>Complete app + complete poster</td>
                </tr>
                <tr>
                  <td>Week 10</td>
                  <td>Final review of all deliverables + submit</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Difficulties & Solutions */}
          <div className="card-neu" style={{ marginTop: '18px' }}>
            <div className="card-header-row">
              <div className="card-title-group">
                <AlertTriangle size={18} className="text-amber" />
                <span className="card-title-text">5. Difficulties Encountered &amp; Strategic Solutions</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong className="text-primary">1. Developing Novel, Interesting, and Provable Puzzles:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  <em>Challenge:</em> A puzzle must be engaging for human players to solve, yet mathematically provable
                  without devolving into triviality or undecidability.
                  <br />
                  <em>Approach:</em> We researched established puzzle reductions (Parks Problem, Akari, Numberlink)
                  and engineered original variations (XOR Squares and Carpets &amp; Hearts) with cleanly isolated variable
                  and clause gadgets.
                </p>
              </div>

              <div>
                <strong className="text-primary">2. Complexity of Zero-Knowledge Proofs:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  <em>Challenge:</em> Multi-round cryptographic commit-and-open ZKP protocols added significant cognitive
                  and implementation burden on top of the already heavy NP-completeness proof work.
                  <br />
                  <em>Approach:</em> Formally shifted ZKP to <em>Bonus Research</em> in our progression review, refocusing
                  all primary effort on interactive grid puzzle verification.
                </p>
              </div>

              <div>
                <strong className="text-primary">3. Real-Time Polynomial-Time Verification:</strong>
                <p style={{ margin: '4px 0 0' }}>
                  <em>Challenge:</em> Instantaneous client-side evaluation without browser stuttering.
                  <br />
                  <em>Approach:</em> Implemented deterministic polynomial verifiers in TypeScript that check solutions in
                  O(W &middot; H + |S|) or O(N&sup2;) arithmetic steps with complete witness audit logs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
