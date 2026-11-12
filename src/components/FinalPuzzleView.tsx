import React from 'react';
import {
  Heart,
  Trophy,
  ArrowRight,
  Sparkles,
  Layers,
  ShieldAlert,
  Square,
  Route,
  FileImage,
  CircleHelp,
  Microscope,
  Braces,
  GitBranch,
} from 'lucide-react';
import { HeartsMicrobesView } from './HeartsMicrobesView';

type MarkerTab = 'cand-carpets' | 'cand-insurgency' | 'cand-xor' | 'cand-dungeon';

interface Props {
  explainMode: 'layman' | 'rigorous';
  onNavigate: (tab: MarkerTab | 'figures') => void;
}

const MARKERS: {
  tab: MarkerTab;
  index: string;
  name: string;
  rule: string;
  note: string;
  icon: React.ReactNode;
}[] = [
  {
    tab: 'cand-carpets',
    index: '01',
    name: '“Carpets” Floor',
    rule: 'Multiplicity and unique cover',
    note: 'Counting stayed local, but the gadget never locked hard enough to carry a reduction.',
    icon: <Layers size={17} className="text-blue" />,
  },
  {
    tab: 'cand-insurgency',
    index: '02',
    name: 'Quell Insurgency',
    rule: 'Firefighter on a hex graph',
    note: 'A global spreading process swamped the witness; verification stopped feeling like a check.',
    icon: <ShieldAlert size={17} className="text-amber" />,
  },
  {
    tab: 'cand-xor',
    index: '03',
    name: 'XOR Squares',
    rule: 'Parity over modulo-2 overlaps',
    note: 'Parity is a global sum. The final invariant had to stay a local, pairwise lock.',
    icon: <Square size={17} className="text-teal" />,
  },
  {
    tab: 'cand-dungeon',
    index: '04',
    name: '3-SAT Trap Dungeon',
    rule: 'Spatial trap DAG',
    note: 'The DAG did the hard work. We wanted the board itself to carry the hardness.',
    icon: <Route size={17} className="text-rose" />,
  },
];

const GADGETS = [
  {
    index: 'G1',
    title: 'Truth bank',
    body: 'For each variable xᵢ, two blobs Tᵢ and Fᵢ. Each organ sits inside the other’s body, so selecting both breaks the invariant. A feasible witness picks at most one value.',
    tag: 'mutual exclusion',
  },
  {
    index: 'G2',
    title: 'Occurrence blob',
    body: 'One blob per literal occurrence. Its body contains the literal cell plus a private clause block. Nobody else covers that block, and k counts it exactly once.',
    tag: 'private tiles',
  },
  {
    index: 'G3',
    title: 'Clause triangle',
    body: 'The three occurrence blobs of a clause are pairwise organ-locked. At most one can be selected, so a clause cannot buy two literals at once.',
    tag: '3-way mutex',
  },
  {
    index: 'G4',
    title: 'Quota lift',
    body: 'k equals all private tiles. Each clause block is padded wider than every non-private tile combined, so coverage ≥ k forces every block. One literal per clause must be chosen.',
    tag: 'existential force',
  },
];

const FUTURE = [
  {
    title: 'Close the layout proof',
    body: 'Place G1–G4 on one grid with no accidental organ-body contact, bound the grid size polynomially, and write the case analysis.',
    icon: <Microscope size={17} className="text-teal" />,
  },
  {
    title: 'Map the boundary',
    body: 'Two-row grids, one organ per blob, hex and toroidal boards. Find the smallest instance that is still hard, and the largest that is easy.',
    icon: <GitBranch size={17} className="text-blue" />,
  },
  {
    title: 'Solve it exactly',
    body: 'ILP and SAT encodings, FPT in |C| or |O|, and an approximation ratio for maximum coverage when the quota is out of reach.',
    icon: <Braces size={17} className="text-amber" />,
  },
  {
    title: 'Prove it without showing it',
    body: 'Commit to a witness, then prove organ non-overlap and coverage without revealing B. The zero-knowledge bonus, rebuilt on the final rule.',
    icon: <ShieldAlert size={17} className="text-rose" />,
  },
  {
    title: 'Widen the pipeline',
    body: 'Batch TSV boards, colour-blind palettes, and LaTeX export, so one source feeds the poster, the site, and the report.',
    icon: <FileImage size={17} className="text-blue" />,
  },
];

export const FinalPuzzleView: React.FC<Props> = ({ explainMode, onNavigate }) => {
  return (
    <div className="tab-stage final-view">
      {/* ================= HERO ================= */}
      <div className="edu-hero final-hero">
        <div className="edu-hero-icon-box">
          <Heart size={32} className="text-rose" />
        </div>
        <div className="edu-hero-text">
          <div className="edu-hero-badge-row">
            <span className="edu-hero-badge">Final candidate · 5 → 1</span>
            <span className="edu-hero-badge blue">grid.py 2.0 · one figure pipeline</span>
            <span className="edu-hero-badge teal">Exact O(|B|²·|T|) verifier</span>
            <span className="edu-hero-badge amber">Poster + site + report</span>
          </div>
          <h2 className="edu-hero-title">Grid-Organ — one rule, one verifier, one figure</h2>
          <p className="edu-hero-summary">
            {explainMode === 'layman' ? (
              <>
                <strong>Layman version.</strong> Microbes are connected tile shapes. Each one has a body and a
                few vital organs marked with a heart. Bodies may overlap freely. Organs may not be touched by
                any other microbe. Pick a sub-collection that protects every organ and still covers enough of
                the board. The answer is easy to check and hard to find, which is the whole point.
              </>
            ) : (
              <>
                <strong>Decision problem.</strong> Given a grid <em>G</em>, a collection <em>C</em> of
                pre-placed blobs <em>A = (T(A), O(A))</em> with <em>∅ ≠ O(A) ⊆ T(A)</em>, and a quota{' '}
                <em>k</em>, is there a witness <em>B ⊆ C</em> such that{' '}
                <em>O(A) ∩ T(A′) = ∅</em> for every ordered pair of distinct blobs <em>A, A′ ∈ B</em>, and{' '}
                <em>|⋃<sub>A∈B</sub> T(A)| ≥ k</em>? The verifier is deterministic, exact, and runs in
                polynomial time. No search is hidden inside it.
              </>
            )}
          </p>
        </div>
      </div>

      {/* ================= STAT STRIP ================= */}
      <div className="final-claim-strip" aria-label="Final puzzle at a glance">
        <div className="final-claim">
          <span className="final-claim-value">5 → 1</span>
          <span className="final-claim-label">candidates, one kept</span>
        </div>
        <div className="final-claim">
          <span className="final-claim-value">6 × 3</span>
          <span className="final-claim-label">poster board, 3 regions</span>
        </div>
        <div className="final-claim">
          <span className="final-claim-value">O(|B|²·|T|)</span>
          <span className="final-claim-label">verifier, no branching</span>
        </div>
        <div className="final-claim">
          <span className="final-claim-value">2<sup>|C|</sup></span>
          <span className="final-claim-label">witnesses, one check</span>
        </div>
      </div>

      {/* ================= THE RULE + FIGURE ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">The whole rule, in one picture</span>
          <h3 className="final-section-title">Bodies overlap. Organs do not. The union must clear k.</h3>
        </div>
        <div className="final-rule-grid">
          <div className="card-neu final-figure-card">
            <div className="final-figure-frame">
              <img
                src="/figures/poster-microbes.svg"
                alt="A 6 by 3 Grid-Organ board: teal blob A, amber blob B, a mint shared body tile, and two hearts protected inside their own bodies."
                className="final-figure"
              />
            </div>
            <p className="hint-text final-figure-caption">
              The committed poster board, generated by <code>grid.py</code> from{' '}
              <code>figures/poster-microbes.tsv</code>. The teal and amber arms overlap on the mint tile;
              the two hearts stay inside their own bodies. The poster, the Figure Studio, and this page all
              render the same source.
            </p>
          </div>

          <div className="final-rule-list">
            <div className="final-rule">
              <span className="final-rule-num">01</span>
              <div>
                <h4>Body overlap is legal</h4>
                <p>
                  <em>T(A) ∩ T(B)</em> may be non-empty. Shared tissue is what makes a compact board
                  possible, and it is what lets blobs act as wires.
                </p>
              </div>
            </div>
            <div className="final-rule">
              <span className="final-rule-num">02</span>
              <div>
                <h4>An organ is a one-way lock</h4>
                <p>
                  If <em>O(A)</em> touches any tile of <em>T(A′)</em>, the pair is forbidden. The lock is
                  local: it depends on two blobs, not on the whole board.
                </p>
              </div>
            </div>
            <div className="final-rule">
              <span className="final-rule-num">03</span>
              <div>
                <h4>Coverage is a quota, not an objective</h4>
                <p>
                  The witness must cover at least <em>k</em> distinct tiles. Padding a clause block makes
                  the quota an existential force: miss the block, miss the quota.
                </p>
              </div>
            </div>
            <div className="final-rule-note">
              <Trophy size={16} className="text-amber" />
              <span>
                The final puzzle is the only candidate where the hardness sits in a local pairwise rule
                while the quota stays globally checkable.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE LAB ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">Try the rule before reading the proof</span>
          <h3 className="final-section-title">Interactive verifier — 6 × 6, quota k = 14</h3>
          <p className="final-section-lede">
            Toggle microbes, watch the organ lock, then load the oracle witness. The verifier reports the
            collision pair, the covered-tile count, and the exact operation count.
          </p>
        </div>
        <HeartsMicrobesView explainMode={explainMode} embedded />
      </section>

      {/* ================= CONTRACT ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">The contract</span>
          <h3 className="final-section-title">Four checks, one pass, no search</h3>
        </div>
        <div className="final-contract-grid">
          <div className="card-neu final-code-card">
            <div className="final-code-head">
              <CodeIcon />
              <span>verify(G, C, B, k)</span>
              <span className="pill-badge">deterministic</span>
            </div>
            <pre className="final-code">{`assert B ⊆ C                    # 1. membership
U := ∅
for A in B:                     # 2. union, dedup
    U := U ∪ T(A)
for A, D in pairs(B):           # 3. organ lock
    assert O(A) ∩ T(D) = ∅
return |U| ≥ k                  # 4. quota`}</pre>
          </div>
          <div className="final-contract-side">
            <div className="final-check">
              <span>Membership</span>
              <code>O(|B|)</code>
            </div>
            <div className="final-check">
              <span>Union and dedup</span>
              <code>O(|B|·|T|)</code>
            </div>
            <div className="final-check">
              <span>Pairwise organ lock</span>
              <code>O(|B|²·|T|)</code>
            </div>
            <div className="final-check">
              <span>Quota</span>
              <code>O(1)</code>
            </div>
            <p className="hint-text">
              Total <strong>O(|B|²·|T|)</strong> time, <strong>O(NM + Σ|T|)</strong> space. The witness is
              the certificate: a <em>yes</em> answer is checkable without trusting the solver.
            </p>
          </div>
        </div>
      </section>

      {/* ================= REDUCTION ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">Why it is hard</span>
          <h3 className="final-section-title">3-SAT → Grid-Organ, in four gadgets</h3>
          <p className="final-section-lede">
            The construction is a sketch with a complete argument at gadget level. What remains is the
            placement case analysis: putting all four gadgets on one grid without an accidental organ-body
            contact.
          </p>
        </div>
        <div className="final-gadget-grid">
          {GADGETS.map((g) => (
            <div key={g.index} className="card-neu final-gadget">
              <div className="final-gadget-top">
                <span className="final-gadget-index">{g.index}</span>
                <span className="pill-badge">{g.tag}</span>
              </div>
              <h4>{g.title}</h4>
              <p>{g.body}</p>
            </div>
          ))}
        </div>
        <div className="final-proof-grid">
          <div className="final-proof">
            <span className="final-proof-tag">Forward · a satisfying assignment gives a witness</span>
            <p>
              Pick one true literal occurrence per clause. Every private block is covered, so the union
              clears <em>k</em>. No triangle contributes two literals, and the truth bank never contributes
              both values of a variable, so no organ lock is crossed.
            </p>
          </div>
          <div className="final-proof">
            <span className="final-proof-tag">Backward · a witness gives a satisfying assignment</span>
            <p>
              Padding makes coverage ≥ <em>k</em> impossible unless every clause block is covered, so each
              clause supplies at least one selected literal. The triangle allows at most one. The truth bank
              forbids <em>xᵢ</em> and <em>¬xᵢ</em> together, so the selected literals are consistent.
            </p>
          </div>
        </div>
        <div className="final-open-note">
          <CircleHelp size={17} className="text-amber" />
          <span>
            <strong>Open item, stated plainly:</strong> the gadget argument is not yet a full reduction. The
            missing step is a planar layout with a polynomial grid bound and a proof that no unintended
            organ-body contact appears. That is the next piece of work, not a footnote.
          </span>
        </div>
      </section>

      {/* ================= MARKERS ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">How we got here</span>
          <h3 className="final-section-title">Four markers, one survivor</h3>
          <p className="final-section-lede">
            The earlier candidates are kept as progression markers: each one taught us which constraint we
            did not want. They are not competing proposals any more.
          </p>
        </div>
        <div className="final-marker-grid">
          {MARKERS.map((m) => (
            <button
              key={m.tab}
              className="final-marker"
              onClick={() => onNavigate(m.tab)}
              aria-label={`Open the ${m.name} progression marker`}
            >
              <div className="final-marker-top">
                <span className="final-marker-index">{m.index}</span>
                {m.icon}
              </div>
              <h4>{m.name}</h4>
              <span className="final-marker-rule">{m.rule}</span>
              <p>{m.note}</p>
              <span className="final-marker-link">
                Open marker <ArrowRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ================= FUTURE ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">Future work</span>
          <h3 className="final-section-title">What we would do with another month</h3>
        </div>
        <div className="final-future-grid">
          {FUTURE.map((item, i) => (
            <div key={item.title} className="final-future">
              <div className="final-future-top">
                {item.icon}
                <span className="final-future-index">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PROMPTS ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">Your turn</span>
          <h3 className="final-section-title">Four ways to push on the final puzzle</h3>
        </div>
        <ol className="final-prompt-list">
          <li>
            <span className="final-prompt-num">1</span>
            <div>
              <strong>Beat the lab.</strong> Solve the 6 × 6 board at <em>k = 14</em> without loading the
              oracle. Then load it and compare your witness with the verifier’s.
            </div>
          </li>
          <li>
            <span className="final-prompt-num">2</span>
            <div>
              <strong>Move a heart.</strong> Add a third organ to the 6 × 3 board, re-run{' '}
              <code>grid.py</code>, and decide whether a witness still exists before you check.
            </div>
          </li>
          <li>
            <span className="final-prompt-num">3</span>
            <div>
              <strong>Find an easy island.</strong> Name a polynomial special case (one organ, two blobs, a
              tree of bodies) and prove it. Or find the smallest grid that is still hard.
            </div>
          </li>
          <li>
            <span className="final-prompt-num">4</span>
            <div>
              <strong>Break the check.</strong> Produce a witness the verifier accepts that violates the
              rule, or explain why no such witness can exist.
            </div>
          </li>
        </ol>
      </section>

      {/* ================= PIPELINE ================= */}
      <section className="final-section">
        <div className="final-section-head">
          <span className="final-kicker">One source, every surface</span>
          <h3 className="final-section-title">The figure pipeline is part of the result</h3>
        </div>
        <div className="final-flow" aria-label="Figure pipeline">
          <span className="final-flow-step">TSV board</span>
          <ArrowRight size={15} />
          <span className="final-flow-step">grid.py 2.0</span>
          <ArrowRight size={15} />
          <span className="final-flow-step">SVG · TikZ · JSON</span>
          <ArrowRight size={15} />
          <span className="final-flow-step">poster · site · report</span>
        </div>
        <div className="final-pipeline-row">
          <p className="hint-text">
            <code>update_poster_figure.py</code> regenerates the poster’s inline SVG from the same TSV, so
            the poster cannot drift from the site. The Figure Studio mirrors the parser and the geometry in
            TypeScript for live editing.
          </p>
          <div className="final-pipeline-actions">
            <button className="neu-btn" onClick={() => onNavigate('figures')}>
              <Sparkles size={14} />
              <span>Open Figure Studio</span>
            </button>
            <a className="neu-btn" href="/poster.html" target="_blank" rel="noreferrer">
              <FileImage size={14} />
              <span>Open Poster</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

function CodeIcon() {
  return <Braces size={15} className="text-teal" />;
}
