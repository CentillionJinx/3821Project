import { useState } from 'react';
import {
  SUPERSEDED_CANDIDATES,
  TEAM_MEMBERS,
  TIMELINE_STAGES,
} from '../logic/timelineData.ts';

export function TimelineView() {
  const [activeStageId, setActiveStageId] = useState<string>(
    TIMELINE_STAGES[TIMELINE_STAGES.length - 1].id,
  );

  const stage = TIMELINE_STAGES.find((s) => s.id === activeStageId) ?? TIMELINE_STAGES[5];

  return (
    <div className="timeline-shell">
      {/* Left Rail: 6 Chronological Stages */}
      <aside className="timeline-rail" aria-label="Project Milestones">
        <div className="pane-strip">
          <span className="section-heading" style={{ marginBottom: 0 }}>
            Chronological Progression (Weeks 1–10)
          </span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-58)' }}>
            6 STAGES
          </span>
        </div>

        <div className="timeline-rail-list" role="tablist" aria-orientation="vertical">
          {TIMELINE_STAGES.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={item.id === stage.id}
              className={`stage-btn ${item.id === stage.id ? 'active' : ''}`}
              onClick={() => setActiveStageId(item.id)}
            >
              <div className="stage-kicker">
                <span>
                  STAGE {item.step} · {item.weeks}
                </span>
                <span>{item.commitRef}</span>
              </div>
              <div className="stage-name">{item.title}</div>
            </button>
          ))}
        </div>

        <div className="roster-footer">
          <span>Mentor: Amit Bhomwick</span>
          <span>COMP3821 · Term 3, 2026</span>
        </div>
      </aside>

      {/* Right Detail Panel: Active Stage Critique + Superseded Matrix */}
      <section className="timeline-detail" aria-label="Stage Details and Candidate Archive">
        <div className="pane-strip">
          <div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginRight: 8 }}>
              STAGE {stage.step} // {stage.weeks.toUpperCase()}
            </span>
            <strong style={{ fontSize: 13.5 }}>{stage.title}</strong>
          </div>
          <span className="badge badge-pending">{stage.commitRef}</span>
        </div>

        <div className="detail-grid-2">
          <div className="detail-cell">
            <div className="section-heading">Problem Concept &amp; Formal Rule</div>
            <p style={{ fontSize: 12, color: 'var(--fg-82)', marginBottom: 6 }}>
              {stage.concept}
            </p>
            <p className="math" style={{ fontSize: 11.5, color: 'var(--fg)' }}>
              {stage.formalSummary}
            </p>
          </div>

          <div className="detail-cell">
            <div className="section-heading">
              <span>Technical Audit / Reason Superseded</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--fg-82)', marginBottom: 6 }}>
              {stage.limitation}
            </p>
            {stage.citation && (
              <p className="mono" style={{ fontSize: 10.5, color: 'var(--fg-58)' }}>
                Ref: {stage.citation}
              </p>
            )}
          </div>
        </div>

        <div className="section-block grow-scroll">
          <div className="section-heading">
            <span>Superseded Puzzle &amp; Prototype Matrix (Descriptive Archive)</span>
            <span className="mono" style={{ fontSize: 10 }}>
              All replaced by Binary XOR-Square
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Prototype</th>
                <th>Stage</th>
                <th>Core Constraint</th>
                <th>Verifier</th>
                <th>Why Superseded</th>
              </tr>
            </thead>
            <tbody>
              {SUPERSEDED_CANDIDATES.map((cand) => (
                <tr key={cand.name}>
                  <td style={{ color: 'var(--fg)', fontWeight: 600 }}>{cand.name}</td>
                  <td>{cand.stage}</td>
                  <td>{cand.constraint}</td>
                  <td>{cand.verifierBound}</td>
                  <td>{cand.whySuperseded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="roster-footer">
          <span>
            Group 5:{' '}
            {TEAM_MEMBERS.map((m) => `${m.name} (${m.zid})`).join(' · ')}
          </span>
        </div>
      </section>
    </div>
  );
}
