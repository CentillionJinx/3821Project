# COMP3821 Project Proposal 2026

**Group:** Ryan Zhou, Emmett Shang, Louise Liu, Edward Dsouza, Gururam Subramanian
**Mentor:** Amit Bhomwick

> **Reading guide:** Text outside blockquotes is the original proposal. Blockquotes marked **Additional information** are added explanations, definitions and suggestions that are *not* part of the submitted PDF.

---

## 1. Topic and objective

**Purpose:** We want to do a creative/educational project. We will study how NP-completeness proofs are constructed, and use that to design an original grid-based puzzle (our target problem $X$), prove that its decision version is NP-complete, and showcase it interactively. "Interactive" here means that there will be a visualisation of the problem (given some problem parameters) that provides a method for a human to input an attempted solution, which the program then checks.

**Intended audience:** Students, General Public

**Why does it interest our group:** We believe the mix of creative design and learning about algorithms is intriguing. Also, since there is an interactive aspect, we believe it will be enjoyable to work on.

**Why it is a worthwhile project:** As an educational tool, the interactive aspect would make it more accessible for public audiences, and therefore bring more attention to this interesting topic. We think it will be useful to study NP and NP-complete as many real-world problems (scheduling, routing, packing) are NP-complete, so no polynomial-time algorithm for them is known and it is widely believed that none exists (whether P = NP is still open). Knowledge of these problems and of reduction methods between them helps us recognise hard problems and transfer algorithmic ideas, for example solving a new problem by encoding it for an existing SAT solver.

> **Additional information: key definitions**
>
> | Term | Meaning |
> |---|---|
> | **P** | Decision problems solvable in polynomial time. |
> | **NP** | Decision problems where a "yes" answer has a certificate that can be checked in polynomial time (equivalently, solvable in polynomial time by a nondeterministic machine). |
> | **NP-hard** | At least as hard as every problem in NP: every NP problem reduces to it in polynomial time. |
> | **NP-complete** | In NP *and* NP-hard. |
> | **Decision version** | The yes/no form of a puzzle, e.g. "does this grid have a valid solution?" rather than "find a solution". |
>
> **Why the decision version matters:** NP-completeness is defined for yes/no problems. A puzzle's "find the solution" task is then called NP-hard (or FNP-complete in its function form), and the decision question is what gets formally proved NP-complete.

---

## 2. Initial background and understanding

### Relevant sources, algorithms, or existing work and how they inform our direction

- **Wikipedia: List of NP-complete Problems** (Wikipedia Contributors, 2019). We will use this to gain a basic understanding about NP-complete problems.
- **NP complete puzzles** (Kendall et al., 2008). We will use this to analyse how various logic puzzles can be classified as NP-complete.
- **Cornell: Zero Knowledge Proofs** (Rafael Pass & Eleanor Birrell, 2009). We will use this to learn how zero knowledge proofs work, and how to develop our own.
- **Downey: NP Problem Reductions** (Downey, 2019). We will use this to learn how to reduce an existing NP problem so that we can create our own custom one.

### Explanation that demonstrates initial engagement

**Idea:** Our goal is to design an original problem $X$ that is NP-complete. We will leverage a known NP-complete problem $Y$ and construct a polynomial-time map $f$ from instances of $Y$ to instances of $X$ such that $I$ is a yes-instance of $Y$ if and only if $f(I)$ is a yes-instance of $X$. Both directions of this equivalence must be proved, and $f$ must run in polynomial time (so $|f(I)|$ is polynomial in $|I|$). Separately we show $X \in \mathsf{NP}$ via a verifier.

> **Additional information: the standard recipe for proving $X$ is NP-complete**
>
> 1. **Show $X \in \mathsf{NP}$.** Define a certificate (e.g. a filled-in grid) and give a polynomial-time verifier that checks all puzzle rules.
> 2. **Pick a known NP-complete problem $Y$** (3-SAT is the usual choice for puzzles because clauses and variables map naturally onto gadgets).
> 3. **Define a polynomial-time reduction $f$** from instances of $Y$ to instances of $X$.
> 4. **Forward direction ($\Rightarrow$):** if $I$ is a yes-instance of $Y$, show $f(I)$ is a yes-instance of $X$ (build the puzzle solution from the satisfying assignment).
> 5. **Backward direction ($\Leftarrow$):** if $f(I)$ is a yes-instance of $X$, show $I$ is a yes-instance of $Y$ (extract a satisfying assignment from any puzzle solution). This is the direction people most often get wrong, because it must work for *every* solution of the puzzle, not just the one you intended.
> 6. **Argue $f$ runs in polynomial time**, which also bounds the size of the produced grid.
>
> Together, steps 3 to 6 show $Y \le_p X$, and since $Y$ is NP-hard, so is $X$.

### Worked example: 3-SAT $\le_p$ Independent Set

(Kleinberg and Tardos, 2005). Given a 3-CNF formula $\varphi$ with $k$ clauses, build a graph $G$ with one triangle per clause (one vertex per literal in that clause), and add an edge between every vertex labelled $x$ and every vertex labelled $\neg x$. Then $\varphi$ is satisfiable iff $G$ has an independent set of size $k$: a satisfying assignment lets us pick one true literal per clause (no conflicts), and conversely an independent set of size $k$ has exactly one vertex per triangle, with no contradictory literals, so setting those literals true satisfies $\varphi$. Our puzzle will replace Independent Set by a visual puzzle whose gadgets play the role of the triangles and conflict edges.

> **Additional information: a tiny concrete instance**
>
> Let $\varphi = (x \lor y \lor z) \land (\neg x \lor \neg y \lor z)$, so $k = 2$.
>
> - Triangle 1 has vertices $x_1, y_1, z_1$. Triangle 2 has vertices $\bar{x}_2, \bar{y}_2, z_2$.
> - Conflict edges: $x_1 - \bar{x}_2$ and $y_1 - \bar{y}_2$.
> - An independent set of size 2 is, for example, $\{z_1, z_2\}$, which corresponds to setting $z = \text{true}$. Check: both clauses are satisfied.
> - Another is $\{x_1, \bar{y}_2\}$, giving $x = \text{true}, y = \text{false}$.
>
> **Why the triangles work:** an independent set can contain at most one vertex from each triangle, so size $k$ forces exactly one per clause. **Why the conflict edges work:** they forbid choosing both $x$ and $\neg x$.
>
> **Size check:** $G$ has $3k$ vertices and at most $3k + (\text{conflict pairs})$ edges, so the reduction is clearly polynomial. This is the same kind of size accounting the group will need for the puzzle grid.

### Figure 1: 3-SAT reduced to 3-colouring (Cheng, 2017)

*The figure (titled "Vertex 3-Coloring", attributed to Garey, Johnson, Stockmeyer 1976) shows three labelled components: a **variable gadget** (two linked vertices for $x_i$ and $\bar{x}_i$), a **clause gadget** (a small subgraph connecting the three literal vertices of a clause), and a **colours gadget** (a triangle fixing the three available colours).*

> **Additional information: how to read Figure 1**
>
> - **Colours gadget:** a triangle whose three vertices are forced to use three different colours. Name them **T**, **F** and **B** (true, false, base). Every other gadget connects to this triangle to fix what the colours mean.
> - **Variable gadget:** vertices $x_i$ and $\bar{x}_i$ are adjacent to each other and both adjacent to **B**, so one must be coloured T and the other F. That encodes a truth assignment.
> - **Clause gadget:** an OR-gadget whose output vertex can be coloured T exactly when at least one input literal is coloured T. If all three inputs are F, no valid colouring of the gadget exists.
> - **Takeaway for the project:** the same pattern (a "choice" gadget, a "check" gadget and a "wiring" mechanism) is what a grid puzzle reduction needs, just drawn with cells and rules instead of vertices and edges.

### Established results vs. what we will investigate

**Established:** the Cook-Levin theorem (3-SAT is NP-complete), the reduction 3-SAT $\le_p$ Independent Set, and the zero-knowledge protocol for 3-colouring.

**To investigate:** whether our own puzzle $X$ is in NP and NP-hard (our claim, to be proved), the gadget design, and whether our reduction keeps instance sizes small enough to animate.

### What we will still need to learn

In order to complete our project, we still need to learn more about the following topics:

- How to turn an NP-complete problem into an interactive app
- How gadget-based reductions for puzzles are designed, and how to prove both directions of the correspondence rigorously. This will allow us to create our own custom NP-complete problem.
- The formal definition of a zero-knowledge proof (completeness, soundness, zero-knowledge via simulators) and commitment schemes, if we attempt that extension.

> **Additional information: pointers for each learning item**
>
> - **Interactive app:** a typical architecture is a grid renderer (HTML canvas or SVG), a click/keyboard input layer that edits a candidate solution, and a pure function `verify(instance, candidate) -> {ok, violations[]}` that mirrors the NP verifier. Returning *which* rules are violated, and highlighting them, is what makes the tool educational.
> - **Gadget-based reductions:** the classic reference set is the survey by Kendall et al. (already cited). Well-known NP-complete puzzles to study for gadget style include Sudoku, Minesweeper (consistency), Nonograms, Slitherlink, Light Up (Akari) and Numberlink.
> - **Zero-knowledge:** the three properties are
>   - **Completeness:** an honest prover with a valid solution always convinces the verifier.
>   - **Soundness:** a cheating prover without a solution is caught with high probability.
>   - **Zero-knowledge:** the verifier learns nothing beyond "a solution exists", formalised by showing a *simulator* can produce transcripts indistinguishable from real ones without knowing the solution.
>
>   **Commitment schemes** let the prover lock in a value (hiding) that cannot later be changed (binding), and are the building block for the 3-colouring protocol.

---

## 3. Format, scope, and intended outcomes

**Format(s):** The formats for our project will include:

- Final report
- Poster
- An interactive NP-complete problem: likely a web application, but possibly a native application.

**Core:** Research NP-complete problems and design an NP-complete problem, with proof. Design an interactive verifier for our designed problem.

**Extensions:**

- A visualisation of the proof, where we take a small instance of the NP-complete problem we reduce from and the application builds the corresponding instance of our designed NP-complete problem.
- Design and showcase a zero-knowledge proof protocol to verify a solution for our designed problem.
- Design and showcase a heuristic or approximation algorithm for the designed NP-complete problem, or a constrained version.

> **Additional information: how the extensions relate**
>
> | Extension | What it demonstrates | Main difficulty |
> |---|---|---|
> | Proof visualisation | The reduction $f$ as an animation: enter a small 3-SAT formula, watch the puzzle grid get built gadget by gadget. | Keeping $|f(I)|$ small enough to display. Also needs a correct implementation of $f$. |
> | Zero-knowledge protocol | Convincing someone a puzzle is solvable without revealing the solution. | Needs a solved instance, a commitment scheme, and a protocol with proven soundness. A common route is to chain the puzzle to 3-colouring or 3-SAT through the reduction. |
> | Heuristic or approximation | That "hard in the worst case" does not mean "hopeless in practice". | Choosing a fair evaluation. Note that *approximation* guarantees apply to optimisation versions, while a pure decision puzzle usually gets heuristics or SAT-solver encodings. |
>
> **Sketch of the 3-colouring ZK protocol** (for reference when scoping that extension): in each round the prover randomly permutes the three colours, commits to every vertex's colour, the verifier picks one edge, the prover opens the two committed endpoints, and the verifier checks they differ. A cheating prover is caught in each round with probability at least $1/|E|$, so repeating the round $\Theta(|E|)$ times drives soundness error down exponentially.

---

## 4. Proposed approaches and evaluations

**Design activities:** Research NP-complete problems and their proofs. This can be for games, graph problems, or whatever else may be useful for gaining ideas for our designed problem.

**Uncertainties:** We are unfamiliar with NP-completeness and zero-knowledge proofs. Also, we expect the task of designing an NP-complete problem to be quite difficult, though this depends on how we want to design it. We could make it more or less creative, by applying simpler or more complex transformations from an existing NP-complete problem.

Additionally, if we want to do a zero-knowledge proof demonstration (an extension of our core goal), we would need to make and solve instances of our designed problem, which could be difficult (again depending on what we create).

If we struggle to design our own problem, we can take a known NP or NP-complete problem and focus on an educational interactive zero-knowledge proof of that known problem (instead of focusing on NP-completeness proofs).

> **Additional information: risk table and a fallback ladder**
>
> | Risk | Likelihood | Mitigation |
> |---|---|---|
> | Backward direction of the reduction has a gap (a solution that does not decode to an assignment). | High | Write the decoding argument early, and test it by brute force: enumerate all solutions of small generated grids and check each decodes to a satisfying assignment. |
> | Gadget grid blows up in size. | Medium | Track grid dimensions as a function of $n$ variables and $m$ clauses from the first design draft. Aim for $O(n + m)$ or $O((n+m)^2)$ cells. |
> | Puzzle accidentally becomes easy (in P) through over-constraint. | Medium | Keep a general variant where clause size, grid shape and clue types are not restricted, then constrain only as far as the proof still holds. |
> | Time runs out before the app is finished. | Medium | Build the verifier first (it is also the NP-membership proof), then rendering, then the visualisation of the reduction. |
>
> **Fallback ladder (from most to least ambitious):**
> 1. Original puzzle with a full NP-completeness proof, plus extensions.
> 2. Constrained variant of an existing puzzle with a rigorous proof (Mentor Question 1 asks about this).
> 3. Known NP-complete puzzle with an interactive verifier and a zero-knowledge demonstration (the fallback the proposal states).
>
> **Idea-starter directions for the original puzzle** (suggestions only, none are claimed in the proposal): a "choose one per region" rule encodes clause satisfaction; a "no two adjacent" or "line may not cross" rule encodes conflicts between $x$ and $\neg x$; wires can be modelled as corridors that propagate a binary state along the grid.

---

## 5. Plan and collaboration

### Table 1: Project progression plan

| Week | Tasks |
|---|---|
| Week 4 | Begin working on the report |
| Week 5 | Continue working on the report |
| Week 6 | Complete report |
| Week 7 | Begin working on the app + Progression Review |
| Week 8 | Complete the app + begin working on poster |
| Week 9 | Complete the poster + final revision of report |
| Week 10 | Submit project |

### Task Allocation

| | Report | Interactive Application | Poster |
|---|---|---|---|
| **Research & Draft** | All | | |
| **Visual Design** | | Edward, Louise, Guru | Guru |
| **Prototype Report** | All | | |
| **Development** | | Emmett, Edward, Louise | |
| **Writing** | | | All |
| **Proofreading** | Ryan | | |
| **Testing** | | Ryan | |
| **Review** | | | Edward |
| **Formatting** | Edward | | |

> **Additional information: observations on the plan**
>
> - The report is finished in Week 6 but the puzzle design (the creative core) feeds both the report and the app. Settling the puzzle rules and gadget construction by roughly Week 5 would let app development start with a stable specification.
> - The verifier can be prototyped before the report is complete, since it follows directly from the NP-membership argument.
> - Ryan carries proofreading and testing alone. Testing the reduction against brute force (see the risk table) is a natural way to share that load.

### Questions for Mentor

1. Is adapting an existing puzzle or game into a constrained variant sufficient for the creative problem design aspect, provided the NP-membership and reduction proofs are rigorous?
2. Would you prefer depth on the reduction visualisation over implementing a zero-knowledge or approximation extension?
3. Is an explicit gadget construction with complete bidirectional correctness arguments sufficient, or do you expect automated instance verification as supplementary evidence?

> **Additional information: context for the questions**
>
> - **Question 3** refers to automated checking such as exhaustively solving every small puzzle produced by the reduction and comparing against a SAT solver's verdict on the source formula. This is evidence, not proof, but it is strong at catching gadget bugs.

---

## 6. Group discussion: report to-do list

*Source: group conversation (not part of the submitted PDF), reproduced as written.*

**To do by next Saturday:**

**Section title: "Algorithmic Connection"**

1. Explain what NP-complete problems are
2. Examples of famous NP-complete problems
3. Current solutions for NP-complete problems (exponential solutions)
4. **(!much work!)** How to reduce NP problems into other problems (explain techniques)
5. **(!much work!)** Explain how we will use all this knowledge to create our own algorithmic problem

> **Additional information: how this list maps onto the proposal**
>
> | Item | Related proposal content | Suggested contents |
> |---|---|---|
> | 1. What NP-complete problems are | Section 1 (why it is worthwhile), Section 2 (P, NP, NP-hard definitions above) | Definitions of P, NP, NP-hard and NP-complete. The certificate and verifier idea. The Cook-Levin theorem as the starting point. The open P vs NP question. |
> | 2. Famous examples | Sources: Wikipedia list, Kendall et al. survey | SAT and 3-SAT, Independent Set, Clique, Vertex Cover, Hamiltonian Cycle, Travelling Salesman (decision version), 3-Colouring, Subset Sum, Knapsack (decision version). Include a short real-world motivation for each (scheduling, routing, packing). Add NP-complete puzzles (for example Sudoku, Minesweeper consistency, Nonograms) since they bridge to the project. |
> | 3. Current (exponential) solutions | Section 1 (SAT solver encoding idea), Extension 3 (heuristics) | Brute force over all candidates, $O(2^n)$. Backtracking and branch and bound. Dynamic programming such as Held-Karp for TSP, $O(n^2 2^n)$. Meet in the middle for Subset Sum, about $O(2^{n/2})$. Modern SAT solvers (DPLL and CDCL) that handle huge practical instances despite worst-case hardness. A brief note on heuristics and approximation, linking to Extension 3. |
> | 4. Reduction techniques | Section 2 (recipe, worked example, Figure 1), Downey and Kleinberg-Tardos sources | The general method (show membership in NP, pick a known NP-complete problem, build a polynomial-time map, prove both directions). The common techniques: equivalence by restating one problem as another, special case to general case, and gadget construction. Worked examples: 3-SAT to Independent Set and 3-SAT to 3-Colouring (Figure 1). A chain such as SAT to 3-SAT to Independent Set to Vertex Cover shows how reductions compose. |
> | 5. Our own problem | Section 3 (Core), Section 4 (design activities, fallback ladder) | State the chosen source problem and the intended gadgets (choice, check, wiring). Give the puzzle rules and the verifier. Outline the reduction and the proof obligations (membership, forward direction, backward direction, polynomial size). Say how the interactive app and the proof visualisation demonstrate it. |
>
> **Planning notes**
> - Items 1 to 3 are mostly survey writing and can be drafted in parallel by different members. Items 4 and 5 are marked as heavy because they carry the technical content, and item 5 depends on the puzzle design being at least roughly settled. Splitting item 4 (techniques and worked examples) from item 5 (our construction) between different people, with a shared agreed source problem, would keep both moving.
> - Item 5 is the section most affected by the open mentor questions (Section 5), so it may be worth drafting a version that holds up under either answer.
> - This list covers the "Algorithmic Connection" section only. The report plan in Table 1 begins in Week 4, so the list fits the research and draft stage where all members contribute.

---

## References

1. Cheng, Y. (2017, December 5). *Fun with reductions* [Guest lecture]. https://courses.cs.duke.edu/fall17/compsci330/lecture24.pdf
2. Downey, T. (2019). *NP problem reduction notes*. downey.io. https://downey.io/notes/omscs/cs6515/np-reduction-steps/
3. Kendall, G., Parkes, A., & Spoerer, K. (2008). A survey of NP-complete puzzles. *ICGA Journal, 31*(1), 13-34. https://doi.org/10.3233/icg-2008-31103
4. Kleinberg, J., & Tardos, E. (2005). *Algorithm Design*. Addison-Wesley. https://theswissbay.ch/pdf/Gentoomen%20Library/Algorithms/Algorithm%20Design%20-%20John%20Kleinberg%20-%20%C3%89va%20Tardos.pdf
5. Pass, R., & Birrell, E. (2009, October 27). *Zero knowledge for NP* (Lecture 17, COM S 6830) [Lecture notes]. https://www.cs.cornell.edu/courses/cs6830/2009fa/scribes/lecture17.pdf
6. Wikipedia contributors. (2019, December 17). List of NP-complete problems. *Wikipedia*. https://en.wikipedia.org/wiki/List_of_NP-complete_problems

> **Additional information: glossary**
>
> | Term | Plain-language meaning |
> |---|---|
> | **Gadget** | A small reusable piece of the target problem that simulates one element of the source problem (a variable, a clause, a wire). |
> | **Certificate / witness** | The proposed solution that a verifier checks. |
> | **Verifier** | A polynomial-time algorithm taking an instance and certificate and answering accept or reject. |
> | **Polynomial-time reduction ($\le_p$)** | A polynomial-time map between instances that preserves yes/no answers. |
> | **3-CNF / 3-SAT** | A formula that is an AND of clauses, each an OR of exactly three literals, and the question of whether it is satisfiable. |
> | **Independent set** | A set of graph vertices with no two adjacent. |
> | **Simulator** | In ZK proofs, an algorithm that fakes a transcript without knowing the secret, used to show the real transcript leaks nothing. |
