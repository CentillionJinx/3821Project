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
  Lock,
  Route,
  Layers,
  Eye,
  EyeOff,
  Play,
  GitBranch,
  Shuffle
} from 'lucide-react';
import { SAMPLE_FORMULAS, verifySolution, findSatisfyingAssignments } from './logic/verifier';
import { buildGridFromSat, type GadgetMap } from './logic/gridReduction';
import {
  TRAP_DUNGEON_PRESETS,
  compile3SatToTrapDungeon,
  verifyTrapPath,
  buildMLNumberlinkFromSat,
  verifyMLNumberlink,
} from './logic/candidates';
import {
  runBlumZkpRound,
  FAMOUS_NP_PROBLEMS,
  computeTspComplexity,
  type BlumTranscriptRound,
} from './logic/zkpProtocols';
import type { TruthAssignment, SatFormula, Clause, Literal } from './types/puzzle';
import './App.css';

type TabId = 'cand1' | 'cand2' | 'cand3' | 'zkp' | 'platform' | 'theory';

export function App() {
  // Global Explanation Mode: 'layman' vs 'rigorous'
  const [explainMode, setExplainMode] = useState<'layman' | 'rigorous'>('rigorous');

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabId>('cand1');

  /* ==========================================================================
   * CANDIDATE 1 STATE: 3-SAT-Dungeon (Theorem 1)
   * ========================================================================== */
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState<number>(0);
  const [activeFormula, setActiveFormula] = useState<SatFormula>(SAMPLE_FORMULAS[0].formula);
  const [assignment, setAssignment] = useState<TruthAssignment>({
    x1: true,
    x2: false,
    x3: true,
  });
  const [reductionStage, setReductionStage] = useState<number>(4);
  const [isAutoPlayingReduction, setIsAutoPlayingReduction] = useState<boolean>(false);
  // Section 3.1 Playability Critique: Clause-Discovery Map (Fog-of-War blueprint loops)
  const [fogOfWarEnabled, setFogOfWarEnabled] = useState<boolean>(false);
  const [discoveredClauses, setDiscoveredClauses] = useState<Record<string, boolean>>({
    C1: true,
    C2: false,
    C3: false,
    C4: false,
  });

  /* ==========================================================================
   * CANDIDATE 2 STATE: Trap-Path (Theorem 2: O(|V| + |D|))
   * trapPresetIdx === -1 means dynamically compiled from activeFormula!
   * ========================================================================== */
  const [trapPresetIdx, setTrapPresetIdx] = useState<number>(0);
  const dynamicTrapPreset = compile3SatToTrapDungeon(activeFormula, assignment);
  const currentTrapPreset =
    trapPresetIdx === -1 ? dynamicTrapPreset : TRAP_DUNGEON_PRESETS[trapPresetIdx];
  const [trapCandidatePath, setTrapCandidatePath] = useState<string[]>(
    TRAP_DUNGEON_PRESETS[0].validWitnessPath
  );

  /* ==========================================================================
   * CANDIDATE 3 STATE: ML-Numberlink (Theorem 3: O(W * H * L))
   * ========================================================================== */
  const [mlTrackAssignment, setMlTrackAssignment] = useState<TruthAssignment>({
    x1: true,
    x2: false,
    x3: true,
  });
  const [mlActiveLayerView, setMlActiveLayerView] = useState<'both' | 1 | 2>('both');

  /* ==========================================================================
   * SECTION 4 STATE: Zero-Knowledge Proof Protocols (Protocol A & Protocol B)
   * ========================================================================== */
  const [activeZkpProtocol, setActiveZkpProtocol] = useState<
    'blum-trappath' | 'cutchoose-sat' | 'cutchoose-ml'
  >('blum-trappath');
  const [zkpProverMode, setZkpProverMode] = useState<'honest' | 'cheating'>('honest');
  const [zkpSessionRoleMode, setZkpSessionRoleMode] = useState<
    'two-player-manual' | 'auto-verifier-bot'
  >('two-player-manual');
  // 4-Phase Interactive Step-by-Step ZKP State Machine: Commit -> Challenge -> Open -> Verified
  const [zkpStepPhase, setZkpStepPhase] = useState<
    'idle' | 'committed' | 'challenged' | 'verified'
  >('idle');
  const [pendingRoundPreview, setPendingRoundPreview] = useState<BlumTranscriptRound | null>(null);
  const [blumHistory, setBlumHistory] = useState<BlumTranscriptRound[]>([]);

  // Protocol B1 (3-SAT-Dungeon Cut-and-Choose)
  const [satZkpHistory, setSatZkpHistory] = useState<
    {
      round: number;
      targetType: 'Variable Room' | 'Clause Trap Room';
      targetId: string;
      openedState: string;
      passed: boolean;
    }[]
  >([]);

  // Protocol B2 (ML-Numberlink 3-Way Audit)
  const [mlZkpHistory, setMlZkpHistory] = useState<
    {
      round: number;
      auditType: string;
      openedSummary: string;
      passed: boolean;
      soundnessErr: string;
    }[]
  >([]);

  /* ==========================================================================
   * SECTION 5 STATE: Web Platform & Client-Side Verifier Code Inspector
   * ========================================================================== */
  const [selectedVerifierCodeTab, setSelectedVerifierCodeTab] = useState<
    'thm1' | 'thm2' | 'thm3' | 'solver'
  >('thm2');

  /* ==========================================================================
   * SECTION 2.3 STATE: TSP O(n!) vs Bellman-Held-Karp O(n^2 2^n)
   * ========================================================================== */
  const [tspCitiesN, setTspCitiesN] = useState<number>(20);

  // PWA Install Prompt
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
      }, 1300);
    }
    return () => clearInterval(timer);
  }, [isAutoPlayingReduction]);

  /* ==========================================================================
   * DERIVED VERIFICATIONS & MODELS
   * ========================================================================== */
  const verification = verifySolution(activeFormula, assignment);
  const gadgetMap: GadgetMap = buildGridFromSat(activeFormula, assignment, reductionStage);
  const trapVerification = verifyTrapPath(currentTrapPreset, trapCandidatePath);
  const mlBoard = buildMLNumberlinkFromSat(activeFormula, mlTrackAssignment);
  const mlVerification = verifyMLNumberlink(mlBoard);
  const tspStats = computeTspComplexity(tspCitiesN);

  // Candidate 1 DAG counts from Theorem 1: |V| = 3n + 1 + m, |E| = 4n + m
  const dagVerticesCount = 3 * activeFormula.variables.length + 1 + activeFormula.clauses.length;
  const dagEdgesCount = 4 * activeFormula.variables.length + activeFormula.clauses.length;

  /* ==========================================================================
   * HANDLERS FOR CANDIDATE 1 (3-SAT-Dungeon)
   * ========================================================================== */
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
    setDiscoveredClauses((prev) => ({ ...prev, [newId]: true }));
    setSelectedFormulaIndex(-1);
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

  /* ==========================================================================
   * HANDLERS FOR CANDIDATE 2 (Trap-Path)
   * ========================================================================== */
  const handleSelectTrapPreset = (idx: number) => {
    setTrapPresetIdx(idx);
    if (idx === -1) {
      setTrapCandidatePath(dynamicTrapPreset.validWitnessPath);
    } else {
      setTrapCandidatePath([TRAP_DUNGEON_PRESETS[idx].nodes[0].id]);
    }
  };

  const handleClickTrapRoom = (roomId: string) => {
    setTrapCandidatePath((prev) => {
      // If clicking the last room in path, pop it (undo step)
      if (prev.length > 1 && prev[prev.length - 1] === roomId) {
        return prev.slice(0, -1);
      }
      // If already in path, truncate back to that room
      const existingIdx = prev.indexOf(roomId);
      if (existingIdx !== -1) {
        return prev.slice(0, existingIdx + 1);
      }
      return [...prev, roomId];
    });
  };

  /* ==========================================================================
   * HANDLERS FOR SECTION 4 (ZKP Protocols A & B + 4-Phase State Machine)
   * ========================================================================== */
  const handleTriggerBlumChallenge = (bit: 0 | 1) => {
    const nextRound = blumHistory.length + 1;
    const result = runBlumZkpRound(currentTrapPreset, nextRound, bit, zkpProverMode);
    setBlumHistory((prev) => [result, ...prev.slice(0, 14)]);
    setPendingRoundPreview(result);
    setZkpStepPhase('verified');
  };

  // Step 1 of 4-Phase Interactive ZKP Demo: Prover samples permutation σ and locks SHA-256 commitments
  const handleZkpPhase1Commit = () => {
    const nextRound = blumHistory.length + 1;
    const randomBit: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    const precomputed = runBlumZkpRound(currentTrapPreset, nextRound, randomBit, zkpProverMode);
    setPendingRoundPreview(precomputed);
    setZkpStepPhase('committed');
  };

  // Step 2 of 4-Phase Interactive ZKP Demo: Verifier issues challenge bit b ∈ {0, 1}
  const handleZkpPhase2Challenge = (chosenBit?: 0 | 1) => {
    const nextRound = blumHistory.length + 1;
    const bit: 0 | 1 =
      chosenBit !== undefined ? chosenBit : Math.random() < 0.5 ? 0 : 1;
    const updated = runBlumZkpRound(currentTrapPreset, nextRound, bit, zkpProverMode);
    setPendingRoundPreview(updated);
    setZkpStepPhase('challenged');
  };

  // Step 3 & 4 of 4-Phase Interactive ZKP Demo: Prover opens commitment & Verifier updates soundness (1/2)^k
  const handleZkpPhase3OpenAndVerify = () => {
    if (!pendingRoundPreview) return;
    setBlumHistory((prev) => [pendingRoundPreview, ...prev.slice(0, 14)]);
    setZkpStepPhase('verified');
  };

  const handleRun20BlumRounds = () => {
    const batch: BlumTranscriptRound[] = [];
    for (let r = 1; r <= 20; r++) {
      const randomBit: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
      batch.unshift(runBlumZkpRound(currentTrapPreset, r, randomBit, zkpProverMode));
    }
    setBlumHistory(batch.slice(0, 12));
    setPendingRoundPreview(batch[0]);
    setZkpStepPhase('verified');
  };

  const handleTriggerSatCutAndChoose = (type: 'Variable Room' | 'Clause Trap Room', id: string) => {
    const nextRound = satZkpHistory.length + 1;
    const rBit = Math.random() < 0.5 ? 1 : 0;
    if (type === 'Variable Room') {
      const val = assignment[id] ? 1 : 0;
      const blindedT = val ^ rBit;
      const blindedF = (1 - val) ^ rBit;
      setSatZkpHistory((prev) => [
        {
          round: nextRound,
          targetType: type,
          targetId: `Room V(${id})`,
          openedState: `Opened XOR-blinded pair (${blindedT}, ${blindedF}) with r=${rBit}: confirms mutually exclusive choice s_${id} ≠ s̄_${id}.`,
          passed: true,
        },
        ...prev.slice(0, 9),
      ]);
    } else {
      const clause = activeFormula.clauses.find((c) => c.id === id);
      const satCount = clause
        ? clause.literals.filter((l) => (l.isNegated ? !assignment[l.variable] : assignment[l.variable])).length
        : 0;
      const passed = zkpProverMode === 'honest' ? satCount >= 1 : false;
      const permWires = ['1', '0', satCount >= 2 ? '1' : '0'].sort(() => Math.random() - 0.5);
      setSatZkpHistory((prev) => [
        {
          round: nextRound,
          targetType: type,
          targetId: `Trap Room ${id}`,
          openedState: passed
            ? `Permuted 3 switch wires → [${permWires.join(', ')}]. At least one wire is active (1); winning literal identity stays hidden!`
            : `Permuted 3 switch wires → [0, 0, 0]. All 3 switches inactive — cheating prover caught in Trap ${id}!`,
          passed,
        },
        ...prev.slice(0, 9),
      ]);
    }
  };

  const handleTriggerMLAudit = (auditKind: 'terminals' | 'mandatory' | 'flow') => {
    const nextRound = mlZkpHistory.length + 1;
    const permColors = ['Cyan', 'Violet', 'Emerald', 'Amber'].sort(() => Math.random() - 0.5);
    const isBoardSolved = mlVerification.isValid && zkpProverMode === 'honest';

    let auditTitle = '';
    let summary = '';
    let passed = true;

    if (auditKind === 'terminals') {
      auditTitle = '1. Terminal Consistency Audit';
      summary = `Opened terminal pairs (s_r, t_r) under color permutation ψ: s₁=t₁=${permColors[0]}, s₂=t₂=${permColors[1]}, s₃=t₃=${permColors[2]}.`;
      passed = true;
    } else if (auditKind === 'mandatory') {
      auditTitle = '2. Mandatory Checkpoint (M) Coverage';
      passed = isBoardSolved;
      summary = passed
        ? `Opened all mandatory clause cells m_j ∈ M: every checkpoint covered by a valid permuted color ψ(r).`
        : `CAUGHT: Mandatory checkpoint cell ${mlVerification.uncoveredCheckpoints[0] || 'M-C2'} is empty (uncovered)!`;
    } else {
      auditTitle = '3. Local 2×2 Flow & Portal Conservation';
      summary = `Opened random 2×2 window & Portal P₂ across Layers 1↔2: degree-2 flow conserved with zero vertex collisions.`;
      passed = true;
    }

    setMlZkpHistory((prev) => [
      {
        round: nextRound,
        auditType: auditTitle,
        openedSummary: summary,
        passed,
        soundnessErr: `(2/3)^${nextRound} = ${(Math.pow(2 / 3, nextRound) * 100).toFixed(1)}% (Catch: 1/3)`,
      },
      ...prev.slice(0, 9),
    ]);
  };

  return (
    <div className="app-container">
      {/* Sticky Left Sidebar */}
      <header className="neu-header">
        <div className="header-brand">
          <div className="brand-badge-accent" title="COMP3821 Group 5 Creative Project">
            <span className="status-beacon-dot" />
            <span className="brand-mono-code">NP-C</span>
          </div>
          <div>
            <h1 className="header-title">3821Project</h1>
            <p className="header-subtitle">Group 5 &bull; Term 3, 2026 &bull; Algorithmic Puzzles &amp; ZKPs</p>
          </div>
        </div>

        {/* Layman vs Rigorous Mode Switcher */}
        <div className="explain-mode-toggle" title="Switch between intuitive metaphors and formal COMP3821 report theorems">
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

        {/* Navigation Tabs matching the Report Structure */}
        <nav className="neu-nav-group" aria-label="Main Project Modules">
          <div className="nav-section-label">Section 3 &bull; Candidate Puzzles</div>
          <button
            className={`neu-tab ${activeTab === 'cand1' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand1')}
          >
            <ShieldCheck size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>1. 3-SAT Dungeon</span>
              <small>Literal-Switch &amp; Trap DAG</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'cand2' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand2')}
          >
            <Route size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>2. Trap-Path Dungeon</span>
              <small>Hamiltonian Lock &amp; Traps</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'cand3' ? 'active' : ''}`}
            onClick={() => setActiveTab('cand3')}
          >
            <Layers size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>3. ML-Numberlink</span>
              <small>L=2 Portals &amp; Checkpoints</small>
            </div>
          </button>

          <div className="nav-section-label">Section 2, 4, 5 &amp; 6 &bull; Proofs &amp; System</div>
          <button
            className={`neu-tab ${activeTab === 'zkp' ? 'active' : ''}`}
            onClick={() => setActiveTab('zkp')}
          >
            <Lock size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>4. Zero-Knowledge Studio</span>
              <small>Commit &rarr; Challenge &rarr; Open</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'platform' ? 'active' : ''}`}
            onClick={() => setActiveTab('platform')}
          >
            <Cpu size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>5. Web Platform &amp; Pipeline</span>
              <small>State Machine, Verifiers &amp; Compiler</small>
            </div>
          </button>

          <button
            className={`neu-tab ${activeTab === 'theory' ? 'active' : ''}`}
            onClick={() => setActiveTab('theory')}
          >
            <BookOpen size={18} className="tab-icon" />
            <div className="tab-text-col">
              <span>6. TSP &amp; Report Synthesis</span>
              <small>Held–Karp, Gadgets &amp; Refs</small>
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
            <div className="team-card-heading">COMP3821 Group 5</div>
            <ul className="team-member-list">
              <li><span>Edward Dsouza</span> <code>z5689255</code></li>
              <li><span>Louise Liu</span> <code>z5700939</code></li>
              <li><span>Emmett Shang</span> <code>z5690546</code></li>
              <li><span>Gururam Subramanian</span> <code>z5636559</code></li>
              <li><span>Ryan Zhou</span> <code>z5688014</code></li>
            </ul>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-body">
        {/* Report Banner Header */}
        <section className="edu-hero">
          <div className="edu-hero-icon" aria-hidden="true">
            {explainMode === 'layman' ? <Lightbulb size={22} /> : <Cpu size={22} />}
          </div>
          <div className="edu-hero-content">
            <div className="hero-eyebrow">
              <span>COMP3821 CREATIVE PROJECT</span>
              <span className="dot-sep">&bull;</span>
              <span>TERM 3, 2026</span>
              <span className="dot-sep">&bull;</span>
              <span>NP-COMPLETENESS &amp; ZERO-KNOWLEDGE PROOFS</span>
            </div>
            {explainMode === 'layman' ? (
              <p>
                <strong>Welcome to the Interactive Puzzle Complexity Lab:</strong> Finding a solution to a hard dungeon puzzle can take astronomical time, yet checking someone else's completed path takes microseconds. Explore our <strong>three original NP-complete puzzle designs</strong> (<em>3-SAT Dungeon</em>, <em>Trap-Path</em>, and <em>Multilayered Numberlink</em>), test candidate solutions against polynomial-time verifiers, and prove you know a secret solution using <strong>Zero-Knowledge Proofs</strong>!
              </p>
            ) : (
              <p>
                <strong>Core Algorithmic Objective:</strong> Designing original decision problems <em>X</em> formulated as playable puzzles that are provably <strong>NP-complete</strong> via deterministic polynomial-time verifiers <em>V(x, c) = YES</em> and bidirectional Karp reductions <em>Y &le;<sub>P</sub> X</em> from <strong>3-SAT</strong> and <strong>Hamiltonian Path</strong>, paired with interactive <strong>Goldreich–Micali–Wigderson &amp; Blum Zero-Knowledge Proof</strong> protocols.
              </p>
            )}
          </div>
        </section>

        {/* ====================================================================
         * TAB 1: CANDIDATE 1 — THE 3-SAT DUNGEON (Section 3.1, Theorem 1)
         * ==================================================================== */}
        {activeTab === 'cand1' && (
          <div className="tab-stage">
            {/* Formula & Mode Bar */}
            <section className="neu-controls-bar">
              <div className="formula-selector">
                <span className="selector-label">3-CNF Instance &phi;:</span>
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
                  {selectedFormulaIndex === -1 && (
                    <span className="neu-pill active">Custom Edited &phi;</span>
                  )}
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className={`neu-action-btn ${fogOfWarEnabled ? 'btn-active-amber' : ''}`}
                  onClick={() => setFogOfWarEnabled((v) => !v)}
                  title="Toggle Clause-Discovery Blueprint Loops (Section 3.1 Playability Extension)"
                >
                  {fogOfWarEnabled ? <Eye size={15} /> : <EyeOff size={15} />}
                  <span>Clause-Discovery Map: {fogOfWarEnabled ? 'ON' : 'OFF'}</span>
                </button>
                <button className="neu-action-btn btn-teal" onClick={handleSolveAutomatically}>
                  <Sparkles size={15} />
                  <span>{explainMode === 'layman' ? 'Auto-Solve Witness' : 'Oracle Witness'}</span>
                </button>
                <button className="neu-action-btn" onClick={handleReset}>
                  <RotateCcw size={15} />
                  <span>Reset</span>
                </button>
              </div>
            </section>

            <div className="content-layout">
              {/* Left Column: Dungeon Architecture & Interactive Controls */}
              <div className="left-panel">
                {/* Formal Definition & Clause Editor Card */}
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">Section 3.1 &bull; Candidate 1 &bull; Theorem 1</span>
                      <h3 className="card-title">
                        The 3-SAT Dungeon (Literal-Switch &amp; Clause-Trap DAG)
                      </h3>
                    </div>
                    <div className="card-header-actions">
                      <span className="formula-size-badge">
                        |V| = 3n+1+m = {dagVerticesCount} &bull; |E| = 4n+m = {dagEdgesCount}
                      </span>
                      <button className="neu-pill-btn" onClick={handleAddClause}>
                        <Plus size={14} /> Add Clause Trap
                      </button>
                    </div>
                  </div>

                  <div className="edu-note">
                    {explainMode === 'layman' ? (
                      <p>
                        <strong>How the 3-SAT Dungeon Works:</strong> You start at room <em>s = r₁</em>. First, you walk through the <strong>Variable Selection Zone</strong>: each variable room branches into a True corridor (<em>u<sub>i</sub><sup>T</sup></em>) and a False corridor (<em>u<sub>i</sub><sup>F</sup></em>), with a one-way portcullis locking behind you so you can't go back and change your mind! Next, you must survive the <strong>Clause Trap Gauntlet</strong> (<em>c₁ … c<sub>m</sub></em>): each trap room has 3 locks and is only disarmed if at least 1 of its 3 literal switches was activated earlier!
                      </p>
                    ) : (
                      <p>
                        <strong>Formal Instance D = (G, s, t, S, &tau;):</strong> Directed acyclic graph with entry vertices <em>r₁, …, r<sub>n+1</sub></em> (<em>s = r₁</em>), parallel corridor vertices <em>u<sub>i</sub><sup>T</sup>, u<sub>i</sub><sup>F</sup></em> triggering switches <em>s<sub>i</sub>, s̄<sub>i</sub> &isin; S</em>, and serial trap vertices <em>c₁, …, c<sub>m</sub></em> (<em>t = c<sub>m</sub></em>) where each trap requires <em>A &cap; &tau;(c<sub>j</sub>) &ne; &empty;</em>. Click any literal below to negate it or click <code>&bull;</code> to cycle variables.
                      </p>
                    )}
                  </div>

                  {/* Interactive 3-CNF Formula Bar */}
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
                                title="Click to negate literal"
                              >
                                {lit.isNegated ? '¬' : ''}{lit.variable}
                              </button>
                              <button
                                className="cycle-var-dot"
                                onClick={() => handleCycleVariable(cIdx, lIdx)}
                                title="Cycle variable"
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
                            title="Remove clause"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        {cIdx < activeFormula.clauses.length - 1 && <span className="and-op">&and;</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interactive Zone 1: Variable Selection Corridors (One-Way Portcullis Rooms) */}
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">Zone 1 &bull; Variable Selection Corridors</span>
                      <h3 className="card-title">
                        Traverse Corridor Rooms u<sub>i</sub><sup>T</sup> (s<sub>i</sub>) or u<sub>i</sub><sup>F</sup> (s̄<sub>i</sub>)
                      </h3>
                    </div>
                    <span className="info-tag">One-Way Portcullis Locks</span>
                  </div>

                  {/* Clause-Discovery Exploratory Loop Banner (Section 3.1 Playability Critique) */}
                  {fogOfWarEnabled && (
                    <div className="discovery-loop-banner">
                      <div className="discovery-header">
                        <strong>Clause-Discovery Exploratory Loops (Section 3.1 Extension):</strong>
                        <span>Collect blueprints before locking in one-way variable corridors!</span>
                      </div>
                      <div className="blueprint-pills">
                        {activeFormula.clauses.map((c) => {
                          const isFound = Boolean(discoveredClauses[c.id]);
                          return (
                            <button
                              key={c.id}
                              className={`blueprint-btn ${isFound ? 'found' : 'unfound'}`}
                              onClick={() =>
                                setDiscoveredClauses((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                              }
                            >
                              {isFound ? <Eye size={13} /> : <Lock size={13} />}
                              <span>Blueprint {c.id}: {isFound ? 'Revealed' : 'Hidden in Loop'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="variables-grid">
                    {activeFormula.variables.map((varName, idx) => {
                      const isTrue = assignment[varName] === true;
                      return (
                        <div key={varName} className="variable-row-neu">
                          <div className="var-meta">
                            <span className="variable-tag">r<sub>{idx + 1}</sub> &rarr; {varName}</span>
                            <small className="switch-active-code">
                              Active Switch: {isTrue ? `s_${idx + 1}` : `s̄_${idx + 1}`}
                            </small>
                          </div>
                          <div className="toggle-switch-neu">
                            <button
                              className={`toggle-option ${!isTrue ? 'active-f' : ''}`}
                              onClick={() => setVariableDirect(varName, false)}
                            >
                              u<sub>{idx + 1}</sub><sup>F</sup> (&not;{varName})
                            </button>
                            <button
                              className={`toggle-option ${isTrue ? 'active-t' : ''}`}
                              onClick={() => setVariableDirect(varName, true)}
                            >
                              u<sub>{idx + 1}</sub><sup>T</sup> ({varName})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Zone 2: Clause Trap Gauntlet (c_1 -> ... -> c_m = t) */}
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">Zone 2 &bull; Sequential Clause Trap Gauntlet</span>
                      <h3 className="card-title">
                        Trap Rooms c₁ &rarr; … &rarr; c<sub>{activeFormula.clauses.length}</sub> = t
                      </h3>
                    </div>
                    <span className="status-ratio">
                      {verification.satisfiedClausesCount} / {verification.totalClausesCount} Traps Disarmed
                    </span>
                  </div>

                  <div className="clause-verification-list">
                    {activeFormula.clauses.map((clause, idx) => {
                      const satisfied = clause.literals.some((lit) => {
                        const v = assignment[lit.variable];
                        return lit.isNegated ? !v : v;
                      });
                      const isMasked = fogOfWarEnabled && !discoveredClauses[clause.id];

                      return (
                        <div
                          key={clause.id}
                          className={`clause-row ${satisfied ? 'clause-pass' : 'clause-fail'}`}
                        >
                          <div className="clause-id-pill">
                            c<sub>{idx + 1}</sub> ({clause.id})
                          </div>
                          <div className="clause-body">
                            {isMasked ? (
                              <span className="fog-masked-text">
                                [Unexplored Trap Room — Visit Blueprint Loop to Inspect &tau;(c<sub>{idx + 1}</sub>)]
                              </span>
                            ) : (
                              <>
                                <span className="tau-prefix">&tau;(c<sub>{idx + 1}</sub>) = &#123; </span>
                                {clause.literals.map((lit, i) => {
                                  const v = assignment[lit.variable];
                                  const litVal = lit.isNegated ? !v : v;
                                  return (
                                    <span
                                      key={i}
                                      className={`clause-body-lit ${litVal ? 'lit-body-true' : 'lit-body-false'}`}
                                    >
                                      {lit.isNegated ? '¬' : ''}{lit.variable} {litVal ? '✓' : '✗'}
                                      {i < 2 ? ', ' : ''}
                                    </span>
                                  );
                                })}
                                <span className="tau-prefix"> &#125;</span>
                              </>
                            )}
                          </div>
                          <div className="clause-status-indicator">
                            {satisfied ? (
                              <span className="badge-pass">
                                <CheckCircle2 size={15} /> Disarmed
                              </span>
                            ) : (
                              <span className="badge-fail">
                                <AlertTriangle size={15} /> Lethal Trap!
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reduction Gadget Compiler Matrix */}
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">Gadget Architecture &bull; Section 2.4</span>
                      <h3 className="card-title">2D Gadget Reduction Matrix f(&phi;)</h3>
                    </div>
                    <div className="stepper-buttons">
                      {[1, 2, 3, 4].map((st) => (
                        <button
                          key={st}
                          className={`step-btn ${reductionStage === st ? 'step-active' : ''}`}
                          onClick={() => setReductionStage(st)}
                        >
                          Stage {st}
                        </button>
                      ))}
                      <button
                        className="neu-pill-btn"
                        onClick={() => {
                          setReductionStage(1);
                          setIsAutoPlayingReduction(true);
                        }}
                      >
                        <Zap size={13} /> Animate f(&phi;)
                      </button>
                    </div>
                  </div>

                  <div className="grid-gadget-container">
                    <div
                      className="gadget-matrix"
                      style={{ gridTemplateColumns: `repeat(${gadgetMap.cols}, minmax(42px, 1fr))` }}
                    >
                      {gadgetMap.cells.map((rowCells, rIdx) =>
                        rowCells.map((cell, cIdx) => {
                          const isVariable =
                            cell.kind === 'variable-true' || cell.kind === 'variable-false';
                          const isClause = cell.kind === 'clause-slot';
                          const isCorridor = cell.kind === 'wire-corridor';
                          const isBeacon = cell.kind === 'beacon';

                          let cellClass = 'empty-cell';
                          if (cell.kind === 'wall') cellClass = 'wall-cell';
                          if (isVariable)
                            cellClass = `var-cell ${cell.value ? 'selected-var' : 'unselected-var'}`;
                          if (isCorridor) cellClass = 'corridor-cell';
                          if (isClause)
                            cellClass = `clause-slot-cell ${cell.value ? 'slot-powered' : 'slot-dormant'}`;
                          if (isBeacon)
                            cellClass = `beacon-cell ${cell.value ? 'beacon-active' : 'beacon-inactive'}`;

                          return (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className={`neu-grid-cell ${cellClass}`}
                              onClick={() => {
                                if (cell.variableName) {
                                  setVariableDirect(
                                    cell.variableName,
                                    cell.kind === 'variable-true'
                                  );
                                }
                              }}
                            >
                              {cell.label && <span className="cell-text">{cell.label}</span>}
                              {isBeacon && (
                                <div className={`beacon-orb ${cell.value ? 'orb-powered' : ''}`} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Theorem 1 Verifier Output */}
              <div className="right-panel">
                <div
                  className={`neu-card verifier-decision-card ${
                    verification.isSatisfied ? 'verdict-accepted' : 'verdict-rejected'
                  }`}
                >
                  <div className="verifier-badge">
                    {verification.isSatisfied ? (
                      <CheckCircle2 size={32} />
                    ) : (
                      <AlertTriangle size={32} />
                    )}
                  </div>

                  <div className="verifier-headline">
                    <h2>{verification.isSatisfied ? 'VERIFIER: YES (ACCEPT)' : 'VERIFIER: NO (REJECT)'}</h2>
                    <p className="verdict-time-poly">Theorem 1 &bull; O(|V| + |E|) DAG Verifier</p>
                    <p className="verdict-explain">
                      {verification.isSatisfied
                        ? 'Candidate path π safely reaches exit vertex t = c_m. Every trap room u ∈ V_trap satisfies A ∩ τ(u) ≠ ∅.'
                        : 'Path blocked! At least one trap room c_j has A ∩ τ(c_j) = ∅ (all 3 disarming switches inactive).'}
                    </p>
                  </div>

                  <div className="verifier-status-box">
                    <div className="status-metric">
                      <span className="metric-label">Active Switch Set A</span>
                      <span className="metric-val val-good">
                        &#123;
                        {activeFormula.variables
                          .map((v, i) => (assignment[v] ? `s_${i + 1}` : `s̄_${i + 1}`))
                          .join(', ')}
                        &#125;
                      </span>
                    </div>
                    <div className="status-metric">
                      <span className="metric-label">Trap Gauntlet Survival</span>
                      <span
                        className={`metric-val ${
                          verification.allClausesSatisfied ? 'val-good' : 'val-bad'
                        }`}
                      >
                        {verification.satisfiedClausesCount} / {verification.totalClausesCount} Safe
                      </span>
                    </div>
                    <div className="status-metric">
                      <span className="metric-label">DAG Size |V| + |E|</span>
                      <span className="metric-val">
                        {dagVerticesCount + dagEdgesCount} ops
                      </span>
                    </div>
                  </div>

                  {verification.conflictDetails.length > 0 && (
                    <div className="conflict-box">
                      <h4 className="conflict-title">Triggered Dungeon Traps:</h4>
                      <ul>
                        {verification.conflictDetails.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="neu-card edu-takeaway">
                  <h4 className="takeaway-title">Theorem 1 Proof Summary</h4>
                  <p>
                    <strong>(&rArr;) Forward:</strong> If &alpha; satisfies &phi;, traverse <em>u<sub>i</sub><sup>T</sup></em> iff &alpha;(<em>x<sub>i</sub></em>) = T. Then each trap <em>c<sub>j</sub></em> has |<em>A &cap; &tau;(c<sub>j</sub>)</em>| &ge; 1.<br /><br />
                    <strong>(&lArr;) Backward:</strong> DAG topology forces any path &pi; to choose exactly one of <em>u<sub>i</sub><sup>T</sup></em> or <em>u<sub>i</sub><sup>F</sup></em>, so <em>s<sub>i</sub></em> and <em>s̄<sub>i</sub></em> can never both be active. Reaching <em>t = c<sub>m</sub></em> guarantees a valid truth assignment!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
         * TAB 2: CANDIDATE 2 — TRAP-PATH DUNGEON (Section 3.2, Theorem 2)
         * ==================================================================== */}
        {activeTab === 'cand2' && (
          <div className="tab-stage">
            <section className="neu-controls-bar">
              <div className="formula-selector">
                <span className="selector-label">Select Trap-Path Dungeon (G, T):</span>
                <div className="select-pill-group">
                  {TRAP_DUNGEON_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.id}
                      className={`neu-pill ${trapPresetIdx === idx ? 'active' : ''}`}
                      onClick={() => handleSelectTrapPreset(idx)}
                    >
                      {preset.name}
                    </button>
                  ))}
                  <button
                    className={`neu-pill ${trapPresetIdx === -1 ? 'active' : ''}`}
                    onClick={() => handleSelectTrapPreset(-1)}
                    title="Dynamically compile your active 3-SAT formula from Tab 1 into a playable Trap-Path instance!"
                  >
                    &#9889; Live Compiled from Active 3-SAT &phi;
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="neu-action-btn btn-teal"
                  onClick={() => setTrapCandidatePath(currentTrapPreset.validWitnessPath)}
                >
                  <Sparkles size={15} />
                  <span>Load Witness Path &pi;</span>
                </button>
                <button
                  className="neu-action-btn"
                  onClick={() => setTrapCandidatePath([currentTrapPreset.nodes[0].id])}
                >
                  <RotateCcw size={15} />
                  <span>Restart at Entry</span>
                </button>
              </div>
            </section>

            <div className="content-layout">
              <div className="left-panel">
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">Section 3.2 &bull; Candidate 2 &bull; Theorem 2</span>
                      <h3 className="card-title">{currentTrapPreset.name}</h3>
                    </div>
                    <span className="formula-size-badge">{currentTrapPreset.badge}</span>
                  </div>

                  <div className="edu-note">
                    <p>
                      {explainMode === 'layman'
                        ? currentTrapPreset.summaryLayman
                        : currentTrapPreset.summaryRigorous}
                    </p>
                  </div>

                  {/* Interactive SVG Dungeon Graph Renderer for G=(V,E) and Trap Graph T=(V,D) */}
                  <div className="trap-graph-canvas-wrap">
                    <svg viewBox="0 0 760 380" className="trap-graph-svg">
                      <defs>
                        <marker
                          id="trap-arrow"
                          viewBox="0 0 10 10"
                          refX="28"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 1 L 10 5 L 0 9 z" fill="#fb7185" />
                        </marker>
                      </defs>

                      {/* 1. Navigation Corridors E in G */}
                      {currentTrapPreset.edges.map(([u, v], eIdx) => {
                        const n1 = currentTrapPreset.nodes.find((n) => n.id === u)!;
                        const n2 = currentTrapPreset.nodes.find((n) => n.id === v)!;
                        // Check if traversed consecutively in trapCandidatePath
                        let isTraversed = false;
                        for (let i = 0; i < trapCandidatePath.length - 1; i++) {
                          if (
                            (trapCandidatePath[i] === u && trapCandidatePath[i + 1] === v) ||
                            (trapCandidatePath[i] === v && trapCandidatePath[i + 1] === u)
                          ) {
                            isTraversed = true;
                            break;
                          }
                        }
                        return (
                          <line
                            key={`e-${eIdx}`}
                            x1={n1.x}
                            y1={n1.y}
                            x2={n2.x}
                            y2={n2.y}
                            className={`corridor-edge ${isTraversed ? 'edge-traversed' : ''}`}
                          />
                        );
                      })}

                      {/* 2. Directed Trap Trigger Edges D in T = (V, D) */}
                      {currentTrapPreset.trapEdges.map((tEdge, tIdx) => {
                        const n1 = currentTrapPreset.nodes.find((n) => n.id === tEdge.from)!;
                        const n2 = currentTrapPreset.nodes.find((n) => n.id === tEdge.to)!;
                        const isFired = trapCandidatePath.includes(tEdge.from);
                        // Curved quadratic bezier for trap trigger line
                        const midX = (n1.x + n2.x) / 2;
                        const midY = (n1.y + n2.y) / 2 - 36;
                        return (
                          <g key={`trap-${tIdx}`}>
                            <path
                              d={`M ${n1.x} ${n1.y} Q ${midX} ${midY} ${n2.x} ${n2.y}`}
                              fill="none"
                              markerEnd="url(#trap-arrow)"
                              className={`trap-trigger-edge ${isFired ? 'trap-edge-fired' : ''}`}
                            />
                            <text x={midX} y={midY - 4} className="trap-edge-label">
                              trap ({tEdge.from}&rarr;{tEdge.to})
                            </text>
                          </g>
                        );
                      })}

                      {/* 3. Room Vertices V */}
                      {currentTrapPreset.nodes.map((node) => {
                        const stepIdx = trapCandidatePath.indexOf(node.id);
                        const isVisited = stepIdx !== -1;
                        const isCurrentHead =
                          trapCandidatePath[trapCandidatePath.length - 1] === node.id;
                        const trappedByRoom = trapVerification.activeTrappedRooms[node.id];
                        // Check if it was trapped BEFORE it was visited
                        const stepTrace = trapVerification.stepTraces.find(
                          (s) => s.roomId === node.id
                        );
                        const steppedIntoTrap = Boolean(stepTrace?.wasAlreadyTrapped);

                        return (
                          <g
                            key={node.id}
                            transform={`translate(${node.x}, ${node.y})`}
                            className="room-node-group"
                            onClick={() => handleClickTrapRoom(node.id)}
                          >
                            <circle
                              r={30}
                              className={`room-circle ${
                                steppedIntoTrap
                                  ? 'room-violated'
                                  : isCurrentHead
                                  ? 'room-head'
                                  : isVisited
                                  ? 'room-visited'
                                  : trappedByRoom
                                  ? 'room-trapped-unvisited'
                                  : 'room-open'
                              }`}
                            />
                            <text y={-3} className="room-id-text">
                              {node.label}
                            </text>
                            <text y={14} className="room-sub-text">
                              {node.sublabel}
                            </text>
                            {isVisited && (
                              <g transform="translate(22, -22)">
                                <circle r={11} className="step-order-badge" />
                                <text y={4} className="step-order-text">
                                  {stepIdx + 1}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="gadget-legend">
                    <div className="legend-item">
                      <span className="legend-dot dot-visited" />
                      <span>Visited &amp; Locked Room</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot dot-trapped" />
                      <span>Disabled by Trap Edge (u, v) &isin; D</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-line-trap" />
                      <span>Directed Trap Trigger D</span>
                    </div>
                  </div>
                </div>

                {/* Sequential Trap Marking Trace Table (Theorem 2 Procedure) */}
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">Theorem 2 Sequential Trap Marking Procedure</span>
                      <h3 className="card-title">Step-by-Step Path &amp; trapped[v] Array Trace</h3>
                    </div>
                    <span className="info-tag">
                      &pi; = ({trapCandidatePath.join(' → ')})
                    </span>
                  </div>

                  <div className="zkp-transcript-table">
                    <div className="transcript-head">
                      <span>Step j</span>
                      <span>Room v_j</span>
                      <span>trapped[v_j] Check</span>
                      <span>Outward Traps Triggered (v_j, u) &isin; D</span>
                    </div>
                    {trapVerification.stepTraces.map((st) => (
                      <div
                        key={st.stepIndex}
                        className={`transcript-row ${
                          st.wasAlreadyTrapped || !st.wasAdjacentToPrev || st.wasAlreadyVisited
                            ? 'row-fail'
                            : 'row-pass'
                        }`}
                      >
                        <span>Step {st.stepIndex}</span>
                        <span className="witness-code">{st.roomLabel}</span>
                        <span>
                          {st.wasAlreadyTrapped
                            ? `✗ TRUE (Trapped by ${st.trappedByEarlierRoom}!)`
                            : !st.wasAdjacentToPrev
                            ? '✗ Non-adjacent edge!'
                            : '✓ FALSE (Safe)'}
                        </span>
                        <span>
                          {st.newlyTrappedRooms.length > 0
                            ? `trapped[${st.newlyTrappedRooms.join(', ')}] ← True`
                            : 'None'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Theorem 2 Verifier Verdict */}
              <div className="right-panel">
                <div
                  className={`neu-card verifier-decision-card ${
                    trapVerification.isValid ? 'verdict-accepted' : 'verdict-rejected'
                  }`}
                >
                  <div className="verifier-badge">
                    {trapVerification.isValid ? (
                      <CheckCircle2 size={32} />
                    ) : (
                      <AlertTriangle size={32} />
                    )}
                  </div>

                  <div className="verifier-headline">
                    <h2>
                      {trapVerification.isValid ? 'TRAP-PATH: ACCEPT' : 'TRAP-PATH: REJECT'}
                    </h2>
                    <p className="verdict-time-poly">
                      Theorem 2 &bull; O(|V| + |D|) = {trapVerification.operationsCount} Ops
                    </p>
                    <p className="verdict-explain">
                      {trapVerification.isValid
                        ? 'Valid Hamiltonian path! Every room in V visited exactly once with zero trap violations (v_i, v_j) ∈ D for i < j.'
                        : trapVerification.failureReason}
                    </p>
                  </div>

                  <div className="verifier-status-box">
                    <div className="status-metric">
                      <span className="metric-label">Hamiltonian Coverage</span>
                      <span
                        className={`metric-val ${
                          trapVerification.isCompleteLength ? 'val-good' : 'val-bad'
                        }`}
                      >
                        {trapVerification.visitedCount} / {trapVerification.totalVertices} Rooms
                      </span>
                    </div>
                    <div className="status-metric">
                      <span className="metric-label">Adjacency &amp; Single-Visit</span>
                      <span
                        className={`metric-val ${
                          trapVerification.isAdjacencyValid && trapVerification.isUniqueVisits
                            ? 'val-good'
                            : 'val-bad'
                        }`}
                      >
                        {trapVerification.isAdjacencyValid && trapVerification.isUniqueVisits
                          ? 'VALID'
                          : 'VIOLATED'}
                      </span>
                    </div>
                    <div className="status-metric">
                      <span className="metric-label">Trap Condition (i &lt; j)</span>
                      <span
                        className={`metric-val ${
                          trapVerification.isTrapFree ? 'val-good' : 'val-bad'
                        }`}
                      >
                        {trapVerification.isTrapFree ? '0 Traps Hit' : 'TRAP TRIGGERED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="neu-card edu-takeaway">
                  <h4 className="takeaway-title">Theorem 2 &amp; Non-Trivial 3-SAT Reduction</h4>
                  <p>
                    <strong>Why O(|V| + |D|) holds:</strong> Each vertex <em>v &isin; V</em> is visited once and its outgoing trap edges in <em>D</em> are iterated at most once: &sum; deg<sub>D</sub><sup>+</sup>(v) = |D|.<br /><br />
                    <strong>Series-Parallel Hardness:</strong> Even when <em>G</em> is restricted to simple diamond chains, active trap edges <em>(F<sub>k</sub><sup>(1)</sup>, c<sub>j</sub>) &isin; D</em> enforce non-local 3-SAT clause satisfaction without needing planar crossovers!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
         * TAB 3: CANDIDATE 3 — ML-NUMBERLINK (Section 3.3, Theorem 3)
         * ==================================================================== */}
        {activeTab === 'cand3' && (
          <div className="tab-stage">
            <section className="neu-controls-bar">
              <div className="formula-selector">
                <span className="selector-label">Layer View (L = 2):</span>
                <div className="select-pill-group">
                  <button
                    className={`neu-pill ${mlActiveLayerView === 'both' ? 'active' : ''}`}
                    onClick={() => setMlActiveLayerView('both')}
                  >
                    Side-by-Side (Layer 1 &amp; Layer 2)
                  </button>
                  <button
                    className={`neu-pill ${mlActiveLayerView === 1 ? 'active' : ''}`}
                    onClick={() => setMlActiveLayerView(1)}
                  >
                    Layer 1 Only (Ground)
                  </button>
                  <button
                    className={`neu-pill ${mlActiveLayerView === 2 ? 'active' : ''}`}
                    onClick={() => setMlActiveLayerView(2)}
                  >
                    Layer 2 Only (Portal Bridges)
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="neu-action-btn btn-teal"
                  onClick={() => {
                    const sols = findSatisfyingAssignments(activeFormula);
                    if (sols.length > 0) setMlTrackAssignment(sols[0]);
                  }}
                >
                  <Sparkles size={15} />
                  <span>Route Satisfying Tracks</span>
                </button>
                <button
                  className="neu-action-btn"
                  onClick={() => setMlTrackAssignment({ x1: false, x2: false, x3: false })}
                >
                  <RotateCcw size={15} />
                  <span>All Lower Tracks (False)</span>
                </button>
              </div>
            </section>

            <div className="content-layout">
              <div className="left-panel">
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">Section 3.3 &bull; Candidate 3 &bull; Theorem 3</span>
                      <h3 className="card-title">
                        Multilayered Partial-Coverage Numberlink (ML-Numberlink)
                      </h3>
                    </div>
                    <span className="formula-size-badge">
                      L = 2 Layers &bull; |M| = {mlBoard.mandatoryCells.length} Mandatory Cells
                    </span>
                  </div>

                  <div className="edu-note">
                    {explainMode === 'layman' ? (
                      <p>
                        <strong>How Multilayered Numberlink Works:</strong> Connect each numbered terminal pair <em>(s<sub>r</sub>, t<sub>r</sub>)</em> using non-overlapping colored pipes. Unlike normal 2D Numberlink, pipes can step through <strong>Portal Cells (P)</strong> up to Layer 2 to bridge over each other without colliding! And instead of filling every single cell, your pipes only need to cover the golden <strong>Mandatory Checkpoint Cells (M)</strong>!
                      </p>
                    ) : (
                      <p>
                        <strong>Theorem 3 Reduction (3-SAT &le;<sub>P</sub> ML-Numberlink on L=2 Layers):</strong> Each variable <em>x<sub>i</sub></em> has terminal pair <em>(s<sub>i</sub>, t<sub>i</sub>)</em> with an <strong>Upper Track (x<sub>i</sub> = True)</strong> and <strong>Lower Track (x<sub>i</sub> = False)</strong>. Portal cells <em>p &isin; P</em> allow collision-free inter-layer crossings <em>E<sub>layer</sub></em>, and each clause <em>C<sub>j</sub></em> places a mandatory cell <em>m<sub>j</sub> &isin; M</em> that is covered iff at least one satisfying track detours through it.
                      </p>
                    )}
                  </div>

                  {/* Variable Track Polarity Selector */}
                  <div className="variables-grid" style={{ marginBottom: '20px' }}>
                    {mlBoard.terminals.map((term) => {
                      const isUpper = mlTrackAssignment[term.varName] === true;
                      return (
                        <div key={term.id} className="variable-row-neu">
                          <div className="var-meta">
                            <span className="variable-tag" style={{ color: term.color }}>
                              Pair ({term.id}) &bull; {term.varName}
                            </span>
                            <small className="switch-active-code">
                              s<sub>{term.id}</sub> &rarr; t<sub>{term.id}</sub>
                            </small>
                          </div>
                          <div className="toggle-switch-neu">
                            <button
                              className={`toggle-option ${!isUpper ? 'active-f' : ''}`}
                              onClick={() =>
                                setMlTrackAssignment((prev) => ({
                                  ...prev,
                                  [term.varName]: false,
                                }))
                              }
                            >
                              Lower ({term.varName}=F)
                            </button>
                            <button
                              className={`toggle-option ${isUpper ? 'active-t' : ''}`}
                              onClick={() =>
                                setMlTrackAssignment((prev) => ({
                                  ...prev,
                                  [term.varName]: true,
                                }))
                              }
                            >
                              Upper ({term.varName}=T)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dual Layer 2D Grid Renderer */}
                  <div className="ml-layers-grid">
                    {[1, 2]
                      .filter((ly) => mlActiveLayerView === 'both' || mlActiveLayerView === ly)
                      .map((layerNum) => (
                        <div key={layerNum} className="ml-layer-box">
                          <div className="ml-layer-header">
                            <h4>
                              Layer &#8467; = {layerNum}{' '}
                              {layerNum === 1 ? '(Primary Ground Grid)' : '(Overpass Bridge Layer)'}
                            </h4>
                            <span className="info-tag">
                              {mlBoard.width} &times; {mlBoard.height}
                            </span>
                          </div>

                          <div
                            className="ml-grid-board"
                            style={{
                              gridTemplateColumns: `repeat(${mlBoard.width}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: mlBoard.height }).map((_, y) =>
                              Array.from({ length: mlBoard.width }).map((__, x) => {
                                // Check if terminal start/end
                                const terminalStart = mlBoard.terminals.find(
                                  (t) =>
                                    t.start.x === x &&
                                    t.start.y === y &&
                                    t.start.layer === layerNum
                                );
                                const terminalEnd = mlBoard.terminals.find(
                                  (t) =>
                                    t.end.x === x && t.end.y === y && t.end.layer === layerNum
                                );
                                // Check if portal cell P
                                const portal = mlBoard.portals.find(
                                  (p) => p.x === x && p.y === y
                                );
                                // Check if mandatory checkpoint cell M
                                const mandatory = mlBoard.mandatoryCells.find(
                                  (m) => m.x === x && m.y === y && m.layer === layerNum
                                );
                                // Check which path occupies (x, y, layerNum)
                                const occupyingTerm = mlBoard.terminals.find((t) =>
                                  (mlBoard.activePaths[t.id] || []).some(
                                    (pt) => pt.x === x && pt.y === y && pt.layer === layerNum
                                  )
                                );

                                return (
                                  <div
                                    key={`${layerNum}-${x}-${y}`}
                                    className={`ml-cell ${
                                      mandatory
                                        ? occupyingTerm
                                          ? 'ml-cell-mandatory-covered'
                                          : 'ml-cell-mandatory-uncovered'
                                        : portal
                                        ? 'ml-cell-portal'
                                        : ''
                                    }`}
                                    style={
                                      occupyingTerm
                                        ? {
                                            borderColor: occupyingTerm.color,
                                            backgroundColor: `${occupyingTerm.color}22`,
                                          }
                                        : undefined
                                    }
                                    title={`(${x}, ${y}, L${layerNum})`}
                                  >
                                    {terminalStart && (
                                      <span
                                        className="ml-term-badge"
                                        style={{ backgroundColor: terminalStart.color }}
                                      >
                                        s{terminalStart.id}
                                      </span>
                                    )}
                                    {terminalEnd && (
                                      <span
                                        className="ml-term-badge"
                                        style={{ backgroundColor: terminalEnd.color }}
                                      >
                                        t{terminalEnd.id}
                                      </span>
                                    )}
                                    {!terminalStart && !terminalEnd && mandatory && (
                                      <span className="ml-mandatory-tag">
                                        M({mandatory.clauseId})
                                      </span>
                                    )}
                                    {!terminalStart && !terminalEnd && !mandatory && portal && (
                                      <span className="ml-portal-tag">{portal.label}</span>
                                    )}
                                    {!terminalStart &&
                                      !terminalEnd &&
                                      !mandatory &&
                                      !portal &&
                                      occupyingTerm && (
                                        <span
                                          className="ml-path-dot"
                                          style={{ backgroundColor: occupyingTerm.color }}
                                        />
                                      )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Theorem 3 Verifier Verdict */}
              <div className="right-panel">
                <div
                  className={`neu-card verifier-decision-card ${
                    mlVerification.isValid ? 'verdict-accepted' : 'verdict-rejected'
                  }`}
                >
                  <div className="verifier-badge">
                    {mlVerification.isValid ? (
                      <CheckCircle2 size={32} />
                    ) : (
                      <AlertTriangle size={32} />
                    )}
                  </div>

                  <div className="verifier-headline">
                    <h2>
                      {mlVerification.isValid ? 'ML-NUMBERLINK: ACCEPT' : 'ML-NUMBERLINK: REJECT'}
                    </h2>
                    <p className="verdict-time-poly">
                      Theorem 3 &bull; O(W &middot; H &middot; L) = {mlVerification.totalCellsChecked} Cells
                    </p>
                    <p className="verdict-explain">
                      {mlVerification.isValid
                        ? 'All terminal pairs connected via vertex-disjoint paths across Layers 1 & 2, and every mandatory checkpoint m_j ∈ M is covered!'
                        : `Mandatory clause checkpoints uncovered: ${mlVerification.uncoveredCheckpoints.join(', ')}. Adjust variable track polarities!`}
                    </p>
                  </div>

                  <div className="verifier-status-box">
                    <div className="status-metric">
                      <span className="metric-label">Terminal Pairs Connected</span>
                      <span className="metric-val val-good">
                        {mlBoard.terminals.length} / {mlBoard.terminals.length}
                      </span>
                    </div>
                    <div className="status-metric">
                      <span className="metric-label">Vertex-Disjoint (Portals P)</span>
                      <span className="metric-val val-good">YES (L=2 Bridges)</span>
                    </div>
                    <div className="status-metric">
                      <span className="metric-label">Mandatory Cells M Covered</span>
                      <span
                        className={`metric-val ${
                          mlVerification.allMandatoryCovered ? 'val-good' : 'val-bad'
                        }`}
                      >
                        {mlVerification.coveredCheckpoints.length} / {mlBoard.mandatoryCells.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="neu-card edu-takeaway">
                  <h4 className="takeaway-title">Why L=2 Portals &amp; Checkpoints M Matter</h4>
                  <p>
                    Standard 2D Numberlink reductions require giant planar crossover gadgets (Adcock et al., 2014). By introducing <strong>Layer Portals P</strong> and <strong>Mandatory Checkpoints M</strong>, crossovers become 2-cell vertical bridges and clauses become single mandatory cells!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
         * TAB 4: ZERO-KNOWLEDGE PROOF STUDIO (Section 4: Protocols A & B)
         * ==================================================================== */}
        {activeTab === 'zkp' && (
          <div className="tab-stage">
            <section className="neu-controls-bar">
              <div className="formula-selector">
                <span className="selector-label">Section 4 ZKP Protocol:</span>
                <div className="select-pill-group">
                  <button
                    className={`neu-pill ${
                      activeZkpProtocol === 'blum-trappath' ? 'active' : ''
                    }`}
                    onClick={() => setActiveZkpProtocol('blum-trappath')}
                  >
                    Protocol A: Blum Graph Isomorphism (Trap-Path)
                  </button>
                  <button
                    className={`neu-pill ${
                      activeZkpProtocol === 'cutchoose-sat' ? 'active' : ''
                    }`}
                    onClick={() => setActiveZkpProtocol('cutchoose-sat')}
                  >
                    Protocol B1: Cut-and-Choose (3-SAT Dungeon)
                  </button>
                  <button
                    className={`neu-pill ${
                      activeZkpProtocol === 'cutchoose-ml' ? 'active' : ''
                    }`}
                    onClick={() => setActiveZkpProtocol('cutchoose-ml')}
                  >
                    Protocol B2: 3-Way Color Audit (ML-Numberlink)
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className={`neu-action-btn ${
                    zkpSessionRoleMode === 'two-player-manual' ? 'btn-sky' : 'btn-active-amber'
                  }`}
                  onClick={() =>
                    setZkpSessionRoleMode((m) =>
                      m === 'two-player-manual' ? 'auto-verifier-bot' : 'two-player-manual'
                    )
                  }
                  title="Switch between Two-Player Manual Verifier mode and Automated Verifier Bot mode"
                >
                  <Cpu size={15} />
                  <span>
                    Session Mode:{' '}
                    {zkpSessionRoleMode === 'two-player-manual'
                      ? 'Two-Player / Manual Verifier'
                      : 'Player (Prover) vs. Auto-Verifier Bot'}
                  </span>
                </button>
                <button
                  className={`neu-action-btn ${
                    zkpProverMode === 'honest' ? 'btn-teal' : 'btn-rose'
                  }`}
                  onClick={() =>
                    setZkpProverMode((m) => (m === 'honest' ? 'cheating' : 'honest'))
                  }
                >
                  <Shuffle size={15} />
                  <span>
                    Prover Role: {zkpProverMode === 'honest' ? 'Honest (Has Witness)' : 'Cheating Prover!'}
                  </span>
                </button>
              </div>
            </section>

            {/* 4-PHASE INTERACTIVE ZKP PROTOCOL STEPPER (Commitment -> Challenge -> Opening -> Soundness) */}
            <div className="neu-card">
              <div className="card-header">
                <div>
                  <span className="section-kicker">
                    Interactive ZKP Demo Mechanics &bull; 4-Phase Cryptographic State Machine
                  </span>
                  <h3 className="card-title">
                    Round-by-Round Protocol Execution: Commitment &rarr; Challenge &rarr; Opening &rarr; Soundness
                  </h3>
                </div>
                <span className="formula-size-badge">
                  State: {zkpStepPhase.toUpperCase()}
                </span>
              </div>

              <div className="recipe-steps-grid" style={{ marginTop: '10px', marginBottom: '16px' }}>
                <div
                  className="recipe-card-neu"
                  style={{
                    borderColor:
                      zkpStepPhase === 'committed' ? 'var(--accent-teal)' : undefined,
                  }}
                >
                  <div className="problem-domain-pill">Phase 1 &bull; Prover Commitment</div>
                  <h4>1. Permute &amp; Lock Witness</h4>
                  <p>
                    Prover samples a fresh secret permutation <em>&sigma; &isin; S<sub>n</sub></em> (or color shuffle <em>&psi; &isin; S<sub>k</sub></em>) and publishes binding SHA-256 commitments <code>Com(G')</code>, <code>Com(T')</code>, and <code>Com(&pi;')</code>.
                  </p>
                  <button
                    className="neu-action-btn btn-teal"
                    style={{ marginTop: '8px' }}
                    onClick={handleZkpPhase1Commit}
                  >
                    <Lock size={14} />
                    <span>Step 1: Lock Commitments</span>
                  </button>
                </div>

                <div
                  className="recipe-card-neu"
                  style={{
                    borderColor:
                      zkpStepPhase === 'challenged' ? 'var(--accent-sky)' : undefined,
                  }}
                >
                  <div className="problem-domain-pill">Phase 2 &bull; Random Challenge</div>
                  <h4>2. Verifier Coin Flip</h4>
                  <p>
                    {zkpSessionRoleMode === 'auto-verifier-bot'
                      ? 'Automated Verifier Bot samples a uniform cryptographic challenge c ∈_R {0, 1} after commitments are locked.'
                      : 'In Two-Player mode, the human Verifier selects challenge bit b = 0 (Isomorphism) or b = 1 (Permuted Path).'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {zkpSessionRoleMode === 'auto-verifier-bot' ? (
                      <button
                        className="neu-action-btn btn-sky"
                        onClick={() => handleZkpPhase2Challenge()}
                      >
                        <Sparkles size={14} />
                        <span>Step 2: Auto-Verifier Coin Flip</span>
                      </button>
                    ) : (
                      <>
                        <button
                          className="neu-action-btn btn-sky"
                          onClick={() => handleZkpPhase2Challenge(0)}
                        >
                          <span>Flip b = 0</span>
                        </button>
                        <button
                          className="neu-action-btn btn-sky"
                          onClick={() => handleZkpPhase2Challenge(1)}
                        >
                          <span>Flip b = 1</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div
                  className="recipe-card-neu"
                  style={{
                    borderColor:
                      zkpStepPhase === 'verified' ? 'var(--accent-amber)' : undefined,
                  }}
                >
                  <div className="problem-domain-pill">Phase 3 &amp; 4 &bull; Opening &amp; Soundness</div>
                  <h4>3. Unblind &amp; Verify</h4>
                  <p>
                    Prover opens only the challenged lockbox. Client-side verifier checks isomorphism or runs the polynomial-time verifier and updates soundness error <strong>(1/2)<sup>k</sup></strong>, <strong>(2/3)<sup>k</sup></strong>, or <strong>(1/3)<sup>k</sup></strong>.
                  </p>
                  <button
                    className="neu-action-btn btn-active-amber"
                    style={{ marginTop: '8px' }}
                    onClick={handleZkpPhase3OpenAndVerify}
                  >
                    <Eye size={14} />
                    <span>Step 3: Open &amp; Verify Round</span>
                  </button>
                </div>
              </div>

              {pendingRoundPreview && (
                <div className="code-block-neu">
                  <strong>Live Cryptographic State Machine Buffer (Round #{pendingRoundPreview.round}):</strong>
                  <br />
                  &bull; <strong>Phase 1 Locked Commitments:</strong> Com(G', T') = <code>{pendingRoundPreview.commitmentHashG}</code> | Com(&pi;') = <code>{pendingRoundPreview.commitmentHashPi}</code>
                  <br />
                  &bull; <strong>Secret Vertex Permutation &sigma;:</strong>{' '}
                  {zkpStepPhase === 'committed'
                    ? '[HIDDEN INSIDE LOCKBOX UNTIL CHALLENGE]'
                    : Object.entries(pendingRoundPreview.permutationMap)
                        .map(([k, v]) => `${k}↦${v}`)
                        .join(', ')}
                  <br />
                  &bull; <strong>Phase 2 Challenge Bit:</strong>{' '}
                  {zkpStepPhase === 'committed'
                    ? 'Awaiting Verifier Challenge...'
                    : `b = ${pendingRoundPreview.challengeBit} (${
                        pendingRoundPreview.challengeBit === 0
                          ? 'Audit Graph & Trap Isomorphism σ'
                          : 'Audit Permuted Hamiltonian Path π\''
                      })`}
                  <br />
                  &bull; <strong>Phase 3 &amp; 4 Opening &amp; Soundness Verdict:</strong>{' '}
                  {zkpStepPhase === 'verified'
                    ? `${pendingRoundPreview.revealedContent} | Soundness Error (1/2)^${pendingRoundPreview.round} = ${Math.pow(
                        0.5,
                        pendingRoundPreview.round
                      ).toExponential(2)}`
                    : 'Click "Step 3: Open & Verify Round" (or use the fast audit buttons below) to append to transcript.'}
                </div>
              )}
            </div>

            {/* PROTOCOL A: BLUM GRAPH ISOMORPHISM FOR TRAP-PATH */}
            {activeZkpProtocol === 'blum-trappath' && (
              <div className="theory-layout">
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">Section 4.1 &bull; Protocol A &bull; Soundness Error &epsilon; = 1/2</span>
                      <h3 className="card-title">
                        Blum-Style Graph &amp; Trap Isomorphism ZKP for Trap-Path
                      </h3>
                    </div>
                    <span className="zkp-soundness-badge">
                      Confidence after {blumHistory.length} rounds:{' '}
                      {blumHistory.length === 0
                        ? '0%'
                        : `${(100 * (1 - Math.pow(0.5, blumHistory.length))).toFixed(4)}%`}
                    </span>
                  </div>

                  <div className="edu-note">
                    {explainMode === 'layman' ? (
                      <p>
                        <strong>How to Prove You Solved the Dungeon Without Showing Your Path:</strong> The Prover scrambles all the room names using a secret random shuffle &sigma; and locks both the scrambled dungeon map and the scrambled winning path inside cryptographic lockboxes. As the Verifier, you flip a coin:
                        <br />
                        &bull; <strong>Heads (b = 0):</strong> Demand to see the shuffle key &sigma; to verify the scrambled dungeon is an exact twin of the real dungeon (learns nothing about the path!).
                        <br />
                        &bull; <strong>Tails (b = 1):</strong> Demand to see the scrambled winning path on the scrambled map without the shuffle key (proves a valid trap-free path exists, but since room names are scrambled, reveals zero knowledge of the real rooms!).
                      </p>
                    ) : (
                      <p>
                        <strong>Formal Blum Protocol on (G, T):</strong> In round <em>r</em>, Prover <em>P</em> samples random permutation <em>&sigma; &isin; S<sub>n</sub></em>, commits to <em>G' = &sigma;(G)</em>, <em>T' = &sigma;(T)</em>, and permuted path <em>&pi;' = &sigma;(&pi;)</em> via SHA-256(data &parallel; nonce). Verifier <em>V</em> sends challenge bit <em>b &isin; &#123;0, 1&#125;</em>. A cheating prover fails with probability at least 1/2 per round, yielding 1 &minus; (1/2)<sup>20</sup> &approx; 99.9999% confidence in 20 rounds.
                      </p>
                    )}
                  </div>

                  <div className="zkp-arena-neu">
                    <div className="arena-header">
                      <h4>Issue Verifier Challenge Bit b &isin; &#123;0, 1&#125;</h4>
                      <div className="arena-actions">
                        <button
                          className="neu-action-btn btn-teal"
                          onClick={() => handleTriggerBlumChallenge(0)}
                        >
                          <GitBranch size={15} />
                          <span>Challenge b = 0 (Audit Isomorphism &sigma;)</span>
                        </button>
                        <button
                          className="neu-action-btn btn-sky"
                          onClick={() => handleTriggerBlumChallenge(1)}
                        >
                          <Route size={15} />
                          <span>Challenge b = 1 (Audit Permuted Path &pi;')</span>
                        </button>
                        <button className="neu-action-btn" onClick={handleRun20BlumRounds}>
                          <Play size={15} />
                          <span>Run 20 Rounds (99.9999%)</span>
                        </button>
                        <button
                          className="neu-action-btn"
                          onClick={() => setBlumHistory([])}
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </div>

                    {blumHistory.length > 0 && (
                      <div className="zkp-transcript-table">
                        <div className="transcript-head transcript-row-5col">
                          <span>Round</span>
                          <span>Challenge b</span>
                          <span>Commitments (G', T', &pi;')</span>
                          <span>Prover Response &amp; Theorem 2 Audit</span>
                          <span>Confidence</span>
                        </div>
                        {blumHistory.map((item) => (
                          <div
                            key={item.round}
                            className={`transcript-row transcript-row-5col ${
                              item.passed ? 'row-pass' : 'row-fail'
                            }`}
                          >
                            <span>#{item.round}</span>
                            <span className="witness-code">
                              {item.challengeBit === 0 ? 'b = 0 (Iso)' : 'b = 1 (Path)'}
                            </span>
                            <span className="witness-code">{item.commitmentHashPi}</span>
                            <span>{item.revealedContent}</span>
                            <span className="witness-code">
                              {(item.cumulativeSoundness * 100).toFixed(3)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROTOCOL B1: CUT-AND-CHOOSE FOR 3-SAT DUNGEON */}
            {activeZkpProtocol === 'cutchoose-sat' && (
              <div className="theory-layout">
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">
                        Section 4.2 &bull; Protocol B1 &bull; Soundness &epsilon; = 1 &minus; 1/(n+m)
                      </span>
                      <h3 className="card-title">
                        XOR-Blinded Cut-and-Choose ZKP for 3-SAT Dungeon
                      </h3>
                    </div>
                  </div>

                  <div className="edu-note">
                    <p>
                      Prover commits to an XOR-blinded switch state <em>(s<sub>i</sub> &oplus; r<sub>i</sub>, s̄<sub>i</sub> &oplus; r<sub>i</sub>)</em> for each variable. Verifier challenges either a <strong>Variable Room V<sub>i</sub></strong> (verifying mutually exclusive switch activation) or a <strong>Clause Trap Room C<sub>j</sub></strong> (where the 3 incoming switch wires are randomly permuted and opened to prove &ge; 1 wire is active without revealing which literal disarmed the trap).
                    </p>
                  </div>

                  <div className="zkp-arena-neu">
                    <div className="clause-challenge-buttons">
                      {activeFormula.variables.map((v) => (
                        <button
                          key={v}
                          className="challenge-clause-btn"
                          onClick={() => handleTriggerSatCutAndChoose('Variable Room', v)}
                        >
                          <Lock size={14} />
                          <span>Audit Variable Room V({v})</span>
                        </button>
                      ))}
                      {activeFormula.clauses.map((c) => (
                        <button
                          key={c.id}
                          className="challenge-clause-btn"
                          onClick={() => handleTriggerSatCutAndChoose('Clause Trap Room', c.id)}
                        >
                          <ShieldCheck size={14} />
                          <span>Audit Trap Room {c.id}</span>
                        </button>
                      ))}
                    </div>

                    {satZkpHistory.length > 0 && (
                      <div className="zkp-transcript-table">
                        <div className="transcript-head">
                          <span>Round</span>
                          <span>Audit Type</span>
                          <span>Target</span>
                          <span>Opened Commitment Transcript</span>
                        </div>
                        {satZkpHistory.map((h) => (
                          <div
                            key={h.round}
                            className={`transcript-row ${h.passed ? 'row-pass' : 'row-fail'}`}
                          >
                            <span>#{h.round}</span>
                            <span>{h.targetType}</span>
                            <span className="witness-code">{h.targetId}</span>
                            <span>{h.openedState}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROTOCOL B2: 3-WAY CUT-AND-CHOOSE FOR ML-NUMBERLINK */}
            {activeZkpProtocol === 'cutchoose-ml' && (
              <div className="theory-layout">
                <div className="neu-card">
                  <div className="card-header">
                    <div>
                      <span className="section-kicker">
                        Section 4.2 &bull; Protocol B2 &bull; Single-Round Catch 1/3 &bull; Soundness Error (2/3)^k
                      </span>
                      <h3 className="card-title">
                        Color-Permutation Cut-and-Choose ZKP for ML-Numberlink
                      </h3>
                    </div>
                  </div>

                  <div className="edu-note">
                    <p>
                      Prover applies a random permutation <em>&psi; &isin; S<sub>k</sub></em> to the path colors &#123;1, …, k&#125; across both layers and commits to the color and direction of every cell <em>(x, y, &#8467;) &isin; V</em>. Verifier selects one of three audit challenges below (catching any violation with probability &ge; 1/3 per round, so soundness error decays as (2/3)<sup>k</sup>, or (1/3)<sup>k</sup> when 2 of 3 sub-audits are opened simultaneously):
                    </p>
                  </div>

                  <div className="zkp-arena-neu">
                    <div className="clause-challenge-buttons">
                      <button
                        className="challenge-clause-btn"
                        onClick={() => handleTriggerMLAudit('terminals')}
                      >
                        <Lock size={14} />
                        <span>1. Audit Terminal Consistency (s_r, t_r)</span>
                      </button>
                      <button
                        className="challenge-clause-btn"
                        onClick={() => handleTriggerMLAudit('mandatory')}
                      >
                        <Sparkles size={14} />
                        <span>2. Audit Mandatory Checkpoints (M)</span>
                      </button>
                      <button
                        className="challenge-clause-btn"
                        onClick={() => handleTriggerMLAudit('flow')}
                      >
                        <Layers size={14} />
                        <span>3. Audit 2&times;2 Window &amp; Portal Flow</span>
                      </button>
                    </div>

                    {mlZkpHistory.length > 0 && (
                      <div className="zkp-transcript-table">
                        <div className="transcript-head">
                          <span>Round</span>
                          <span>Selected Audit Challenge</span>
                          <span>Opened Commitments</span>
                          <span>Soundness Error &epsilon;^R</span>
                        </div>
                        {mlZkpHistory.map((h) => (
                          <div
                            key={h.round}
                            className={`transcript-row ${h.passed ? 'row-pass' : 'row-fail'}`}
                          >
                            <span>#{h.round}</span>
                            <span className="witness-code">{h.auditType}</span>
                            <span>{h.openedSummary}</span>
                            <span className="witness-code">{h.soundnessErr}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
         * TAB 5: INTERACTIVE WEB PLATFORM, VERIFIER PIPELINE & COMPILER (Section 5)
         * ==================================================================== */}
        {activeTab === 'platform' && (
          <div className="theory-layout">
            {/* 5.1 Frontend Stack, Canvas/Grid Rendering & State Machine Engine */}
            <div className="neu-card">
              <div className="card-header">
                <div>
                  <span className="section-kicker">
                    Section 5.1 &bull; Interactive Web Platform &amp; Frontend State Machine
                  </span>
                  <h3 className="card-title">
                    Frontend Stack, Dual SVG/Grid Rendering Engine &amp; Live State Machine
                  </h3>
                </div>
                <span className="formula-size-badge">React 19 + TS 5.8 + Vite 8 PWA</span>
              </div>

              <div className="edu-note">
                {explainMode === 'layman' ? (
                  <p>
                    <strong>How the Puzzle Engine Works Under the Hood:</strong> Every time you flip a switch, walk into a dungeon room, or route a pipe through a portal, the browser updates a live <strong>State Machine</strong>. It tracks where your character is standing, which doors have permanently locked behind you, which laser traps have been tripped, and whether all puzzle rules are satisfied — updating the visual board in less than a millisecond!
                  </p>
                ) : (
                  <p>
                    <strong>Deterministic Client-Side State Machine:</strong> Built on a zero-latency client-side stack (React 19, TypeScript 5.8, Vite 8 with Workbox Service Worker PWA caching), the engine maintains an immutable state tuple <em>&Sigma; = (v<sub>curr</sub>, A, visited[], trapped[], occ[][][])</em>. Transitions <em>&delta;(&Sigma;, action)</em> immediately recompute both the <strong>SVG Vector Graph Canvas</strong> (for <em>Trap-Path</em>) and the <strong>CSS Grid Multi-Layer Tensor</strong> (for <em>3-SAT-Dungeon</em> and <em>ML-Numberlink</em>).
                  </p>
                )}
              </div>

              <div className="recipe-steps-grid">
                <div className="recipe-card-neu">
                  <div className="problem-domain-pill">1. Rendering Architecture</div>
                  <h4>SVG Graph + 2D/3D Grid Canvas</h4>
                  <p>
                    <strong>Candidate 1 &amp; 3</strong> render on hardware-accelerated CSS Grid matrices with reactive cell states (<em>W &times; H &times; L</em>), while <strong>Candidate 2 (Trap-Path)</strong> renders on a <code>760&times;380</code> interactive SVG vector canvas with cubic/quadratic Bézier trap arcs <em>(u, v) &isin; D</em> and step-order badges.
                  </p>
                </div>

                <div className="recipe-card-neu">
                  <div className="problem-domain-pill">2. Character &amp; Lock State</div>
                  <h4>Visited Rooms &amp; Portcullis Locks</h4>
                  <p>
                    In <strong>3-SAT-Dungeon</strong>, choosing corridor <em>u<sub>i</sub><sup>T</sup></em> or <em>u<sub>i</sub><sup>F</sup></em> triggers a one-way portcullis lock at junction <em>r<sub>i+1</sub></em>. In <strong>Trap-Path</strong>, stepping out of vertex <em>v</em> sets <code>visited[v] = true</code>, permanently locking that room against re-entry.
                  </p>
                </div>

                <div className="recipe-card-neu">
                  <div className="problem-domain-pill">3. Dynamic Switch &amp; Trap Propagation</div>
                  <h4>Real-Time Trap Vector trapped[v]</h4>
                  <p>
                    When the player exits room <em>u</em> in <strong>Trap-Path</strong>, the engine iterates over outgoing directed trap edges <em>(u, w) &isin; D</em> and sets <code>trapped[w] = u</code>, visually styling room <em>w</em> with a crimson dashed warning border.
                  </p>
                </div>
              </div>

              {/* Live State Machine Telemetry Snapshot */}
              <div className="code-block-neu" style={{ marginTop: '16px' }}>
                <strong>Live Frontend State Machine Telemetry (&Sigma; Snapshot Across All 3 Engines):</strong>
                <br />
                &bull; <strong>[Candidate 1 DAG State]:</strong> Active Switches A = &#123;
                {activeFormula.variables
                  .map((v, i) => (assignment[v] ? `s_${i + 1}` : `s̄_${i + 1}`))
                  .join(', ')}
                &#125; | Disarmed Traps: {verification.satisfiedClausesCount}/{verification.totalClausesCount} | Fog-of-War: {fogOfWarEnabled ? 'ON' : 'OFF'}
                <br />
                &bull; <strong>[Candidate 2 Trap-Path State]:</strong> Player Head v_curr = <code>{trapCandidatePath[trapCandidatePath.length - 1]}</code> | Locked Rooms visited[] = [{trapCandidatePath.join(' → ')}] ({trapVerification.visitedCount}/{trapVerification.totalVertices}) | Active Traps trapped[] = &#123;
                {Object.entries(trapVerification.activeTrappedRooms)
                  .map(([target, src]) => `${target} (by ${src})`)
                  .join(', ') || '∅'}
                &#125;
                <br />
                &bull; <strong>[Candidate 3 ML-Numberlink State]:</strong> Grid Tensor = {mlBoard.width}&times;{mlBoard.height}&times;{mlBoard.layers} ({mlVerification.totalCellsChecked} cells) | Active Portals P = {mlBoard.portals.length} | Mandatory Checkpoints M Covered = {mlVerification.coveredCheckpoints.length}/{mlBoard.mandatoryCells.length}
              </div>
            </div>

            {/* 5.2 Algorithmic Solver & Client-Side Polynomial-Time Verifier Pipeline */}
            <div className="neu-card">
              <div className="card-header">
                <div>
                  <span className="section-kicker">
                    Section 5.2 &bull; Algorithmic Solver &amp; Client-Side Verifier Pipeline
                  </span>
                  <h3 className="card-title">
                    How the Program Checks Certificates in O(|V| + |E|), O(|V| + |D|), and O(W &middot; H &middot; L) Time
                  </h3>
                </div>
                <div className="stepper-buttons">
                  <button
                    className={`step-btn ${selectedVerifierCodeTab === 'thm1' ? 'step-active' : ''}`}
                    onClick={() => setSelectedVerifierCodeTab('thm1')}
                  >
                    Theorem 1: O(|V|+|E|)
                  </button>
                  <button
                    className={`step-btn ${selectedVerifierCodeTab === 'thm2' ? 'step-active' : ''}`}
                    onClick={() => setSelectedVerifierCodeTab('thm2')}
                  >
                    Theorem 2: O(|V|+|D|)
                  </button>
                  <button
                    className={`step-btn ${selectedVerifierCodeTab === 'thm3' ? 'step-active' : ''}`}
                    onClick={() => setSelectedVerifierCodeTab('thm3')}
                  >
                    Theorem 3: O(W&middot;H&middot;L)
                  </button>
                  <button
                    className={`step-btn ${selectedVerifierCodeTab === 'solver' ? 'step-active' : ''}`}
                    onClick={() => setSelectedVerifierCodeTab('solver')}
                  >
                    Backtracking SAT Oracle
                  </button>
                </div>
              </div>

              {selectedVerifierCodeTab === 'thm1' && (
                <div className="code-block-neu">
                  <strong>// Theorem 1 Client-Side Verifier: 3-SAT-Dungeon in O(|V| + |E|) = O(n + m) Deterministic Time</strong>
                  <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{`function verify3SatDungeon(D = (G, s, t, S, tau), candidatePath pi):
  1. Check pi[0] == s and pi[|pi|-1] == t, and |pi| <= |V| = 3n + 1 + m.
  2. Initialize activeSwitchSet A = emptySet().
  3. For k = 0 to |pi| - 2:                     // O(|V|) loop over path steps
        Verify directed edge (pi[k], pi[k+1]) in E.
        If pi[k] is a corridor room u_i^T or u_i^F:
         A.add(switchTriggeredBy(pi[k]))        // Records s_i or s_bar_i in O(1)
  4. For each clause trap room c_j in pi:       // O(m) loop over 3-CNF clauses
       If (A intersect tau(c_j)) is empty:
         return REJECT ("Trap triggered in room " + c_j)
  5. Return ACCEPT ("Valid witness path disarms all m traps")`}</pre>
                </div>
              )}

              {selectedVerifierCodeTab === 'thm2' && (
                <div className="code-block-neu">
                  <strong>// Theorem 2 Client-Side Verifier: Trap-Path Sequential Trap Marking in O(|V| + |D|) Time</strong>
                  <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{`function verifyTrapPath(G = (V, E), T = (V, D), candidatePath pi = (v_1, ..., v_k)):
  1. Check |pi| == |V| (Hamiltonian coverage requirement).
  2. Initialize boolean arrays visited[v] = false, trapped[v] = false for all v in V. // O(|V|)
  3. For j = 1 to |pi|:                                                               // O(|V|) steps
       If j > 1 and (v_{j-1}, v_j) not in E: return REJECT ("Invalid corridor move")
       If visited[v_j] == true:              return REJECT ("Room locked after exit")
       If trapped[v_j] == true:              return REJECT ("Stepped into active trap!")
       visited[v_j] = true
       For each outgoing trap edge (v_j, w) in D:                                     // Amortised O(|D|) total
         trapped[w] = true
  4. Return ACCEPT ("Victory: All |V| rooms visited with zero triggered traps!")`}</pre>
                </div>
              )}

              {selectedVerifierCodeTab === 'thm3' && (
                <div className="code-block-neu">
                  <strong>// Theorem 3 Client-Side Verifier: ML-Numberlink 3D Occupancy Tensor in O(W * H * L) Time</strong>
                  <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{`function verifyMLNumberlink(board (W, H, L=2, T, P, M), candidatePaths {P_1, ..., P_k}):
  1. Allocate 3D occupancy array occ[1..W][1..H][1..2] = 0.                           // O(W * H * L)
  2. For each terminal pair r = 1..k:
       Verify P_r starts at s_r and ends at t_r.
       For each step u -> v along P_r:
         Verify u, v are 4-adjacent on same layer OR (u, v) is a vertical Portal p in P.
         If occ[v.x][v.y][v.layer] != 0: return REJECT ("Vertex collision detected")
         occ[v.x][v.y][v.layer] = r
  3. For each mandatory clause checkpoint m in M:                                     // O(|M|) <= O(W * H)
       If occ[m.x][m.y][m.layer] == 0: return REJECT ("Uncovered mandatory cell " + m)
  4. Return ACCEPT ("All terminals linked, paths vertex-disjoint, and M covered!")`}</pre>
                </div>
              )}

              {selectedVerifierCodeTab === 'solver' && (
                <div className="code-block-neu">
                  <strong>// Client-Side Backtracking SAT Solver &amp; Witness Synthesizer (findSatisfyingAssignments)</strong>
                  <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{`function solveAndSynthesizeWitness(formula phi):
  // Exponential O(2^n * m) search used ONLY when player clicks "Oracle Witness"
  1. Search boolean assignment tree over variables (x_1, ..., x_n) with early clause pruning.
  2. Once a satisfying assignment alpha is found:
       - Synthesize Candidate 1 DAG path pi_1 by selecting u_i^T iff alpha(x_i) == true.
       - Synthesize Candidate 2 Trap-Path pi_2: S -> chosenCorridors -> C_1..C_m -> oppositeCorridors -> t.
       - Synthesize Candidate 3 ML-Numberlink tracks P_r using upperTrack (T) or lowerTrack (F).`}</pre>
                </div>
              )}
            </div>

            {/* 5.3 Instance Generation & Dynamic Compilation Pipeline */}
            <div className="neu-card">
              <div className="card-header">
                <div>
                  <span className="section-kicker">
                    Section 5.3 &bull; Instance Generation &amp; Compilation Pipeline
                  </span>
                  <h3 className="card-title">
                    Hybrid Level Architecture: Hand-Crafted Pedagogical Levels vs. Dynamic 3-SAT Compiler
                  </h3>
                </div>
                <span className="info-tag">O(n + m) Client-Side Reduction Compiler</span>
              </div>

              <div className="edu-note">
                <p>
                  <strong>How Puzzle Levels Are Generated:</strong> Our platform combines <strong>hand-crafted puzzle presets</strong> (such as <em>Vault of Echoes</em> and the <em>Deadlock Triangle</em> No-instance, which isolate specific topological trap mechanics for new players) with a <strong>real-time polynomial-time reduction compiler</strong>. Any 3-CNF formula <em>&phi;</em> edited in Tab 1 (currently <strong>n = {activeFormula.variables.length}</strong> variables, <strong>m = {activeFormula.clauses.length}</strong> clauses) is dynamically compiled into playable instances across all three puzzle engines!
                </p>
              </div>

              <div className="recipe-steps-grid">
                <div className="recipe-card-neu">
                  <div className="problem-domain-pill">Stage 1 &bull; Input 3-CNF AST</div>
                  <h4>Formula Parser &amp; Clause Editor</h4>
                  <p>
                    User edits clauses <em>C<sub>1</sub> &land; … &land; C<sub>m</sub></em> or selects a preset. Current AST size: <strong>{activeFormula.variables.length} variables</strong>, <strong>{activeFormula.clauses.length} clauses</strong> ({activeFormula.clauses.length * 3} literals).
                  </p>
                  <button
                    className="neu-action-btn btn-teal"
                    style={{ marginTop: '10px' }}
                    onClick={() => setActiveTab('cand1')}
                  >
                    <ShieldCheck size={14} />
                    <span>Open in 3-SAT Dungeon ({dagVerticesCount} nodes)</span>
                  </button>
                </div>

                <div className="recipe-card-neu">
                  <div className="problem-domain-pill">Stage 2 &bull; compile3SatToTrapDungeon()</div>
                  <h4>Dynamic Trap-Path Graph (G, T)</h4>
                  <p>
                    Compiles variable diamonds <em>(T<sub>i</sub>, F<sub>i</sub>)</em>, clause rooms <em>C<sub>j</sub></em>, and directed trap edges <em>(F<sub>i</sub>, C<sub>j</sub>) &isin; D</em>. Current compiled size: <strong>|V| = {dynamicTrapPreset.nodes.length}</strong>, <strong>|E| = {dynamicTrapPreset.edges.length}</strong>, <strong>|D| = {dynamicTrapPreset.trapEdges.length}</strong>.
                  </p>
                  <button
                    className="neu-action-btn btn-sky"
                    style={{ marginTop: '10px' }}
                    onClick={() => {
                      handleSelectTrapPreset(-1);
                      setActiveTab('cand2');
                    }}
                  >
                    <Route size={14} />
                    <span>Launch Compiled Trap-Path Level</span>
                  </button>
                </div>

                <div className="recipe-card-neu">
                  <div className="problem-domain-pill">Stage 3 &bull; buildMLNumberlinkFromSat()</div>
                  <h4>Dynamic L=2 Grid &amp; Portals</h4>
                  <p>
                    Maps variables to terminal pairs <em>(s<sub>r</sub>, t<sub>r</sub>)</em>, crossover bridges to Portals <em>P</em>, and clauses to Mandatory Checkpoints <em>M</em> on a <strong>{mlBoard.width}&times;{mlBoard.height}&times;2</strong> tensor.
                  </p>
                  <button
                    className="neu-action-btn"
                    style={{ marginTop: '10px' }}
                    onClick={() => setActiveTab('cand3')}
                  >
                    <Layers size={14} />
                    <span>Launch Compiled ML-Numberlink</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 5.4 ZKP Interactive Demo Mechanics & Soundness Decay Table */}
            <div className="neu-card">
              <div className="card-header">
                <div>
                  <span className="section-kicker">
                    Section 5.4 &bull; ZKP Interactive Demo Mechanics &amp; Role Architecture
                  </span>
                  <h3 className="card-title">
                    Prover/Verifier Session Modes &amp; Soundness Error Decay: (1/2)ᵏ, (1/3)ᵏ, and (2/3)ᵏ
                  </h3>
                </div>
                <span className="zkp-soundness-badge">Zero Knowledge Leaked</span>
              </div>

              <div className="edu-note">
                <p>
                  <strong>Two Interactive Role Modes in the Web UI:</strong>
                  <br />
                  1. <strong>Player (Prover) vs. Automated Verifier Bot:</strong> The player solves the puzzle and locks cryptographic commitments <code>SHA-256(state &parallel; nonce)</code>; the client-side Automated Verifier Bot generates a pseudorandom challenge via <code>crypto.getRandomValues()</code> and audits the opened commitment.
                  <br />
                  2. <strong>Two-Player Interactive Session (Manual Verifier):</strong> Player 1 commits a witness on screen while Player 2 manually issues challenge bits <em>b &isin; &#123;0, 1&#125;</em> or selects sub-audits to test whether Player 1 truly possesses a valid witness or is bluffing (`Cheating Prover` mode).
                </p>
              </div>

              <div className="zkp-transcript-table">
                <div className="transcript-head transcript-row-5col">
                  <span>ZKP Protocol Variant</span>
                  <span>Phase 1 Commitment</span>
                  <span>Phase 2 Challenge</span>
                  <span>Single-Round Error &epsilon;</span>
                  <span>k = 20 Rounds Soundness Error &epsilon;ᵏ</span>
                </div>
                <div className="transcript-row transcript-row-5col row-pass">
                  <span className="witness-code">Protocol A (Blum Trap-Path)</span>
                  <span>Permuted G', T', &pi;' via &sigma; &isin; S_n</span>
                  <span>b &isin; &#123;0 (Iso), 1 (Path)&#125;</span>
                  <span className="witness-code">(1/2)¹ = 50.0%</span>
                  <span className="witness-code">(1/2)²⁰ = 9.54 &times; 10⁻⁷ (&lt; 10⁻⁶)</span>
                </div>
                <div className="transcript-row transcript-row-5col row-pass">
                  <span className="witness-code">Protocol B2 (3-Way Single Open)</span>
                  <span>Color-permuted grid &psi; &isin; S_k</span>
                  <span>c &isin; &#123;1 (Term), 2 (M), 3 (Flow)&#125;</span>
                  <span className="witness-code">(2/3)¹ = 66.7% (Catch 1/3)</span>
                  <span className="witness-code">(2/3)²⁰ = 3.00 &times; 10⁻⁴ (0.03%)</span>
                </div>
                <div className="transcript-row transcript-row-5col row-pass">
                  <span className="witness-code">Protocol B2* (Dual-Check Open)</span>
                  <span>Paired sub-commitment opening</span>
                  <span>Catches 2 of 3 constraint classes</span>
                  <span className="witness-code">(1/3)¹ = 33.3% (Catch 2/3)</span>
                  <span className="witness-code">(1/3)²⁰ = 2.87 &times; 10⁻¹⁰</span>
                </div>
                <div className="transcript-row transcript-row-5col row-pass">
                  <span className="witness-code">Protocol B1 (3-SAT Cut-Choose)</span>
                  <span>XOR-blinded switches s_i &oplus; r_i</span>
                  <span>1 of (n + m) rooms audited</span>
                  <span className="witness-code">1 &minus; 1/(n+m)</span>
                  <span className="witness-code">(1 &minus; 1/(n+m))ᵏ exponential decay</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
         * TAB 6: TSP CASE STUDY, REPORT SYNTHESIS & REFERENCES (Sections 2 & 6)
         * ==================================================================== */}
        {activeTab === 'theory' && (
          <div className="theory-layout">
            {/* Section 2.3: TSP Brute Force O(n!) vs Bellman-Held-Karp O(n^2 2^n) */}
            <div className="neu-card">
              <div className="card-header">
                <div>
                  <span className="section-kicker">
                    Section 2.3 Case Study &bull; Exponential-Time Exact Algorithms
                  </span>
                  <h3 className="card-title">
                    Travelling Salesman Problem (TSP): Naive O(n!) vs. Bellman–Held–Karp O(n² &middot; 2ⁿ)
                  </h3>
                </div>
                <span className="formula-size-badge">n = {tspCitiesN} Towns</span>
              </div>

              <div className="edu-note">
                <p>
                  <strong>Bellman–Held–Karp Dynamic Programming Recurrence:</strong> Fix starting town <em>v₁</em>. For subset <em>S &sube; V \ &#123;v₁&#125;</em> and endpoint <em>v &isin; S</em>:
                  <br />
                  <code>
                    C(S, v) = min_&#123;u &isin; S \ &#123;v&#125;&#125; &#123; C(S \ &#123;v&#125;, u) + w(u, v) &#125;
                  </code>
                  <br />
                  Exploiting optimal substructure over 2<sup>n&minus;1</sup> subsets reduces time complexity from factorial <strong>O(n!)</strong> to <strong>O(n² &middot; 2ⁿ)</strong> with <strong>O(n &middot; 2ⁿ)</strong> space &mdash; yet both remain strictly exponential!
                </p>
              </div>

              <div className="slider-container-neu">
                <div className="slider-label-row">
                  <span>
                    Number of Towns <strong>n = {tspCitiesN}</strong>
                  </span>
                  <span>
                    Held–Karp Speedup over Brute Force: <strong>{tspStats.speedupRatio}</strong>
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="32"
                  value={tspCitiesN}
                  onChange={(e) => setTspCitiesN(Number(e.target.value))}
                  className="neu-slider"
                />
                <div className="slider-markers">
                  <span onClick={() => setTspCitiesN(6)}>n = 6</span>
                  <span onClick={() => setTspCitiesN(12)}>n = 12</span>
                  <span onClick={() => setTspCitiesN(20)}>n = 20 (Infeasible n!)</span>
                  <span onClick={() => setTspCitiesN(30)}>n = 30 (Report Benchmark)</span>
                </div>
              </div>

              <div className="time-comparison-grid">
                <div className="time-card time-card-poly">
                  <div className="time-icon-badge">
                    <CheckCircle2 size={22} />
                  </div>
                  <h4>NP Certificate Verifier O(n)</h4>
                  <div className="big-time-stat">&lt; 1 &micro;s</div>
                  <p className="time-stat-detail">
                    Operations: <strong>{tspStats.verifierOpsStr}</strong>
                  </p>
                  <p className="time-desc">
                    Given a candidate tour &pi; and budget B, summing edge weights and checking uniqueness takes linear O(n) time.
                  </p>
                </div>

                <div className="time-card time-card-dp">
                  <div className="time-icon-badge sky-badge">
                    <Cpu size={22} />
                  </div>
                  <h4>Held–Karp DP O(n² &middot; 2ⁿ)</h4>
                  <div className="big-time-stat sky-time-stat">{tspStats.heldKarpTimeStr}</div>
                  <p className="time-stat-detail">
                    Ops: <strong>{tspStats.heldKarpOpsStr}</strong> &bull; Space: <strong>{tspStats.heldKarpSpaceStr}</strong>
                  </p>
                  <p className="time-desc">
                    Evaluates 2<sup>n&minus;1</sup> subset states with O(n) transitions each. Vastly faster than O(n!), yet hits the exponential wall around n &ge; 30.
                  </p>
                </div>

                <div className="time-card time-card-exp">
                  <div className="time-icon-badge ruby-badge">
                    <Clock size={22} />
                  </div>
                  <h4>Brute-Force Permutations O(n!)</h4>
                  <div className="big-time-stat exp-time-stat">{tspStats.bruteForceTimeStr}</div>
                  <p className="time-stat-detail">
                    Tours (n&minus;1)!: <strong>{tspStats.bruteForceOpsStr}</strong>
                  </p>
                  <p className="time-desc">
                    By Stirling's approximation, n! &sim; &radic;(2&pi;n)(n/e)<sup>n</sup>. Completely intractable even at n = 20.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 Summary Comparison Table of Our 3 Candidate Puzzles */}
            <div className="neu-card">
              <span className="section-kicker">Section 3 &amp; 4 Synthesis</span>
              <h3 className="card-title">Comparison of Our Three Original NP-Complete Candidate Puzzles</h3>
              <div className="zkp-transcript-table" style={{ marginTop: '14px' }}>
                <div className="transcript-head transcript-row-5col">
                  <span>Candidate Puzzle</span>
                  <span>Source Reduction</span>
                  <span>Verifier Time</span>
                  <span>ZKP Soundness &epsilon;</span>
                  <span>Key Pedagogical &amp; Interactive Advantage</span>
                </div>
                <div className="transcript-row transcript-row-5col row-pass">
                  <span className="witness-code">1. 3-SAT Dungeon</span>
                  <span>3-SAT</span>
                  <span className="witness-code">O(|V| + |E|)</span>
                  <span className="witness-code">1 &minus; 1/(n+m)</span>
                  <span>Directly visualises Boolean literals as corridor switches and clauses as sequential traps.</span>
                </div>
                <div className="transcript-row transcript-row-5col row-pass">
                  <span className="witness-code">2. Trap-Path</span>
                  <span>Ham-Path / 3-SAT</span>
                  <span className="witness-code">O(|V| + |D|)</span>
                  <span className="witness-code">1/2 (Blum)</span>
                  <span>Clean graph-isomorphism ZKP; room locking and trap edges create rich spatial route planning.</span>
                </div>
                <div className="transcript-row transcript-row-5col row-pass">
                  <span className="witness-code">3. ML-Numberlink</span>
                  <span>3-SAT (L=2)</span>
                  <span className="witness-code">O(W &middot; H &middot; L)</span>
                  <span className="witness-code">2/3 (3-Way)</span>
                  <span>Multi-layer portals P eliminate messy 2D crossovers; mandatory checkpoints M model clauses cleanly.</span>
                </div>
              </div>
            </div>

            {/* Section 2.2 Famous NP-Complete Problems & Algorithmic Puzzles */}
            <div className="neu-card">
              <span className="section-kicker">Section 2.2 &bull; Foundational Literature</span>
              <h3 className="card-title">Famous NP-Complete Problems &amp; Algorithmic Puzzles</h3>
              <div className="recipe-steps-grid">
                {FAMOUS_NP_PROBLEMS.map((prob, i) => (
                  <div key={i} className="recipe-card-neu">
                    <div className="problem-domain-pill">{prob.domain}</div>
                    <h4>{prob.name}</h4>
                    <p className="prob-cite">{prob.citation}</p>
                    <p style={{ marginTop: '8px' }}>
                      {explainMode === 'layman' ? prob.laymanAnalogy : prob.decisionQuestion}
                    </p>
                    <p className="prob-gadget-note">
                      <strong>Connection:</strong> {prob.gadgetRole}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6 References */}
            <div className="neu-card">
              <span className="section-kicker">Section 6 &bull; Bibliography</span>
              <h3 className="card-title">Academic References Cited in Report</h3>
              <div className="references-grid">
                <div className="ref-item"><strong>[Adcock2014]</strong> Adcock et al. (2014). <em>Zig-zag numberlink is NP-complete.</em> arXiv:1410.5845.</div>
                <div className="ref-item"><strong>[Colbourn1984]</strong> Colbourn, C. J. (1984). <em>The complexity of completing partial Latin squares.</em> Discrete Applied Mathematics, 8(1), 25–30.</div>
                <div className="ref-item"><strong>[Dasgupta2006]</strong> Dasgupta, Papadimitriou, &amp; Vazirani (2006). <em>Algorithms.</em> McGraw-Hill.</div>
                <div className="ref-item"><strong>[GareyJohnson1979]</strong> Garey, M. R., &amp; Johnson, D. S. (1979). <em>Computers and Intractability: A Guide to the Theory of NP-Completeness.</em> W. H. Freeman.</div>
                <div className="ref-item"><strong>[GMW1991]</strong> Goldreich, Micali, &amp; Wigderson (1991). <em>Proofs that yield nothing but their validity, or all languages in NP have zero-knowledge proof systems.</em> JACM, 38(3), 690–728.</div>
                <div className="ref-item"><strong>[HearnDemaine2009]</strong> Hearn, R. A., &amp; Demaine, E. D. (2009). <em>Games, Puzzles, and Computation.</em> CRC Press.</div>
                <div className="ref-item"><strong>[Kaye2000]</strong> Kaye, R. (2000). <em>Minesweeper is NP-complete.</em> The Mathematical Intelligencer, 22(2), 9–15.</div>
                <div className="ref-item"><strong>[KleinbergTardos2006]</strong> Kleinberg, J., &amp; Tardos, É. (2006). <em>Algorithm Design</em> (Ch. 8). Pearson.</div>
                <div className="ref-item"><strong>[Pulles2021]</strong> Pulles, B. (2021). <em>Analysis of Akari.</em> Radboud University Nijmegen.</div>
                <div className="ref-item"><strong>[Sipser2012]</strong> Sipser, M. (2012). <em>Introduction to the Theory of Computation</em> (3rd ed.). Cengage.</div>
                <div className="ref-item"><strong>[YatoSeta2003]</strong> Yato, T., &amp; Seta, T. (2003). <em>Complexity and completeness of finding another solution (ASP-completeness).</em> IEICE Trans. Fundamentals, E86-A(5).</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="neu-footer">
          <span>
            <strong>COMP3821 Creative Project (Group 5, Term 3 2026)</strong> &bull; Edward Dsouza, Louise Liu, Emmett Shang, Gururam Subramanian, Ryan Zhou
          </span>
          <span className="contrast-compliance-badge">
            github.com/CentillionJinx/3821Project
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
