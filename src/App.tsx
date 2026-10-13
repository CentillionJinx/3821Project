import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  RotateCcw, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  Download,
  Lightbulb,
  GraduationCap,
  Plus,
  Trash2,
  Clock,
  Zap,
  Lock
} from 'lucide-react';
import { SAMPLE_FORMULAS, verifySolution, findSatisfyingAssignments } from './logic/verifier';
import { buildGridFromSat, type GadgetMap } from './logic/gridReduction';
import type { TruthAssignment, SatFormula, Clause, Literal } from './types/puzzle';
import './App.css';

export function App() {
  // Global Mode: 'layman' vs 'rigorous'
  const [explainMode, setExplainMode] = useState<'layman' | 'rigorous'>('layman');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'puzzle' | 'reduction' | 'timemachine' | 'zkp' | 'theory'>('puzzle');

  // Selected preset formula or custom
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState<number>(0);
  const [activeFormula, setActiveFormula] = useState<SatFormula>(SAMPLE_FORMULAS[0].formula);

  // User's candidate solution assignment: xi -> boolean
  const [assignment, setAssignment] = useState<TruthAssignment>({
    x1: true,
    x2: false,
    x3: true,
  });

  // Staged reduction compiler state
  const [reductionStage, setReductionStage] = useState<number>(4);
  const [isAutoPlayingReduction, setIsAutoPlayingReduction] = useState<boolean>(false);

  // Time Machine (P vs NP) variables count slider
  const [timeN, setTimeN] = useState<number>(10);

  // Interactive ZKP Game state
  const [zkpRound, setZkpRound] = useState<number>(0);
  const [zkpSuccessRounds, setZkpSuccessRounds] = useState<number>(0);
  const [zkpHistory, setZkpHistory] = useState<{ round: number; clause: string; challengedLit: string; passed: boolean }[]>([]);
  const [zkpActiveChallenge, setZkpActiveChallenge] = useState<string | null>(null);

  // PWA Prompt
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const outcome = await pwaPrompt.userChoice;
      if (outcome.outcome === 'accepted') {
        setPwaPrompt(null);
      }
    }
  };

  // Synchronize formula selection
  const handleSelectFormulaPreset = (idx: number) => {
    setSelectedFormulaIndex(idx);
    const chosen = SAMPLE_FORMULAS[idx].formula;
    setActiveFormula(chosen);
    const fresh: TruthAssignment = {};
    chosen.variables.forEach((v) => {
      fresh[v] = true;
    });
    setAssignment(fresh);
  };

  // Run NP-verifier against current candidate assignment
  const verification = verifySolution(activeFormula, assignment);

  // Build grid gadget visualization with current reduction stage
  const gadgetMap: GadgetMap = buildGridFromSat(activeFormula, assignment, reductionStage);

  // Auto-play reduction steps animation
  useEffect(() => {
    let timer: any;
    if (isAutoPlayingReduction) {
      timer = setInterval(() => {
        setReductionStage((prev) => {
          if (prev >= 4) {
            setIsAutoPlayingReduction(false);
            return 4;
          }
          return prev + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isAutoPlayingReduction]);


  const setVariableDirect = (varName: string, val: boolean) => {
    setAssignment((prev) => ({
      ...prev,
      [varName]: val,
    }));
  };

  const handleSolveAutomatically = () => {
    const solutions = findSatisfyingAssignments(activeFormula);
    if (solutions.length > 0) {
      setAssignment(solutions[0]);
    }
  };

  const handleReset = () => {
    const fresh: TruthAssignment = {};
    activeFormula.variables.forEach((v) => {
      fresh[v] = false;
    });
    setAssignment(fresh);
  };

  // CUSTOM FORMULA BUILDER ACTIONS
  const handleAddClause = () => {
    const newId = `C${activeFormula.clauses.length + 1}`;
    const v1 = activeFormula.variables[0] || 'x1';
    const v2 = activeFormula.variables[1] || 'x2';
    const v3 = activeFormula.variables[2] || activeFormula.variables[0];

    const newClause: Clause = {
      id: newId,
      literals: [
        { variable: v1, isNegated: false },
        { variable: v2, isNegated: true },
        { variable: v3, isNegated: false },
      ],
    };

    setActiveFormula((prev) => ({
      ...prev,
      clauses: [...prev.clauses, newClause],
    }));
    setSelectedFormulaIndex(-1); // Custom
  };

  const handleToggleLiteral = (clauseIndex: number, litIndex: number) => {
    setActiveFormula((prev) => {
      const copyClauses = [...prev.clauses];
      const targetClause = { ...copyClauses[clauseIndex] };
      const targetLits = [...targetClause.literals] as [Literal, Literal, Literal];
      targetLits[litIndex] = {
        ...targetLits[litIndex],
        isNegated: !targetLits[litIndex].isNegated,
      };
      targetClause.literals = targetLits;
      copyClauses[clauseIndex] = targetClause;
      return {
        ...prev,
        clauses: copyClauses,
      };
    });
    setSelectedFormulaIndex(-1);
  };

  const handleCycleVariable = (clauseIndex: number, litIndex: number) => {
    setActiveFormula((prev) => {
      const copyClauses = [...prev.clauses];
      const targetClause = { ...copyClauses[clauseIndex] };
      const targetLits = [...targetClause.literals] as [Literal, Literal, Literal];
      const currentVar = targetLits[litIndex].variable;
      const currentVarIdx = prev.variables.indexOf(currentVar);
      const nextVar = prev.variables[(currentVarIdx + 1) % prev.variables.length];

      targetLits[litIndex] = {
        ...targetLits[litIndex],
        variable: nextVar,
      };
      targetClause.literals = targetLits;
      copyClauses[clauseIndex] = targetClause;
      return {
        ...prev,
        clauses: copyClauses,
      };
    });
    setSelectedFormulaIndex(-1);
  };

  const handleDeleteClause = (clauseIndex: number) => {
    if (activeFormula.clauses.length <= 1) return;
    setActiveFormula((prev) => ({
      ...prev,
      clauses: prev.clauses.filter((_, i) => i !== clauseIndex),
    }));
    setSelectedFormulaIndex(-1);
  };


  // ZERO-KNOWLEDGE PROOF CHALLENGE SIMULATOR
  const handleRunZkpChallenge = (clauseId: string) => {
    const targetClause = activeFormula.clauses.find((c) => c.id === clauseId);
    if (!targetClause) return;

    // Check if the secret assignment actually satisfies this clause
    const trueLit = targetClause.literals.find((lit) => {
      const v = assignment[lit.variable];
      return lit.isNegated ? !v : v;
    });

    const passed = Boolean(trueLit);
    const newRound = zkpRound + 1;
    setZkpRound(newRound);
    if (passed) {
      setZkpSuccessRounds((prev) => prev + 1);
    }
    setZkpActiveChallenge(clauseId);
    setZkpHistory((prev) => [
      {
        round: newRound,
        clause: clauseId,
        challengedLit: trueLit ? `${trueLit.isNegated ? '¬' : ''}${trueLit.variable}` : 'NONE (Conflict Caught!)',
        passed,
      },
      ...prev.slice(0, 9),
    ]);
  };

  const handleResetZkp = () => {
    setZkpRound(0);
    setZkpSuccessRounds(0);
    setZkpHistory([]);
    setZkpActiveChallenge(null);
  };

  // Time Machine calculations (Exponential vs Polynomial)
  const computeComplexity = (n: number) => {
    const polySteps = n * 3; // O(n) checking
    const polySeconds = (polySteps * 0.000000001); // 1 GHz CPU
    const expSteps = Math.pow(2, n);
    const expSeconds = expSteps * 0.000000001; // 1 step per nanosecond

    let expHumanTime = '';
    if (expSeconds < 0.001) {
      expHumanTime = `${(expSeconds * 1000).toFixed(3)} milliseconds`;
    } else if (expSeconds < 60) {
      expHumanTime = `${expSeconds.toFixed(2)} seconds`;
    } else if (expSeconds < 3600) {
      expHumanTime = `${(expSeconds / 60).toFixed(1)} minutes`;
    } else if (expSeconds < 86400 * 365) {
      expHumanTime = `${(expSeconds / 86400).toFixed(1)} days`;
    } else if (expSeconds < 86400 * 365 * 1000000) {
      expHumanTime = `${(expSeconds / (86400 * 365)).toLocaleString(undefined, { maximumFractionDigits: 0 })} years`;
    } else {
      expHumanTime = '> Age of the Universe (13.8 Billion Years)';
    }

    return {
      polySteps,
      polyHumanTime: `${(polySeconds * 1000000).toFixed(2)} microseconds`,
      expSteps,
      expHumanTime,
    };
  };

  const timeMetrics = computeComplexity(timeN);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <header className="neu-header">
        <div className="header-brand">
          <div className="brand-badge-ruby" title="NP Complexity Indicator">
            <span className="ruby-dot" />
            <span className="ruby-label">NP-C</span>
          </div>
          <div>
            <h1 className="header-title">NP-GridLab</h1>
            <p className="header-subtitle">Interactive NP-Completeness &amp; Gadget Reductions</p>
          </div>
        </div>

        {/* Global Explanation Mode Toggle: Layman vs Rigorous */}
        <div className="explain-mode-toggle" title="Switch between intuitive metaphors and formal CS definitions">
          <button
            className={`mode-btn ${explainMode === 'layman' ? 'active-mode' : ''}`}
            onClick={() => setExplainMode('layman')}
          >
            <Lightbulb size={16} />
            <span>Layman 💡</span>
          </button>
          <button
            className={`mode-btn ${explainMode === 'rigorous' ? 'active-mode' : ''}`}
            onClick={() => setExplainMode('rigorous')}
          >
            <GraduationCap size={16} />
            <span>Rigorous 🎓</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="neu-nav-group">
          <button 
            className={`neu-tab ${activeTab === 'puzzle' ? 'active' : ''}`}
            onClick={() => setActiveTab('puzzle')}
          >
            <ShieldCheck size={18} className="tab-icon" />
            <span>Interactive Verifier</span>
          </button>
          <button 
            className={`neu-tab ${activeTab === 'reduction' ? 'active' : ''}`}
            onClick={() => setActiveTab('reduction')}
          >
            <Cpu size={18} className="tab-icon" />
            <span>Reduction Gadgets</span>
          </button>
          <button 
            className={`neu-tab ${activeTab === 'timemachine' ? 'active' : ''}`}
            onClick={() => setActiveTab('timemachine')}
          >
            <Clock size={18} className="tab-icon" />
            <span>P vs NP Time Machine</span>
          </button>
          <button 
            className={`neu-tab ${activeTab === 'zkp' ? 'active' : ''}`}
            onClick={() => setActiveTab('zkp')}
          >
            <Sparkles size={18} className="tab-icon" />
            <span>Zero-Knowledge Game</span>
          </button>
          <button 
            className={`neu-tab ${activeTab === 'theory' ? 'active' : ''}`}
            onClick={() => setActiveTab('theory')}
          >
            <BookOpen size={18} className="tab-icon" />
            <span>Proof Recipe &amp; Fallbacks</span>
          </button>
        </nav>

        {/* PWA & Info Quick Bar */}
        <div className="header-actions">
          {pwaPrompt && (
            <button className="neu-btn neu-btn-install" onClick={handleInstallPwa} title="Install Native PWA">
              <Download size={16} />
              <span>Install PWA</span>
            </button>
          )}
          <div className="group-badge" title="COMP3821 Group Project">
            <span>COMP3821 &bull; 2026</span>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="app-body">
        {/* Dynamic Educational Hero banner based on active mode */}
        <section className="edu-hero">
          <div className="edu-hero-icon" aria-hidden="true">
            {explainMode === 'layman' ? <Lightbulb size={24} /> : <GraduationCap size={24} />}
          </div>
          <div className="edu-hero-content">
            {explainMode === 'layman' ? (
              <p>
                <strong>The Core Idea (In Plain English):</strong> Solving a giant maze from scratch is painfully slow &mdash; you could wander down dead ends for hours (that's <strong>NP</strong>). But if a friend gives you their solved path, you can trace your finger along it in 10 seconds to confirm they never touched a wall (that's <strong>Polynomial Verification</strong>). 
                Here, test certificates by flipping switches, watch formulas translate into logical circuits, and challenge a zero-knowledge prover!
              </p>
            ) : (
              <p>
                <strong>COMP3821 Formal Objective:</strong> Investigating the computational complexity class <strong>NP-complete</strong> by formulating an original decision problem <em>X</em>, constructing a deterministic polynomial-time verifier <em>V(x, w) &isin; &#123;0, 1&#125;</em> to establish <em>X &isin; NP</em>, and demonstrating a polynomial-time reduction <em>3-SAT &le;<sub>p</sub> X</em> via gadget correspondence.
              </p>
            )}
          </div>
        </section>

        {/* Global Controls Bar */}
        <section className="neu-controls-bar">
          <div className="formula-selector">
            <span className="selector-label">
              {explainMode === 'layman' ? 'Choose a Puzzle Challenge:' : 'Target 3-SAT Instance:'}
            </span>
            <div className="select-pill-group">
              {SAMPLE_FORMULAS.map((item, idx) => (
                <button
                  key={idx}
                  className={`neu-pill ${selectedFormulaIndex === idx ? 'active' : ''}`}
                  onClick={() => handleSelectFormulaPreset(idx)}
                >
                  {item.name}
                </button>
              ))}
              <button
                className={`neu-pill ${selectedFormulaIndex === -1 ? 'active' : ''}`}
                onClick={() => setSelectedFormulaIndex(-1)}
              >
                Custom Sandbox &Xi;
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button className="neu-action-btn" onClick={handleSolveAutomatically} title="Witness Finder (NP-Oracle)">
              <Sparkles size={16} className="btn-icon-accent" />
              <span>{explainMode === 'layman' ? 'Magic Solver 🪄' : 'Solve (Oracle)'}</span>
            </button>
            <button className="neu-action-btn" onClick={handleReset} title="Reset candidate solution">
              <RotateCcw size={16} />
              <span>Clear</span>
            </button>
          </div>

          <div className="controls-hint">
            <p>
              {explainMode === 'layman' ? (
                <>
                  <strong>Quick tip:</strong> Flip the variable switches below to test different guesses. 
                  If all clauses turn green mint, you found a valid certificate! <strong>Magic Solver</strong> instantly checks combinations for you.
                </>
              ) : (
                <>
                  <strong>Execution semantics:</strong> Candidate certificate &sigma; &isin; &#123;0, 1&#125;<sup>n</sup> is evaluated across all <em>m</em> clauses. 
                  Verification runs deterministically in <em>O(n + m)</em> operations.
                </>
              )}
            </p>
          </div>
        </section>

        {/* TAB 1: INTERACTIVE VERIFIER & PUZZLE SANDBOX */}
        {activeTab === 'puzzle' && (
          <div className="content-layout">
            {/* Left Column: Interactive Formula & Custom Builder */}
            <div className="left-panel">
              {/* Formula & Builder Card */}
              <div className="neu-card">
                <div className="card-header">
                  <h3 className="card-title">
                    {explainMode === 'layman' ? '1. The Rules of the Game (Formula φ)' : 'Instance Formula φ & Clause Matrix'}
                  </h3>
                  <div className="card-header-actions">
                    <span className="formula-size-badge">
                      {activeFormula.variables.length} Vars &bull; {activeFormula.clauses.length} Clauses
                    </span>
                    <button className="neu-pill-btn" onClick={handleAddClause} title="Add another clause">
                      <Plus size={14} /> Add Clause
                    </button>
                  </div>
                </div>

                <div className="edu-note">
                  {explainMode === 'layman' ? (
                    <p>
                      <strong>The Dinner Party Metaphor:</strong> Each parenthesis is a <strong>party table</strong>. Each table demands that at least <strong>one person</strong> they like shows up! 
                      A symbol like <code>¬x1</code> means they want Guest 1 to stay home. Click any letter to swap who is invited, or click <code>¬</code> to negate!
                    </p>
                  ) : (
                    <p>
                      A 3-CNF formula is an <strong>AND</strong> of clauses, each an <strong>OR</strong> of 3 literals (<em>l</em><sub>1</sub> &lor; <em>l</em><sub>2</sub> &lor; <em>l</em><sub>3</sub>). 
                      The decision problem asks: &exist; &sigma; : &phi;(&sigma;) = 1? Click any literal to toggle negation, or click &bull; to cycle variables.
                    </p>
                  )}
                </div>

                {/* Mathematical Interactive Expression Box */}
                <div className="math-expression-neu">
                  <span className="math-phi">&phi; = </span>
                  {activeFormula.clauses.map((clause, cIdx) => (
                    <span key={clause.id} className="clause-token interactive-clause-token">
                      <span className="paren">(</span>
                      {clause.literals.map((lit, lIdx) => {
                        const val = assignment[lit.variable];
                        const isTrue = val !== undefined ? (lit.isNegated ? !val : val) : false;
                        return (
                          <React.Fragment key={lIdx}>
                            <button
                              className={`literal-token clickable-token ${isTrue ? 'lit-satisfied' : 'lit-falsified'}`}
                              onClick={() => handleToggleLiteral(cIdx, lIdx)}
                              title="Click to toggle negation (NOT)"
                            >
                              {lit.isNegated ? '¬' : ''}{lit.variable}
                            </button>
                            <button
                              className="cycle-var-dot"
                              onClick={() => handleCycleVariable(cIdx, lIdx)}
                              title="Cycle to next variable"
                            >
                              &bull;
                            </button>
                            {lIdx < 2 && <span className="or-op">&or;</span>}
                          </React.Fragment>
                        );
                      })}
                      <span className="paren">)</span>
                      {activeFormula.clauses.length > 1 && (
                        <button 
                          className="delete-clause-btn" 
                          onClick={() => handleDeleteClause(cIdx)} 
                          title="Delete clause"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                      {cIdx < activeFormula.clauses.length - 1 && <span className="and-op">&and;</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Variable Assignment Gadgets (Interactive Certificate Chooser) */}
              <div className="neu-card">
                <div className="card-header">
                  <h3 className="card-title">
                    {explainMode === 'layman' ? '2. Your Attempted Solution (Light Switches)' : 'Candidate Certificate σ (Truth Assignment)'}
                  </h3>
                  <span className="info-tag">{explainMode === 'layman' ? 'Your Guess' : 'Witness Candidate'}</span>
                </div>
                <p className="card-description">
                  {explainMode === 'layman' ? (
                    'Flip each person\'s attendance switch to True or False. See if your combination satisfies all tables simultaneously.'
                  ) : (
                    'Deterministic verifier inputs assignment vector σ ∈ {0, 1}^n. Check takes linear O(n + m) time.'
                  )}
                </p>

                <div className="variables-grid">
                  {activeFormula.variables.map((varName) => {
                    const isTrue = assignment[varName] === true;
                    return (
                      <div key={varName} className="variable-row-neu">
                        <span className="variable-tag">{varName}</span>
                        <div className="toggle-switch-neu">
                          <button
                            className={`toggle-option ${!isTrue ? 'active-f' : ''}`}
                            onClick={() => setVariableDirect(varName, false)}
                          >
                            False (0)
                          </button>
                          <button
                            className={`toggle-option ${isTrue ? 'active-t' : ''}`}
                            onClick={() => setVariableDirect(varName, true)}
                          >
                            True (1)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clause Status Verification Breakdown */}
              <div className="neu-card">
                <div className="card-header">
                  <h3 className="card-title">
                    {explainMode === 'layman' ? '3. Table Happiness Check' : 'Polynomial Clause Verification'}
                  </h3>
                  <span className="status-ratio">
                    {verification.satisfiedClausesCount} / {verification.totalClausesCount} Sat
                  </span>
                </div>

                <div className="clause-verification-list">
                  {activeFormula.clauses.map((clause) => {
                    const satisfied = clause.literals.some((lit) => {
                      const v = assignment[lit.variable];
                      return lit.isNegated ? !v : v;
                    });

                    return (
                      <div key={clause.id} className={`clause-row ${satisfied ? 'clause-pass' : 'clause-fail'}`}>
                        <div className="clause-id-pill">{clause.id}</div>
                        <div className="clause-body">
                          {clause.literals.map((lit, i) => {
                            const v = assignment[lit.variable];
                            const litVal = lit.isNegated ? !v : v;
                            return (
                              <span key={i} className={`clause-body-lit ${litVal ? 'lit-body-true' : 'lit-body-false'}`}>
                                {lit.isNegated ? '¬' : ''}{lit.variable} {litVal ? '✓' : '✗'}
                                {i < 2 ? ' ∨ ' : ''}
                              </span>
                            );
                          })}
                        </div>
                        <div className="clause-status-indicator">
                          {satisfied ? (
                            <span className="badge-pass">
                              <CheckCircle2 size={16} /> {explainMode === 'layman' ? 'Happy! 😊' : 'Satisfied'}
                            </span>
                          ) : (
                            <span className="badge-fail">
                              <AlertTriangle size={16} /> {explainMode === 'layman' ? 'Unhappy! 😠' : 'Violated'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Verifier Decision Card & Layman Inspector */}
            <div className="right-panel">
              <div className={`neu-card verifier-decision-card ${verification.isSatisfied ? 'verdict-accepted' : 'verdict-rejected'}`}>
                <div className="verifier-badge">
                  {verification.isSatisfied ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
                </div>

                <div className="verifier-headline">
                  <h2>{verification.isSatisfied ? 'VERIFIED: ACCEPT (1)' : 'REJECT (0)'}</h2>
                  <p className="verdict-time-poly">O(n + m) Deterministic Verifier</p>
                  <p className="verdict-explain">
                    {explainMode === 'layman' ? (
                      verification.isSatisfied ? (
                        'Awesome! Every table has at least one person they wanted. The whole party works!'
                      ) : (
                        'Uh oh! At least one table has zero friends attending. The guest list fails!'
                      )
                    ) : (
                      verification.isSatisfied ? (
                        'All m clauses evaluate to TRUE under certificate σ. Certificate valid.'
                      ) : (
                        'Empty truth evaluation detected in violated clauses. Verifier rejects certificate.'
                      )
                    )}
                  </p>
                </div>

                <div className="verifier-status-box">
                  <div className="status-metric">
                    <span className="metric-label">All Clauses Satisfied?</span>
                    <span className={`metric-val ${verification.allClausesSatisfied ? 'val-good' : 'val-bad'}`}>
                      {verification.allClausesSatisfied ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="status-metric">
                    <span className="metric-label">Polynomial Verifier Result</span>
                    <span className={`metric-val ${verification.isSatisfied ? 'val-good' : 'val-bad'}`}>
                      {verification.isSatisfied ? 'ACCEPT (1)' : 'REJECT (0)'}
                    </span>
                  </div>
                </div>

                {verification.conflictDetails.length > 0 && (
                  <div className="conflict-box">
                    <h4 className="conflict-title">Violations Encountered:</h4>
                    <ul>
                      {verification.conflictDetails.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Layman vs Rigorous Educational Card */}
              <div className="neu-card edu-takeaway">
                <h4 className="takeaway-title">
                  {explainMode === 'layman' ? '💡 The Takeaway' : '🎓 Theoretical Implication'}
                </h4>
                {explainMode === 'layman' ? (
                  <p>
                    Notice how fast the computer verified your answer: it checked just <strong>{activeFormula.clauses.length} tables</strong>. 
                    It didn't need to try millions of possibilities &mdash; it only checked your specific paper. That is why <strong>verification is easy (P)</strong> even when finding the answer is brutally hard!
                  </p>
                ) : (
                  <p>
                    Because certificate &sigma; can be verified in time <em>O(|&phi;|)</em>, the decision problem <strong>3-SAT &isin; NP</strong>. 
                    This establishes Step 1 of the standard NP-completeness recipe.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REDUCTION GADGETS & LIVE COMPILER */}
        {activeTab === 'reduction' && (
          <div className="reduction-layout">
            <div className="neu-card full-width-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    {explainMode === 'layman' ? 'From Math to a Physical Grid (The Universal Translator)' : 'Polynomial Reduction: 3-SAT ≤p Grid Puzzle X'}
                  </h3>
                  <p className="card-description">
                    {explainMode === 'layman' ? (
                      'Watch how a 3-SAT formula translates into electrical wires and gates on a grid. Toggle stages to see each piece assemble!'
                    ) : (
                      'Step-by-step polynomial mapping f(φ) = G. Variable gadgets route truth polarities through corridor channels into 3-input clause beacons.'
                    )}
                  </p>
                </div>

                {/* Staged Reduction Stepper */}
                <div className="reduction-stepper-neu">
                  <span className="stepper-label">Assembly Stage:</span>
                  <div className="stepper-buttons">
                    <button 
                      className={`step-btn ${reductionStage === 1 ? 'step-active' : ''}`}
                      onClick={() => setReductionStage(1)}
                    >
                      1. Switches
                    </button>
                    <button 
                      className={`step-btn ${reductionStage === 2 ? 'step-active' : ''}`}
                      onClick={() => setReductionStage(2)}
                    >
                      2. Wires
                    </button>
                    <button 
                      className={`step-btn ${reductionStage === 3 ? 'step-active' : ''}`}
                      onClick={() => setReductionStage(3)}
                    >
                      3. Gates
                    </button>
                    <button 
                      className={`step-btn ${reductionStage === 4 ? 'step-active' : ''}`}
                      onClick={() => setReductionStage(4)}
                    >
                      4. Live Power
                    </button>
                    <button 
                      className="neu-pill-btn auto-step-btn"
                      onClick={() => {
                        setReductionStage(1);
                        setIsAutoPlayingReduction(true);
                      }}
                    >
                      <Zap size={14} /> Auto-Animate
                    </button>
                  </div>
                </div>
              </div>

              {/* Staged Explanation Banner */}
              <div className="edu-note">
                {reductionStage === 1 && (
                  <p>
                    <strong>Stage 1 (Variable Switches):</strong> At the top row, each variable gets two cells: True (T) and False (F). 
                    A valid puzzle solution can pick at most one cell per column. This physically models a boolean choice!
                  </p>
                )}
                {reductionStage === 2 && (
                  <p>
                    <strong>Stage 2 (Corridor Wires):</strong> Corridors extend downwards. They carry the electric signal of whether 
                    <em>x<sub>i</sub></em> was set to True or False without interfering with neighboring variables.
                  </p>
                )}
                {reductionStage === 3 && (
                  <p>
                    <strong>Stage 3 (Clause Gates &amp; Beacons):</strong> At the bottom, each clause <em>C<sub>j</sub></em> connects 3 literal wires. 
                    The clause beacon requires power from at least 1 wire to light up!
                  </p>
                )}
                {reductionStage === 4 && (
                  <p>
                    <strong>Stage 4 (Live Current Flow):</strong> The circuit is complete! 
                    Look at the glowing mint cells (#7efed9) &mdash; power flows from your variable switches straight down into satisfied clause beacons.
                  </p>
                )}
              </div>

              {/* Visual Grid Gadget Matrix */}
              <div className="grid-gadget-container">
                <div 
                  className="gadget-matrix" 
                  style={{ gridTemplateColumns: `repeat(${gadgetMap.cols}, minmax(46px, 1fr))` }}
                >
                  {gadgetMap.cells.map((rowCells, rIdx) => (
                    rowCells.map((cell, cIdx) => {
                      const isVariable = cell.kind === 'variable-true' || cell.kind === 'variable-false';
                      const isClause = cell.kind === 'clause-slot';
                      const isCorridor = cell.kind === 'wire-corridor';
                      const isBeacon = cell.kind === 'beacon';

                      let cellClass = 'empty-cell';
                      if (cell.kind === 'wall') cellClass = 'wall-cell';
                      if (isVariable) cellClass = `var-cell ${cell.value ? 'selected-var' : 'unselected-var'}`;
                      if (isCorridor) cellClass = 'corridor-cell';
                      if (isClause) cellClass = `clause-slot-cell ${cell.value ? 'slot-powered' : 'slot-dormant'}`;
                      if (isBeacon) cellClass = `beacon-cell ${cell.value ? 'beacon-active' : 'beacon-inactive'}`;

                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`neu-grid-cell ${cellClass}`}
                          title={`Row ${rIdx}, Col ${cIdx}: ${cell.label || cell.kind}`}
                          onClick={() => {
                            if (cell.variableName) {
                              setVariableDirect(cell.variableName, cell.kind === 'variable-true');
                            }
                          }}
                        >
                          {cell.label && <span className="cell-text">{cell.label}</span>}
                          {isBeacon && <div className={`beacon-orb ${cell.value ? 'orb-powered' : ''}`} />}
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>

              {/* Gadget Legend */}
              <div className="gadget-legend">
                <div className="legend-item">
                  <div className="legend-color-box var-true-box" />
                  <span>Variable True (#7efed9)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-box var-false-box" />
                  <span>Variable False</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-box wire-box" />
                  <span>Signal Corridor</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-box beacon-box-lit" />
                  <span>Powered Beacon (Satisfied)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-box beacon-box-unlit" />
                  <span>Unpowered Beacon (#dc3c41)</span>
                </div>
              </div>
            </div>

            {/* Bidirectional Proof Deep Dive */}
            <div className="neu-card edu-takeaway">
              <h4 className="takeaway-title">
                {explainMode === 'layman' ? '⚠️ The Reverse Direction Trap' : '🎓 Backward Reduction Direction (f(I) ∈ X ⟹ I ∈ Y)'}
              </h4>
              <p>
                {explainMode === 'layman' ? (
                  <>
                    <strong>Why reductions are tricky:</strong> It is easy to show that a valid formula creates a working grid (&rArr;). 
                    The hard part is proving that <em>nobody can cheat the grid</em> (&lArr;). If someone hands you ANY working grid, you must be able to convert it back into a valid formula without contradictions!
                  </>
                ) : (
                  <>
                    <strong>Section 2 Warning from Proposal:</strong> The backward direction (&lArr;) is where students most often lose marks. 
                    Every solution to the grid puzzle <em>X</em> must decode to a legitimate assignment for 3-SAT. Because variable gadgets force mutually exclusive selection, and each clause beacon requires at least one signal, no spurious solutions exist.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: P vs NP TIME MACHINE */}
        {activeTab === 'timemachine' && (
          <div className="theory-layout">
            <div className="neu-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">The P vs NP Time Machine: The Exponential Wall</h3>
                  <p className="card-description">
                    {explainMode === 'layman' ? (
                      'Slide the number of variables to feel why checking is instant, but solving by brute-force quickly exceeds the age of the universe!'
                    ) : (
                      'Quantifying worst-case divergence: Polynomial verification O(n + m) versus Exponential exhaustive search 2^n.'
                    )}
                  </p>
                </div>
                <span className="formula-size-badge">n = {timeN} Variables</span>
              </div>

              {/* Interactive Slider */}
              <div className="slider-container-neu">
                <div className="slider-label-row">
                  <span>Variables (n): <strong>{timeN}</strong></span>
                  <span>Combinations to test: <strong>2<sup>{timeN}</sup> = {timeMetrics.expSteps.toLocaleString()}</strong></span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="60"
                  value={timeN}
                  onChange={(e) => setTimeN(Number(e.target.value))}
                  className="neu-slider"
                />
                <div className="slider-markers">
                  <span onClick={() => setTimeN(5)}>n = 5</span>
                  <span onClick={() => setTimeN(15)}>n = 15</span>
                  <span onClick={() => setTimeN(25)}>n = 25 (10M)</span>
                  <span onClick={() => setTimeN(40)}>n = 40 (1 Trillion)</span>
                  <span onClick={() => setTimeN(60)}>n = 60 (Universe scale)</span>
                </div>
              </div>

              {/* Dual Comparison Cards */}
              <div className="time-comparison-grid">
                {/* Polynomial Card */}
                <div className="time-card time-card-poly">
                  <div className="time-icon-badge">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4>Polynomial Verification (P)</h4>
                  <div className="big-time-stat">{timeMetrics.polyHumanTime}</div>
                  <p className="time-stat-detail">
                    Steps to check: <strong>~{timeMetrics.polySteps} operations</strong>
                  </p>
                  <p className="time-desc">
                    {explainMode === 'layman' ? (
                      'Verifying a solution takes a fraction of a millisecond on any phone. It grows steadily like 1, 2, 3...'
                    ) : (
                      'Runs in O(n + m) deterministic time. Even with n = 1,000,000, checking finishes in milliseconds.'
                    )}
                  </p>
                </div>

                {/* Exponential Card */}
                <div className="time-card time-card-exp">
                  <div className="time-icon-badge ruby-badge">
                    <Clock size={24} />
                  </div>
                  <h4>Exhaustive Solving (Brute Force)</h4>
                  <div className="big-time-stat exp-time-stat">{timeMetrics.expHumanTime}</div>
                  <p className="time-stat-detail">
                    Combinations: <strong>{timeMetrics.expSteps.toLocaleString()} combos</strong>
                  </p>
                  <p className="time-desc">
                    {explainMode === 'layman' ? (
                      'Adding just 1 more variable doubles the search space. At n = 60, all the supercomputers on Earth cannot finish before the sun burns out.'
                    ) : (
                      'Search space is 2^n. Unless P = NP, no polynomial-time algorithm exists in the worst case.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Real World Impact */}
            <div className="neu-card">
              <h4 className="card-title">Why Does This Matter for COMP3821?</h4>
              <p className="card-description">
                From Section 1 of the proposal: Many real-world problems (airline flight scheduling, logistics routing, protein folding, circuit design) are NP-complete. 
                Knowing that a problem is NP-complete tells software engineers to stop searching for an exact fast algorithm and instead design <strong>SAT solver heuristics, approximations, or branch-and-bound algorithms</strong>.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: ZERO-KNOWLEDGE PROOF GAME */}
        {activeTab === 'zkp' && (
          <div className="theory-layout">
            <div className="neu-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    {explainMode === 'layman' ? 'The "Where\'s Waldo" Zero-Knowledge Game' : 'Zero-Knowledge Proof (ZKP) Challenge Protocol'}
                  </h3>
                  <p className="card-description">
                    {explainMode === 'layman' ? (
                      'Can you prove to a friend you solved the puzzle without leaking the answer? Play as the Verifier: challenge clauses and catch cheaters!'
                    ) : (
                      'Interactive proof system (P, V). In each round, prover commits blinded literals; verifier picks a random clause to open.'
                    )}
                  </p>
                </div>
                <div className="zkp-soundness-badge">
                  <span>Rounds Passed: {zkpSuccessRounds}/{zkpRound} &bull; Cheater Catch Probability: {zkpRound === 0 ? '0%' : `${(100 * (1 - Math.pow(0.66, zkpRound))).toFixed(1)}%`}</span>
                </div>
              </div>

              {/* Layman Waldo Story */}
              <div className="edu-note">
                {explainMode === 'layman' ? (
                  <p>
                    <strong>The Cardboard Waldo Metaphor:</strong> Imagine you find Waldo in a crowded picture book. To prove it without showing where he is, 
                    you place a huge sheet of cardboard with a small peephole over the book. The verifier sees Waldo through the hole, but doesn't know the coordinates! 
                    In this game, click any clause button below to challenge the prover.
                  </p>
                ) : (
                  <p>
                    <strong>Formal ZKP Properties:</strong><br />
                    1. <strong>Completeness:</strong> If the prover has a valid witness, verifier always accepts.<br />
                    2. <strong>Soundness:</strong> A dishonest prover is caught with error &le; (1 - 1/<em>m</em>)<sup><em>k</em></sup> &rarr; 0.<br />
                    3. <strong>Zero-Knowledge:</strong> A simulator can produce transcripts without knowing the secret assignment.
                  </p>
                )}
              </div>

              {/* Interactive Challenge Arena */}
              <div className="zkp-arena-neu">
                <div className="arena-header">
                  <h4>Verifier Challenge Round #{zkpRound + 1}</h4>
                  <div className="arena-actions">
                    <span className="zkp-state-badge">
                      Witness Status: {verification.isSatisfied ? 'Valid Prover' : 'Cheating Prover (Caught!)'}
                    </span>
                    <button className="neu-action-btn" onClick={handleResetZkp}>
                      <RotateCcw size={14} /> Reset Game
                    </button>
                  </div>
                </div>

                <p className="arena-instruction">
                  {explainMode === 'layman' ? (
                    'Pick any clause below to demand that the prover reveal ONE satisfied friend without showing the rest:'
                  ) : (
                    'Issue challenge: query clause C_j. Prover reveals the committed witness literal without revealing remaining truth vector:'
                  )}
                </p>

                {/* Challenge Buttons */}
                <div className="clause-challenge-buttons">
                  {activeFormula.clauses.map((clause) => (
                    <button
                      key={clause.id}
                      className={`challenge-clause-btn ${zkpActiveChallenge === clause.id ? 'challenged' : ''}`}
                      onClick={() => handleRunZkpChallenge(clause.id)}
                    >
                      <Lock size={14} />
                      <span>Challenge {clause.id}</span>
                    </button>
                  ))}
                </div>

                {/* Challenge Transcript Log */}
                {zkpHistory.length > 0 && (
                  <div className="zkp-transcript-table">
                    <div className="transcript-head">
                      <span>Round</span>
                      <span>Challenged Clause</span>
                      <span>Revealed Witness</span>
                      <span>Verdict</span>
                    </div>
                    {zkpHistory.map((item) => (
                      <div key={item.round} className={`transcript-row ${item.passed ? 'row-pass' : 'row-fail'}`}>
                        <span>Round {item.round}</span>
                        <span>{item.clause}</span>
                        <span className="witness-code">{item.challengedLit}</span>
                        <span>{item.passed ? '✓ Valid (Accepted)' : '✗ Caught (Cheat!)'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: THEORY & PROOF RECIPE */}
        {activeTab === 'theory' && (
          <div className="theory-layout">
            <div className="neu-card">
              <h3 className="card-title">The 6-Step NP-Completeness Proof Recipe</h3>
              <p className="card-description">
                {explainMode === 'layman' ? (
                  'How computer scientists officially prove a puzzle belongs in the hardest category of problems:'
                ) : (
                  'Rigorous template from Section 2 of proposal for proving decision problem X is NP-complete:'
                )}
              </p>

              <div className="recipe-steps-grid">
                <div className="recipe-card-neu">
                  <div className="step-num">1</div>
                  <h4>Show X ∈ NP</h4>
                  <p>
                    {explainMode === 'layman' ? (
                      'Prove that if someone gives you a solved grid, you can verify it in seconds.'
                    ) : (
                      'Define certificate w and show deterministic polynomial-time verifier V(x, w) running in O(|x|^c).'
                    )}
                  </p>
                </div>
                <div className="recipe-card-neu">
                  <div className="step-num">2</div>
                  <h4>Pick Known Problem Y</h4>
                  <p>
                    {explainMode === 'layman' ? (
                      'Choose a famous hard problem like 3-SAT (boolean logic).'
                    ) : (
                      'Select Cook-Levin 3-SAT or Independent Set with natural gadget representations.'
                    )}
                  </p>
                </div>
                <div className="recipe-card-neu">
                  <div className="step-num">3</div>
                  <h4>Construct Map f</h4>
                  <p>
                    {explainMode === 'layman' ? (
                      'Build a converter that turns any 3-SAT formula into your grid puzzle.'
                    ) : (
                      'Design polynomial-time transformation f: 3-SAT → X via variable and clause gadgets.'
                    )}
                  </p>
                </div>
                <div className="recipe-card-neu">
                  <div className="step-num">4</div>
                  <h4>Forward Direction (⇒)</h4>
                  <p>
                    {explainMode === 'layman' ? (
                      'If the formula is true, the grid puzzle must be solvable.'
                    ) : (
                      'Show if φ ∈ 3-SAT, then f(φ) is a yes-instance of problem X.'
                    )}
                  </p>
                </div>
                <div className="recipe-card-neu">
                  <div className="step-num">5</div>
                  <h4>Backward Direction (⇐)</h4>
                  <p>
                    {explainMode === 'layman' ? (
                      'Crucial: If the grid has any solution, it must decode into a true formula (no cheating!).'
                    ) : (
                      'Extract a satisfying assignment from ANY valid grid solution. Beware of unintended bypasses.'
                    )}
                  </p>
                </div>
                <div className="recipe-card-neu">
                  <div className="step-num">6</div>
                  <h4>Polynomial Bounds</h4>
                  <p>
                    {explainMode === 'layman' ? (
                      'The grid cannot explode into trillion-cell dimensions.'
                    ) : (
                      'Argue grid dimensions remain bounded by O((n + m)^2) cells.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="neu-card">
              <h3 className="card-title">Proposal Risk Table &amp; Fallback Ladder</h3>
              <p className="card-description">From Section 4 of our group proposal:</p>
              <div className="mentor-questions-list">
                <div className="q-item">
                  <span className="q-badge">Level 1</span>
                  <p><strong>Original Puzzle:</strong> Design an original grid puzzle with bidirectional gadget proofs and interactive visualizer.</p>
                </div>
                <div className="q-item">
                  <span className="q-badge">Level 2</span>
                  <p><strong>Constrained Variant:</strong> Constrain an existing known puzzle (e.g., Slitherlink/Akari) if custom design encounters backward gaps.</p>
                </div>
                <div className="q-item">
                  <span className="q-badge">Level 3</span>
                  <p><strong>Fallback:</strong> Showcase interactive zero-knowledge proofs and verifiers on established puzzles (Sudoku/3-Colouring).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="neu-footer">
          <span>COMP3821 Algorithms Group Project &bull; Ryan Zhou, Emmett Shang, Louise Liu, Edward Dsouza, Gururam Subramanian</span>
          <span className="contrast-compliance-badge">WCAG AA: #7efed9 on #271372 (Contrast &gt; 12:1)</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
