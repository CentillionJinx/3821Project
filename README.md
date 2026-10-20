# 3821Project — Designing, Proving, and Verifying Original $\mathsf{NP}$-Complete Algorithmic Puzzles with Zero-Knowledge Proofs

**COMP3821 Creative Project | Group 5 | Term 3, 2026**  
**Team Members:** Edward Dsouza (`z5689255`) • Louise Liu (`z5700939`) • Emmett Shang (`z5690546`) • Gururam Subramanian (`z5636559`) • Ryan Zhou (`z5688014`)

---

## 1. Interactive Web Platform & Frontend State Machine Engine

### Frontend Stack & Rendering Engine
- **Core Stack**: React 19, TypeScript 5.8, Vite 8, and `vite-plugin-pwa` (Workbox offline Service Worker caching).
- **Dual Canvas & Grid Rendering**:
  1. **Interactive SVG Vector Graph Engine (`760×380` viewport)**: Renders Candidate 2 (`Trap-Path`) navigation graphs $G = (V, E)$ and quadratic Bézier directed trap arcs $(u, v) \in D$ in $T = (V, D)$, complete with real-time step-order badges and room-lock/trap state indicators.
  2. **Multi-Layer CSS Grid Tensor Renderer**: Renders Candidate 1 (`3-SAT-Dungeon`) 2D reduction gadget matrices and Candidate 3 (`ML-Numberlink`) $L = 2$ stacked 2D grids ($W \times H \times 2$) with inter-layer Portal cells $P$ and Mandatory Clause Checkpoints $M$.

### Deterministic Frontend State Machine
The client-side engine maintains an immutable state tuple:
$$\Sigma = \bigl(v_{\text{curr}},\; A \subseteq \mathcal{S},\; \texttt{visited}[1\dots |V|],\; \texttt{trapped}[1\dots |V|],\; \texttt{occ}[1\dots W][1\dots H][1\dots 2]\bigr)$$
- **Corridor Switches & Portcullis Locks (`3-SAT-Dungeon`)**: Selecting corridor $u_i^T$ or $u_i^F$ updates the active switch set $A \leftarrow A \cup \{s_i\}$ or $\{\bar{s}_i\}$ and engages the one-way portcullis lock at junction $r_{i+1}$.
- **Room Locking & Trap Propagation (`Trap-Path`)**: Stepping into room $v_j$ marks `visited[v_j] = true` (permanently locking the room on exit) and iterates over outgoing directed trap edges $(v_j, w) \in D$ to mark `trapped[w] = v_j`.

---

## 2. Algorithmic Solver & Client-Side Verifier Pipeline

All verifiers execute deterministically on the client in polynomial time to provide sub-millisecond player feedback (`ACCEPT / VICTORY`, `INVALID CORRIDOR MOVE`, `ROOM LOCKED`, or `TRAP TRIGGERED`):

1. **Theorem 1 Verifier (`verifySolution` — `3-SAT-Dungeon`)**:
   - Verifies path connectivity $(v_k, v_{k+1}) \in E$ from $s = r_1$ to $t = c_m$, accumulates activated corridor switches $A \subseteq \mathcal{S}$, and verifies $A \cap \tau(c_j) \neq \emptyset$ for every sequential clause trap room $c_j$.
   - **Time Complexity**: $O(|V| + |E|) = O(n + m)$, where $|V| = 3n + 1 + m$ and $|E| = 4n + m$.
2. **Theorem 2 Verifier (`verifyTrapPath` — `Trap-Path`)**:
   - Checks $|\pi| = |V|$, verifies adjacency $(\pi_j, \pi_{j+1}) \in E$, enforces single-visit room locks via `visited[v]`, and executes the **Sequential Trap Marking Procedure**: at step $j$, checks `trapped[\pi_j] == false` before setting `trapped[w] = true` for all $(\pi_j, w) \in D$.
   - **Time Complexity**: $O(|V| + |D|)$ deterministic time.
3. **Theorem 3 Verifier (`verifyMLNumberlink` — `ML-Numberlink`)**:
   - Allocates a 3D occupancy tensor `occ[x][y][z]` over $W \times H \times 2$, checks 6-connected adjacency (4-connected planar moves + vertical Portal transitions $p \in P$), enforces vertex disjointness, and checks mandatory checkpoint coverage $M \subseteq \bigcup_{r=1}^k P_r$.
   - **Time Complexity**: $O(W \cdot H \cdot L)$ deterministic time.
4. **Client-Side Backtracking SAT Oracle (`findSatisfyingAssignments`)**:
   - When the player requests an **Oracle Witness**, a backtracking DPLL/SAT solver searches the $2^n$ boolean assignment tree with early clause pruning and synthesizes the corresponding winning path $\pi$ across all three candidate puzzles.

---

## 3. Instance Generation & Dynamic Compilation Pipeline

The platform combines two level generation pipelines:
1. **Hand-Crafted Pedagogical Levels**: Curated instances (*Vault of Echoes*, *3-SAT Diamond Chain*, and the unsatisfiable *Deadlock Triangle*) designed to isolate specific topological trap constraints.
2. **Dynamic Polynomial-Time 3-SAT Compiler ($O(n + m)$)**:
   - Any arbitrary 3-CNF formula $\phi$ edited by the user in Tab 1 is dynamically compiled on the client into:
     - A **`3-SAT-Dungeon`** DAG and 2D gadget matrix (`buildGridFromSat`),
     - A playable **`Trap-Path`** level (`compile3SatToTrapDungeon`) with variable diamond corridors $(T_i, F_i)$, clause rooms $C_j$, and directed trap triggers $(F_i, C_j) \in D$, and
     - A playable **`ML-Numberlink`** $L=2$ board (`buildMLNumberlinkFromSat`) with portals $P$ and mandatory clause cells $M$.

---

## 4. Zero-Knowledge Proof (ZKP) Interactive Demo Mechanics

Implemented in **Tab 4 (Zero-Knowledge Studio)** and documented in **Tab 5 (Web Platform & Pipeline)**:
- **4-Phase Interactive State Machine**:
  1. **Commitment Phase**: Prover samples a fresh secret vertex permutation $\sigma \in S_n$ (or color permutation $\psi \in S_k$) and locks SHA-256 commitments $\text{Com}(G'), \text{Com}(T'), \text{Com}(\pi')$.
  2. **Random Verifier Challenge**: Supports both **Player (Prover) vs. Automated Verifier Bot** (cryptographic coin flip) and **Two-Player Interactive Mode** (human Verifier manually selecting challenges), plus an **Honest vs. Cheating Prover** toggle.
  3. **Opening Phase**: Prover unblinds only the challenged commitment ($b=0$ isomorphism $\sigma$ vs. $b=1$ permuted path $\pi'$).
  4. **Verification & Soundness Decay**: Client-side verifier audits the opened commitment and updates cumulative soundness error:
     - **Protocol A (Blum `Trap-Path`)**: $\epsilon^k = \left(\frac{1}{2}\right)^k$ ($9.54 \times 10^{-7}$ after $k = 20$ rounds).
     - **Protocol B2 (`ML-Numberlink` 3-Way Color Audit)**: $\epsilon^k = \left(\frac{2}{3}\right)^k$ for 1-of-3 opening (catch probability $1/3$), or $\left(\frac{1}{3}\right)^k$ for paired sub-audit opening.
     - **Protocol B1 (`3-SAT-Dungeon` XOR Cut-and-Choose)**: $\epsilon^k = \left(1 - \frac{1}{n+m}\right)^k$.

---

## Running & Building Locally

```bash
npm install
npm run dev      # Start local Vite dev server
npm run build    # Type-check (tsc -b) and build production PWA bundle
```
