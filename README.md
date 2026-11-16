# Colouring Conundrum — Binary XOR-Square NP-Completeness Workbench

**UNSW COMP3821 Extended Algorithms & Programming Techniques · Term 3, 2026 · Group 5**

An interactive complexity-theory workbench for **Binary XOR-Square (`Colouring Conundrum`)**, proving membership in $\mathsf{NP}$ via a linear-time deterministic verifier and $\mathsf{NP}$-completeness via a constructive polynomial-time reduction from **Planar 3-SAT**.

---

## 1. Formal Decision Problem (`Binary XOR-Square`)

- **Instance**: A tuple $\mathcal{I} = (N, M, \chi_0, C, r)$ where:
  - $G = \{0, \dots, N-1\} \times \{0, \dots, M-1\}$ is an $N \times M$ grid of unit tiles ($N, M \ge 2$).
  - $F \subseteq G$ is the set of pre-assigned anchor tiles with fixed colouring $\chi_0 : F \to \{0, 1\}$.
  - $C \subseteq \{1, \dots, N-1\} \times \{1, \dots, M-1\}$ is the set of clued $2 \times 2$ interior corners, where corner $(i, j) \in C$ is surrounded clockwise from top-left by:
    $$a = (i-1, j-1),\quad b = (i-1, j),\quad c = (i, j),\quad d = (i, j-1).$$
  - $r : C \to \{0, 2, 4\}$ assigns each clued corner a boundary-transition count.
- **Boundary-Transition Functional**:
  $$\tau(a, b, c, d) = (a \oplus b) + (b \oplus c) + (c \oplus d) + (d \oplus a) \in \{0, 2, 4\}$$
  where $\oplus$ denotes addition modulo $2$ and $+$ denotes ordinary integer addition.
- **Question**: Does there exist a total colouring $\chi : G \to \{0, 1\}$ extending $\chi_0$ on $F$ such that $\tau(a, b, c, d) = r(i, j)$ for all $(i, j) \in C$?

### Key Structural Invariants

1. **Even-Parity Lemma**: Over $\mathbb{F}_2$, $(a \oplus b) \oplus (b \oplus c) \oplus (c \oplus d) \oplus (d \oplus a) = 0$, restricting $\operatorname{Im}(\tau)$ strictly to $\{0, 2, 4\}$.
2. **Dual Edge-Cut Equivalence**: Treating $\{0, 1\}$ as White/Black, $\tau(a, b, c, d)$ equals the exact number of black–white separating edges meeting at interior corner $(i, j)$.
3. **Diagonal Characterization of $R_2$**: Across the $2^4 = 16$ local $2 \times 2$ blocks, $R_0 = \{0000, 1111\}$ ($2$ states), $R_4 = \{0101, 1010\}$ ($2$ states), and
   $$(a, b, c, d) \in R_2 \iff (a \neq c) \lor (b \neq d) \qquad (12 \text{ states}).$$

---

## 2. Membership in $\mathsf{NP}$, Exact Solver & $\mathsf{NP}$-Completeness

- **Deterministic Verifier (`src/logic/conundrum.ts`)**: Checks all $|F|$ anchors and evaluates $\tau$ across all $|C|$ clued corners in $O(|F| + |C|) \subseteq O(N \cdot M)$ time using a binary grid certificate of $N \cdot M$ bits. Partial boards also run $O(1)$ ($\le 16$-state) local feasibility checks per corner.
- **Exact Solver (`solveConundrum`)**: Collapses $r = 0$ (equality) and $r = 4$ (checkerboard parity) components using a parity Disjoint-Set Union structure over $\mathbb{F}_2$, then resolves $r = 2$ diagonal disjunctions via unit propagation and MRV backtracking.
- **Schaefer's Dichotomy (1978)**: $R_0$ and $R_4$ are both affine over $\mathbb{F}_2$ and bijunctive (2-CNF), making $\{0, 4\}$-only boards solvable in polynomial time. Introducing $R_2$ ($r = 2$) violates all six tractable Schaefer conditions (`0-valid`, `1-valid`, `Horn`, `Dual-Horn`, `Affine`, `Bijunctive`).
- **Constructive Reduction (`src/logic/planarReduction.ts`)**: Reduces **Rectilinear Planar 3-SAT** (Lichtenstein 1982; Knuth & Raghunathan 1992) to Binary XOR-Square in $O((n + m)^2)$ grid area using:
  - **G1**: 2-wide $r = 0$ equality spines, bends, and fan-out junctions.
  - **G2**: 3-column inline `NOT` inverters using $r = 4$.
  - **G3**: $3 \times 3$ OR-clause core with fixed anchor $\chi_0(1,0) = 1$ and clues $r(1,1)=2$, $r(1,2)=2$, $r(2,2)=0$, proven valid iff $(x \lor y \lor z) = 1$.

---

## 3. Repository Architecture & Tech Stack

- **Stack**: React 19, TypeScript 6 (`tsc -b`), Vite 8, `vite-plugin-pwa`, `oxlint`, Node 24 native test runner (`--experimental-strip-types`).
- **Source Modules**:
  - `src/logic/conundrum.ts`: Core types, $\tau$ evaluator, $O(N \cdot M)$ verifier, partial infeasibility detector, dual cut extractor, exact Parity DSU + DPLL solver, and validated presets.
  - `src/logic/planarReduction.ts`: Rectilinear Planar 3-SAT $\le_p$ XOR-Square compiler, `G3` 8-assignment verifier, and Schaefer analysis table.
  - `src/logic/timelineData.ts`: Descriptive 6-stage chronological project record and superseded candidate matrix.
  - `src/components/ConundrumWorkspace.tsx` & `src/components/ProofSchematics.tsx`: Zero-scroll interactive board, edge-cut overlay, audit table, verifier telemetry, and live Planar 3-SAT compiler.
  - `src/components/TimelineView.tsx`: Chronological milestone archive and candidate comparison matrix.

---

## 4. Commands

```bash
npm install        # Install dependencies
npm run dev        # Start local development server
npm test           # Run exhaustive mathematical & reduction tests
npm run lint       # Run oxlint static analysis
npm run build      # Type-check (tsc -b) and build production bundle + PWA manifest
```

---

## 5. Group 5 Attribution

- **Edward Dsouza** (`z5689255`) · **Louise Liu** (`z5700939`) · **Emmett Shang** (`z5690546`) · **Gururam Subramanian** (`z5636559`) · **Ryan Zhou** (`z5688014`)
- **Mentor**: Amit Bhomwick · **Course**: UNSW COMP3821, Term 3, 2026
