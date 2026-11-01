import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RESEARCHED_TOPICS, type ResearchedTopic } from '../logic/researchedTopics';

interface Props {
  explainMode: 'layman' | 'rigorous';
}

export const ResearchedTopicsView: React.FC<Props> = ({ explainMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('parks-star-battle');

  const filtered = RESEARCHED_TOPICS.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.sourceProblem.toLowerCase().includes(q) ||
      t.targetDomain.toLowerCase().includes(q) ||
      t.gadgetTypes.some((g) => g.toLowerCase().includes(q))
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="tab-stage">
      {/* Header Hero */}
      <div className="edu-hero">
        <div className="edu-hero-icon-box">
          <BookOpen size={32} />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Citation Channel Research</span>
            <span className="edu-hero-badge blue">Classic &amp; Original Reductions</span>
            <span className="edu-hero-badge teal">6 Topics Compiled</span>
          </div>
          <h2 className="edu-hero-title">Researched Topics &amp; Gadget Compendium</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman Guide:</strong> To prove a puzzle is truly hard (NP-complete), mathematicians don't start from scratch!
                They take an already famous hard puzzle (like 3-SAT or Circuit-SAT) and build clever miniature "gadgets" inside the new
                puzzle that mimic wires, switches, and logic gates. Here are all the puzzle reductions researched by our team!
              </>
            ) : (
              <>
                <strong>Theoretical Context:</strong> A comprehensive survey of polynomial-time reductions f: Y &le;_p X
                derived from literature and team brainstorming. Each entry documents the source problem, gadget types, proof
                sketch, and primary planar or geometric obstacle encountered.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-neu" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Search researched topics, source problems, or gadget mechanisms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.88rem',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="neu-btn"
              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="researched-topics-grid">
        {filtered.map((topic: ResearchedTopic) => {
          const isExpanded = expandedId === topic.id;
          return (
            <div key={topic.id} className="researched-card">
              <div className="researched-card-header">
                <div>
                  <h3 className="researched-card-title">{topic.title}</h3>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span className="researched-tag">{topic.sourceProblem}</span>
                    <span className="researched-tag" style={{ color: '#2dd4bf', borderColor: 'rgba(45,212,191,0.3)' }}>
                      &rarr; {topic.targetDomain}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(topic.id)}
                  className="neu-btn"
                  style={{ padding: '6px', borderRadius: '6px' }}
                  aria-label="Toggle details"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Gadgets Tags */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {topic.gadgetTypes.map((g, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Explainer (Layman vs Rigorous) */}
              <p style={{ margin: '4px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {explainMode === 'layman' ? topic.laymanExplainer : topic.rigorousProofSketch}
              </p>

              {/* Expanded Deep Dive */}
              {isExpanded && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.65)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <strong className="text-amber">Citation Channel Note:</strong>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-muted)' }}>{topic.citationChannelNote}</p>
                  </div>
                  <div>
                    <strong className="text-teal">Rigorous Mathematical Reduction Sketch:</strong>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {topic.rigorousProofSketch}
                    </p>
                  </div>
                  <div>
                    <strong className="text-rose">Key Theoretical / Geometric Challenge:</strong>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-muted)' }}>{topic.keyChallenge}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
