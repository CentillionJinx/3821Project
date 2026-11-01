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

## 2. Original $\mathsf{NP}$-Complete Puzzle Candidates

### Candidate 1: XOR Squares (Overlapping Square Parity Grid) — *Our Leading Original Candidate*
- **Rules**: On an $W \times H$ grid, players toggle candidate squares $s \in S$. Each marked cell requires either an **ODD (1)** or **EVEN (0)** number of overlapping squares:
  $$\left(\sum_{s \in S'} \mathbb{I}[c \in s]\right) \bmod 2 = b_c$$
- **Gadgets**:
  - **Literal Mutex Gadget**: Variable $x_i$ features two candidate squares $S_i^T$ (True) and $S_i^F$ (False) intersecting at a mutex cell with required parity $1$. The equation $(S_i^T + S_i^F) \equiv 1 \pmod 2$ guarantees that **exactly one** of $\{S_i^T, S_i^F\}$ is chosen.
  - **Clause Parity Gadget**: Clause cell $c_j$ requires odd parity (1), satisfied when at least one true literal square touches it.
- **Deterministic Verifier**: Evaluates cell overlap counts and checks parity constraints in $O(W \cdot H + |S|)$ arithmetic operations.

### Candidate 2: Carpets & Hearts (Parks / Star Battle Reduction)
- **Rules**: An $N \times N$ grid is partitioned into $N$ distinct colored regions. Place exactly 1 Heart (❤️) per row, 1 Heart per column, and 1 Heart per region, subject to the **King's move non-adjacency rule** ($\text{dist}_\infty(h_1, h_2) \ge 2$, no two hearts may touch even diagonally).
- **Gadgets**:
  - **Variable Corridors**: 2-wide alternating parity tracks where placing a heart in even slots encodes True, and odd slots encode False.
  - **Clause Deadlock Rooms**: A clause region borders literal tracks. If all 3 literals are False, their hearts touch and block all candidate cells in the clause room, making it impossible to satisfy the region quota!
- **Deterministic Verifier**: Audits row, column, and region quotas alongside pairwise 8-neighbourhood distances in $O(N^2)$ deterministic time.

### Candidate 3: 3-SAT Trap-Switch Dungeon
- **Rules**: Traverse a graph $G = (V, E)$ visiting every room exactly once (Hamiltonian path) without triggering directed trap edges $D \subseteq V \times V$.
- **Gadgets**: Variable choice diamonds and switch-controlled portcullis locks.
- **Deterministic Verifier**: Executes the Sequential Trap Marking Procedure in $O(|V| + |D|)$ deterministic time.

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
