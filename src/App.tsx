import { useState } from 'react';
import { ConundrumWorkspace } from './components/ConundrumWorkspace.tsx';
import { TimelineView } from './components/TimelineView.tsx';
import './App.css';

type AppView = 'puzzle' | 'timeline';

export function App() {
  const [view, setView] = useState<AppView>('puzzle');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-kicker">COMP3821 // GROUP 05</span>
          <h1 className="brand-title">Colouring Conundrum</h1>
          <span className="brand-formula">
            Binary XOR-Square · τ(a,b,c,d) ∈ &#123;0, 2, 4&#125;
          </span>
        </div>

        <nav className="topbar-nav" aria-label="Primary Views">
          <button
            className={`nav-tab ${view === 'puzzle' ? 'active' : ''}`}
            onClick={() => setView('puzzle')}
          >
            01 · XOR-Square Workbench
          </button>
          <button
            className={`nav-tab ${view === 'timeline' ? 'active' : ''}`}
            onClick={() => setView('timeline')}
          >
            02 · Project Timeline
          </button>
        </nav>
      </header>

      {view === 'puzzle' ? <ConundrumWorkspace /> : <TimelineView />}
    </div>
  );
}

export default App;
