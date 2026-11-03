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
} from 'lucide-react';
import { CarpetsFloorView } from './components/CarpetsFloorView';
import { HeartsMicrobesView } from './components/HeartsMicrobesView';
import { InsurgencyGameView } from './components/InsurgencyGameView';
import { XORSquaresView } from './components/XORSquaresView';
import { TrapDungeonView } from './components/TrapDungeonView';
import { ResearchedTopicsView } from './components/ResearchedTopicsView';
import { ProgressionReviewView } from './components/ProgressionReviewView';
import { BonusResearchView } from './components/BonusResearchView';
import { WebPlatformView } from './components/WebPlatformView';
import './App.css';

export type TabId =
  | 'cand-carpets'
  | 'cand-microbes'
  | 'cand-insurgency'
  | 'cand-xor'
  | 'cand-dungeon'
  | 'citation'
  | 'review'
  | 'bonus'
  | 'platform';

export function App() {
  // Global Explanation Mode: 'layman' vs 'rigorous'
  const [explainMode, setExplainMode] = useState<'layman' | 'rigorous'>('rigorous');

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabId>('cand-carpets');

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

        {/* Navigation Tabs matching the Progression Review & Team Discussion Structure */}
        <nav className="neu-nav-group" aria-label="Main Project Modules">
          <div className="nav-section-label">Team Proposed Puzzles</div>

          <button
            className={`neu-tab ${activeTab === 'cand-carpets' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-carpets')}
          >
            <Layers size={18} className="tab-icon text-blue" />
            <div className="tab-text-col">
              <span>1. &ldquo;Carpets&rdquo; Floor</span>
              <small>Multiplicity &amp; Unique Cover</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'cand-microbes' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-microbes')}
          >
            <Heart size={18} className="tab-icon text-rose" />
            <div className="tab-text-col">
              <span>2. Hearts // Microbes</span>
              <small>Vital Organ Non-Overlap</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'cand-insurgency' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-insurgency')}
          >
            <ShieldAlert size={18} className="tab-icon text-amber" />
            <div className="tab-text-col">
              <span>3. Quell Insurgency</span>
              <small>Firefighter Hex/Graph</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'cand-xor' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-xor')}
          >
            <Square size={18} className="tab-icon text-teal" />
            <div className="tab-text-col">
              <span>4. XOR Squares</span>
              <small>Parity Modulo-2 Overlaps</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'cand-dungeon' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand-dungeon')}
          >
            <Route size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>5. 3-SAT Trap Dungeon</span>
              <small>Spatial Trap DAG</small>
            </div>
          </button>

          <div className="nav-section-label">Research &amp; Progression Review</div>

          <button
            className={`neu-tab ${activeTab === 'citation' ? 'active' : ''}`}
            onClick={() => setActiveTab('citation')}
          >
            <BookOpen size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>6. Researched Topics</span>
              <small>Firefighter, Parks, Akari...</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            <FileText size={18} className="tab-icon text-amber" />
            <div className="tab-text-col">
              <span>7. Progression Review</span>
              <small>Team Debates &amp; Roadmap</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'bonus' ? 'active' : ''}`}
            onClick={() => setActiveTab('bonus')}
          >
            <Sparkles size={18} className="tab-icon text-teal" />
            <div className="tab-text-col">
              <span>8. Bonus Research</span>
              <small>ZKP &amp; NP Approximations</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'platform' ? 'active' : ''}`}
            onClick={() => setActiveTab('platform')}
          >
            <Cpu size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>9. Web Platform</span>
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
        {activeTab === 'cand-carpets' && <CarpetsFloorView explainMode={explainMode} />}
        {activeTab === 'cand-microbes' && <HeartsMicrobesView explainMode={explainMode} />}
        {activeTab === 'cand-insurgency' && <InsurgencyGameView explainMode={explainMode} />}
        {activeTab === 'cand-xor' && <XORSquaresView explainMode={explainMode} />}
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
