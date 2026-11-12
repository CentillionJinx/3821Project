import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Layers,
  Heart,
  ShieldAlert,
  Square,
  Route,
  BookOpen,
  FileText,
  Sparkles,
  Cpu,
  Download,
  Lightbulb,
  GraduationCap,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { CarpetsFloorView } from './components/CarpetsFloorView';
import { FinalPuzzleView } from './components/FinalPuzzleView';
import { InsurgencyGameView } from './components/InsurgencyGameView';
import { XORSquaresView } from './components/XORSquaresView';
import { TrapDungeonView } from './components/TrapDungeonView';
import { ResearchedTopicsView } from './components/ResearchedTopicsView';
import { ProgressionReviewView } from './components/ProgressionReviewView';
import { BonusResearchView } from './components/BonusResearchView';
import { WebPlatformView } from './components/WebPlatformView';
import { GridFigureView } from './components/GridFigureView';
import './App.css';

export type TabId =
  | 'cand-microbes'
  | 'cand-carpets'
  | 'cand-insurgency'
  | 'cand-xor'
  | 'cand-dungeon'
  | 'citation'
  | 'review'
  | 'bonus'
  | 'platform'
  | 'figures';

const MARKERS: Record<string, { index: string; name: string }> = {
  'cand-carpets': { index: '01', name: '“Carpets” Floor' },
  'cand-insurgency': { index: '02', name: 'Quell Insurgency' },
  'cand-xor': { index: '03', name: 'XOR Squares' },
  'cand-dungeon': { index: '04', name: '3-SAT Trap Dungeon' },
};

export function App() {
  // Global Explanation Mode: 'layman' vs 'rigorous'
  const [explainMode, setExplainMode] = useState<'layman' | 'rigorous'>('rigorous');

  // Active Navigation Tab — the final puzzle opens first.
  const [activeTab, setActiveTab] = useState<TabId>('cand-microbes');

  // PWA Install Prompt State
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      setPwaPrompt(null);
    }
  };

  const activeMarker = MARKERS[activeTab];

  return (
    <div className="app-container">
      {/* ======================================================================
       * UNIFIED OBSIDIAN SIDEBAR (Term 3, 2026 • Progression Review Edition)
       * ====================================================================== */}
      <aside className="neu-header">
        <div className="header-brand">
          <div className="brand-icon-halo">
            <ShieldCheck size={28} className="halo-icon" />
          </div>
          <div>
            <h1 className="header-title">NP-Complete Puzzles</h1>
            <span className="header-badge">COMP3821 Creative Project</span>
          </div>
        </div>

        <p className="header-subtitle">
          Designing, Proving, and Verifying Original NP-complete Algorithmic Puzzles
        </p>

        {/* Global Explanation Mode Toggle */}
        <div className="mode-toggle-container">
          <button
            className={`mode-btn ${explainMode === 'layman' ? 'active-mode' : ''}`}
            onClick={() => setExplainMode('layman')}
          >
            <Lightbulb size={15} />
            <span>Layman</span>
          </button>
          <button
            className={`mode-btn ${explainMode === 'rigorous' ? 'active-mode' : ''}`}
            onClick={() => setExplainMode('rigorous')}
          >
            <GraduationCap size={15} />
            <span>Rigorous</span>
          </button>
        </div>

        {/* Navigation Tabs matching the Progression Review & Team Discussion Structure */}
        <nav className="neu-nav-group" aria-label="Main Project Modules">
          <div className="nav-section-label">Final Puzzle</div>

          <button
            className={`neu-tab final-tab ${activeTab === 'cand-microbes' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-microbes')}
          >
            <Heart size={18} className="tab-icon text-rose" />
            <div className="tab-text-col">
              <span className="tab-final-label">
                Grid-Organ <span className="nav-final-pill">final</span>
              </span>
              <small>Vital Organ Non-Overlap</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'figures' ? 'active' : ''}`}
            onClick={() => setActiveTab('figures')}
          >
            <LayoutGrid size={18} className="tab-icon text-amber" />
            <div className="tab-text-col">
              <span>Figure Studio</span>
              <small>TSV &rarr; SVG / TikZ</small>
            </div>
          </button>

          <div className="nav-section-label">Progression Markers</div>

          <button
            className={`neu-tab marker-tab ${activeTab === 'cand-carpets' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-carpets')}
          >
            <Layers size={18} className="tab-icon text-blue" />
            <div className="tab-text-col">
              <span>01 &middot; &ldquo;Carpets&rdquo; Floor</span>
              <small>Multiplicity &amp; Unique Cover</small>
            </div>
          </button>

          <button
            className={`neu-tab marker-tab ${activeTab === 'cand-insurgency' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-insurgency')}
          >
            <ShieldAlert size={18} className="tab-icon text-amber" />
            <div className="tab-text-col">
              <span>02 &middot; Quell Insurgency</span>
              <small>Firefighter Hex/Graph</small>
            </div>
          </button>

          <button
            className={`neu-tab marker-tab ${activeTab === 'cand-xor' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-xor')}
          >
            <Square size={18} className="tab-icon text-teal" />
            <div className="tab-text-col">
              <span>03 &middot; XOR Squares</span>
              <small>Parity Modulo-2 Overlaps</small>
            </div>
          </button>

          <button
            className={`neu-tab marker-tab ${activeTab === 'cand-dungeon' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-dungeon')}
          >
            <Route size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>04 &middot; 3-SAT Trap Dungeon</span>
              <small>Spatial Trap DAG</small>
            </div>
          </button>

          <div className="nav-section-label">Research &amp; Review</div>

          <button
            className={`neu-tab ${activeTab === 'citation' ? 'active' : ''}`}
            onClick={() => setActiveTab('citation')}
          >
            <BookOpen size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>Researched Topics</span>
              <small>Firefighter, Parks, Akari...</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            <FileText size={18} className="tab-icon text-amber" />
            <div className="tab-text-col">
              <span>Progression Review</span>
              <small>Team Debates &amp; Roadmap</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'bonus' ? 'active' : ''}`}
            onClick={() => setActiveTab('bonus')}
          >
            <Sparkles size={18} className="tab-icon text-teal" />
            <div className="tab-text-col">
              <span>Bonus Research</span>
              <small>ZKP &amp; NP Approximations</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'platform' ? 'active' : ''}`}
            onClick={() => setActiveTab('platform')}
          >
            <Cpu size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>Web Platform</span>
              <small>State Machine &amp; Pipeline</small>
            </div>
          </button>
        </nav>

        {/* Team & PWA Footer inside Sidebar */}
        <div className="header-actions">
          <a
            href="/poster.html"
            target="_blank"
            rel="noreferrer"
            className="neu-btn"
            style={{ textDecoration: 'none', justifyContent: 'center', width: '100%', marginBottom: '6px' }}
          >
            <FileText size={15} className="text-amber" />
            <span>Open Presentation Poster</span>
          </a>

          {pwaPrompt && (
            <button className="neu-btn-install" onClick={handleInstallPwa}>
              <Download size={15} />
              <span>Install App (PWA)</span>
            </button>
          )}

          <div className="team-sidebar-card">
            <span className="team-title">Group 5 &bull; Term 3, 2026</span>
            <ul className="team-roster">
              <li>
                <span>Edward Dsouza</span>
                <code>z5689255</code>
              </li>
              <li>
                <span>Louise Liu</span>
                <code>z5700939</code>
              </li>
              <li>
                <span>Emmett Shang</span>
                <code>z5690546</code>
              </li>
              <li>
                <span>Gururam Subramanian</span>
                <code>z5636559</code>
              </li>
              <li>
                <span>Ryan Zhou</span>
                <code>z5688014</code>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* ======================================================================
       * MAIN CONTENT AREA (Active Tab Routing)
       * ====================================================================== */}
      <main className="main-viewport">
        {/* Top Poster-Style Framing Bar */}
        <header className="viewport-top-header">
          <div className="poster-style-frame">
            <div className="thin-gold-line" />
            <div className="gold-bullet" />
            <span className="poster-frame-title">
              UNSW COMP3821 EXTENDED ALGORITHMS &bull; TERM 3, 2026 &bull; GROUP 5
            </span>
            <div className="gold-bullet" />
            <div className="thin-gold-line" />
          </div>
          <div className="viewport-title-row">
            <div>
              <h2 className="viewport-main-title">
                One Puzzle Remains: <span className="title-gold-underline">Grid-Organ</span>
              </h2>
              <p className="viewport-tagline">
                Five candidate gadgets, one survivor — a local organ invariant, an exact verifier, and one
                figure pipeline feeding the poster, the site, and the report.
              </p>
            </div>
          </div>
        </header>

        {activeMarker && (
          <div className="marker-ribbon">
            <div className="marker-ribbon-main">
              <span className="marker-ribbon-kicker">
                Progression marker {activeMarker.index} of 04
              </span>
              <span className="marker-ribbon-title">{activeMarker.name}</span>
              <span className="marker-ribbon-note">
                Archived exploration, kept for the record. The final puzzle is Grid-Organ.
              </span>
            </div>
            <button className="neu-btn" onClick={() => setActiveTab('cand-microbes')}>
              <Heart size={14} className="text-rose" />
              <span>Back to the final</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {activeTab === 'cand-microbes' && (
          <FinalPuzzleView explainMode={explainMode} onNavigate={setActiveTab} />
        )}
        {activeTab === 'cand-carpets' && <CarpetsFloorView explainMode={explainMode} />}
        {activeTab === 'cand-insurgency' && <InsurgencyGameView explainMode={explainMode} />}
        {activeTab === 'cand-xor' && <XORSquaresView explainMode={explainMode} />}
        {activeTab === 'cand-dungeon' && <TrapDungeonView explainMode={explainMode} />}
        {activeTab === 'citation' && <ResearchedTopicsView explainMode={explainMode} />}
        {activeTab === 'review' && <ProgressionReviewView explainMode={explainMode} />}
        {activeTab === 'bonus' && <BonusResearchView explainMode={explainMode} />}
        {activeTab === 'platform' && <WebPlatformView explainMode={explainMode} />}
        {activeTab === 'figures' && <GridFigureView explainMode={explainMode} />}
      </main>
    </div>
  );
}

export default App;
