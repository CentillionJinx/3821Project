# 3821Project — Designing, Proving, and Verifying Original $\mathsf{NP}$-Complete Algorithmic Puzzles

**COMP3821 Creative Project | Group 5 | Term 3, 2026**  
**Team Members:** Edward Dsouza (`z5689255`) • Louise Liu (`z5700939`) • Emmett Shang (`z5690546`) • Gururam Subramanian (`z5636559`) • Ryan Zhou (`z5688014`)  
**Live Repository:** [CentillionJinx/3821Project](https://github.com/CentillionJinx/3821Project)

---

## 1. Project Objective & Progression Review Scope Evolution

The core objective of our creative project is to **design an original grid-based puzzle that is provably $\mathsf{NP}$-complete, and showcase it interactively through an installable Progressive Web Application (PWA) where users can construct solutions and have them deterministically verified in polynomial time**.

### Week 7 Progression Review & Strategic Scope Decisions
During our Week 5–7 deep-dive into computational complexity theory, our team made critical design decisions documented in our Progression Review:
1. **Decoupling Zero-Knowledge Proofs (Transition to Bonus Research)**:
   In our initial proposal, we explored implementing both original $\mathsf{NP}$-completeness reductions and interactive Zero-Knowledge Proofs (ZKPs). We determined that combining multi-round cryptographic commit-and-open ZKP protocols alongside multiple original $\mathsf{NP}$-completeness proofs added excessive cognitive and implementation complexity. Consequently, **the primary project scope focuses 100% on original $\mathsf{NP}$-complete grid puzzle design and deterministic real-time polynomial-time verifiers**, while our interactive ZKP simulator and NP-Approximation modules are presented as dedicated *Bonus Research*.
2. **Timeline Adjustment (3 Weeks Remaining)**:
   We concentrated our theoretical investigations and report writing through the end of **Week 7**, leaving **3 weeks (Weeks 8–10)** to polish the interactive web application, produce educational materials, and design the final academic presentation poster.

---

## 2. Original $\mathsf{NP}$-Complete Puzzle Candidates (Team Discussion & Design)

### Candidate 1: "Carpets" — Floor Repair & Target Multiplicity Puzzle
- **Rules**: On an $N \times M$ grid of tiles $G$, each tile $t$ has either no target or a required target multiplicity $v(t) \in \mathbb{N}$ (representing damaged floor areas needing reinforcement). Players select a subcollection of grid-aligned carpets $B \subseteq \mathcal{C}$ such that:
  1. **Full Coverage**: $\bigcup_{S \in B} S$ covers the target floor.
  2. **Overlap Constraint**: For each tile $t$ with target $v(t)$, its multiplicity in the additive multiset $M = \sum_{S \in B} S$ must equal $v(t)$:
     $$\text{mult}_M(t) = v(t)$$
  3. **Unique Cover Constraint (No-Waste Rule)**: For each selected carpet $Q \in B$, there exists at least one tile $t \in Q$ such that $\text{mult}_M(t) = 1$ (no wasted carpets!).
- **Variations Supported**: Cylindrical / Toroidal boundary wrapping (ringworld) and wall barriers ($v(t) = 0$).
- **Deterministic Verifier**: Evaluates multiset multiplicities, coverage, and unique cover existence in $O(|B| \cdot |S| + NM)$ time.

### Candidate 2: "Hearts" // "Microbes" — Vital Organ Non-Overlap Puzzle
- **Rules**: On an $N \times M$ grid $G$, we are given a collection $\mathcal{C}$ of blobs (connected tiles). Each blob $A \in \mathcal{C}$ possesses body tiles $T(A)$ and a designated non-empty subset of **Vital Organs** $O(A) \subseteq T(A)$ (marked with ❤️).
- **Core Invariant**: Blobs may freely overlap on their standard body tissue, **BUT the vital organs of blob $A$ cannot overlap with ANY part of another blob $B$**:
  $$\forall A, B \in B, A \neq B \implies O(A) \cap T(B) = \emptyset$$
- **Variations Supported**: Tetris-inspired stacked colonies (dual intersection graph connectivity) and coverage quota satisfaction.
- **Deterministic Verifier**: Checks pairwise organ collisions and tile quotas in $O(|B|^2 \cdot |T|)$ polynomial operations.

### Candidate 3: "Quell the Insurgency" — Dictator vs Insurgency (Firefighter Variant)
- **Rules**: Played on a hexagonal board or generic graph $G = (V, E)$. Initial layout contains $k$ insurgent locations with weight $2$ (unrest level), while all other vertices are $0$.
- **Daily Simulation Dynamics**:
  1. **Insurgency Acts First**: Vertices with weight $2$ add $+1$ to all non-pacified neighbours (max $+1$ increase per day, capped at $2$). Newly created insurgents cannot spread on that same day.
  2. **Dictator Army Acts**: Player deploys the army to ONE unvisited vertex. The garrisoned vertex permanently becomes weight $-1$. An immediate suppression shockwave resets all adjacent vertices with weight $0 \le w \le 1$ back to $0$!
- **Win Condition**: Can total unrest weight be $\le n$ after $m$ days?
- **Theoretical Connection**: Directly connects to the **Firefighter Problem** (NP-complete on trees of maximum degree 3, Finbow, Hartnell, Li, Schmeisser 2007).

### Candidate 4: XOR Squares — Parity & Overlap Gadgets
- **Rules**: Toggling squares on an $W \times H$ grid where overlapping squares produce modulo-2 parity ($\sum \mathbb{I}[c \in s] \equiv b_c \pmod 2$). Literal mutex cells ($x_i \oplus \neg x_i = 1$) enforce exact variable truth assignment. Verified in $O(W \cdot H + |S|)$.

### Candidate 5: 3-SAT Trap-Switch Dungeon
- **Rules**: Directed trap graph traversal ($G = (V, E)$ with trap edges $D \subseteq V \times V$) where variable diamonds switch gates and trap rooms disable invalid corridor sequences. Verified in $O(|V| + |D|)$.

---

## 3. Researched Topics & Gadget Library (Citation Channel)

Our project surveys and models foundational $\mathsf{NP}$-completeness reductions:
1. **Parks Problem (Star Battle)** $\leftarrow$ 3-SAT: Independent sets in alternating cycle tracks and regional clause blockers.
2. **Akari (Light Up)** $\leftarrow$ Circuit-SAT: Light ray corridors, numbered wall logic inverters (NOT gates), AND/OR gates.
3. **Hedonic Games & Hedonic Among Us** $\leftarrow$ Exact Cover by 3-Sets (RX3C): Multi-agent coalition stability and cooperative turn-based movement.
4. **Held-Karp Dynamic Programming Algorithm**: Reducing TSP exact runtime from $O(n!)$ to $O(n^2 \cdot 2^n)$ via subset state memoization $C(S, v)$.
5. **Graph 3-Colouring & Vertex Cover**: Karp's foundational triangle palette and edge domination gadgets.

---

## 4. Bonus Research: Approximations & Zero-Knowledge Proofs

### Approximations of $\mathsf{NP}$-Complete Problems
- **Minimum Vertex Cover**: Maximal Matching 2-approximation ($|C| \le 2 \cdot \text{OPT}$).
- **Metric TSP**: Christofides–Serdyukov 1.5-approximation (MST + minimum-weight perfect matching on odd-degree vertices + Eulerian shortcutting).
- **MAX-3-SAT & The PCP Theorem**: Håstad's 1997 barrier proving that achieving $7/8 + \epsilon$ approximation ratio is $\mathsf{NP}$-hard.
- **0-1 Knapsack**: Fully Polynomial-Time Approximation Scheme (FPTAS) via value-rounding dynamic programming in $O(n^3 / \epsilon)$ time.

### Zero-Knowledge Proof Simulator
Interactive multi-round commitment-challenge-opening simulator demonstrating Blum's Graph Isomorphism protocol with $(1/2)^k$ soundness error, supporting both honest and cheating provers with SHA-256 commitments.

---

## 5. Project Progression Timeline (Week 4 to Week 10)

| Week | Original Proposal Plan | Revised Progression Plan (Current) |
| :--- | :--- | :--- |
| **Week 4** | Begin working on the report | Begin working on the report *(Completed)* |
| **Week 5** | Continue working on the report | Continue working on the report *(Completed)* |
| **Week 6** | Complete report | Continue report + begin working on app *(Completed)* |
| **Week 7** | Begin app + Progression Review | Continue report + continue app + Progression Review *(Milestone)* |
| **Week 8** | Complete app + begin poster | Complete report + continue app + begin poster |
| **Week 9** | Complete poster + final revision of report | Complete app + complete poster |
| **Week 10** | Final submission | Final review of all deliverables + submit |

---

## 6. Technical Stack & Local Development

- **Framework**: React 19, TypeScript 5.8, Vite 8
- **PWA**: `vite-plugin-pwa` with Workbox offline service worker caching
- **Icons & UI**: Lucide React, Obsidian Slate / Deep Navy / Luminous Teal dark theme

```bash
# Clone the repository
git clone git@github.com:CentillionJinx/3821Project.git
cd 3821Project

# Install dependencies
npm install

# Run development server
npm run dev

# Build production bundle with PWA assets
npm run build
```
