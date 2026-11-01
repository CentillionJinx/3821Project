import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Square,
  Heart,
  Route,
  BookOpen,
  FileText,
  Sparkles,
  Cpu,
  Download,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import { XORSquaresView } from './components/XORSquaresView';
import { CarpetsHeartsView } from './components/CarpetsHeartsView';
import { TrapDungeonView } from './components/TrapDungeonView';
import { ResearchedTopicsView } from './components/ResearchedTopicsView';
import { ProgressionReviewView } from './components/ProgressionReviewView';
import { BonusResearchView } from './components/BonusResearchView';
import { WebPlatformView } from './components/WebPlatformView';
import './App.css';

export type TabId =
  | 'cand-xor'
  | 'cand-parks'
  | 'cand-dungeon'
  | 'citation'
  | 'review'
  | 'bonus'
  | 'platform';

export function App() {
  // Global Explanation Mode: 'layman' vs 'rigorous'
  const [explainMode, setExplainMode] = useState<'layman' | 'rigorous'>('rigorous');

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabId>('cand-xor');

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

        {/* Navigation Tabs matching the Progression Review Structure */}
        <nav className="neu-nav-group" aria-label="Main Project Modules">
          <div className="nav-section-label">Original Puzzle Candidates</div>

          <button
            className={`neu-tab ${activeTab === 'cand-xor' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-xor')}
          >
            <Square size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>1. XOR Squares</span>
              <small>Parity &amp; Overlap Gadgets</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'cand-parks' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-parks')}
          >
            <Heart size={18} className="tab-icon text-rose" />
            <div className="tab-text-col">
              <span>2. Carpets &amp; Hearts</span>
              <small>Parks Problem Reduction</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'cand-dungeon' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-dungeon')}
          >
            <Route size={18} className="tab-icon text-blue" />
            <div className="tab-text-col">
              <span>3. 3-SAT Trap Dungeon</span>
              <small>Switch &amp; Trap Traversal</small>
            </div>
          </button>

          <div className="nav-section-label">Research &amp; Progression Review</div>

          <button
            className={`neu-tab ${activeTab === 'citation' ? 'active' : ''}`}
            onClick={() => setActiveTab('citation')}
          >
            <BookOpen size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>4. Researched Topics</span>
              <small>Citation Channel Gadgets</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            <FileText size={18} className="tab-icon text-amber" />
            <div className="tab-text-col">
              <span>5. Progression Review</span>
              <small>Scope, Learnings &amp; Plan</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'bonus' ? 'active' : ''}`}
            onClick={() => setActiveTab('bonus')}
          >
            <Sparkles size={18} className="tab-icon text-teal" />
            <div className="tab-text-col">
              <span>6. Bonus Research</span>
              <small>ZKP &amp; NP Approximations</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'platform' ? 'active' : ''}`}
            onClick={() => setActiveTab('platform')}
          >
            <Cpu size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>7. Web Platform</span>
              <small>State Machine &amp; Pipeline</small>
            </div>
          </button>
        </nav>

        {/* Team & PWA Footer inside Sidebar */}
        <div className="header-actions">
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
        {activeTab === 'cand-xor' && <XORSquaresView explainMode={explainMode} />}
        {activeTab === 'cand-parks' && <CarpetsHeartsView explainMode={explainMode} />}
        {activeTab === 'cand-dungeon' && <TrapDungeonView explainMode={explainMode} />}
        {activeTab === 'citation' && <ResearchedTopicsView explainMode={explainMode} />}
        {activeTab === 'review' && <ProgressionReviewView explainMode={explainMode} />}
        {activeTab === 'bonus' && <BonusResearchView explainMode={explainMode} />}
        {activeTab === 'platform' && <WebPlatformView explainMode={explainMode} />}
      </main>
    </div>
  );
}

export default App;
