/// <reference lib="dom" />
import {
  Cam,
  clamp,
  disposer,
  facing,
  fillet,
  fit,
  flatDot,
  hull,
  mk,
  open,
  place,
  pointer,
  poly,
  prism,
  proj,
  put,
  rad,
  reflect,
  register,
  ringAt,
  rings,
  rrect,
  run,
  seg,
  solid,
  spring,
  stepS,
  tdone,
  tset,
  tval,
  tween,
  unproj,
  type HairlineFigureSpec,
  type RingSample,
  type SolidGroup,
  type SpringState,
  type TweenState,
  type Vec2,
} from './hairlineEngine.ts';

// ---------------------------------------------------------------------------
// 1. PARITY-PLINTH: 4x4 binary tiles around 3x3 interior corner junction posts
// ---------------------------------------------------------------------------
const PLINTH_N = 4;
const PLINTH_SP = 34;
const PLINTH_KEY = 23;
const PLINTH_POST = 9;
const PLINTH_EXT = PLINTH_N * PLINTH_SP;
const PLINTH_HMAX = 42;
const PLINTH_PB = 6;
const PLINTH_REST_BITS = [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0];

const plinthFalloff = (u: number): number =>
  u <= 0
    ? 1
    : u <= 0.42
      ? 1 - (u / 0.42) * 0.68
      : u <= 1
        ? 0.32 - ((u - 0.42) / 0.58) * 0.22
        : 0.1;

function plinthCornerDot(ci: number, cj: number, k: number): boolean {
  const a = PLINTH_REST_BITS[cj * PLINTH_N + ci];
  const b = PLINTH_REST_BITS[cj * PLINTH_N + ci + 1];
  const c = PLINTH_REST_BITS[(cj + 1) * PLINTH_N + ci + 1];
  const d = PLINTH_REST_BITS[(cj + 1) * PLINTH_N + ci];
  return [a ^ b, b ^ c, c ^ d, d ^ a][k] === 1;
}

export const PARITY_PLINTH_FIGURE: HairlineFigureSpec = {
  name: 'parity-plinth',
  title: 'Parity Plinth · 3D χ(r,c) Heightfield & Corner τ(a,b,c,d)',
  means: 'Tile elevation encodes χ(r,c) ∈ {0,1}; corner posts count 2×2 boundary cliffs τ(a,b,c,d) ∈ {0,2,4}.',
  rules: [1, 3, 4, 5, 9],
  range: [1.2, 2.2, 3.6],
  rangeLabel: 'reach (cells)',
  tour: [[154, 150], [202, 168], [248, 152], null],
  mount({ stage, svg, read, onPick }, value) {
    const bag = disposer();
    const C = Cam(45, 0.5, 1.48);
    fit(
      C,
      [
        [-9, -9, -PLINTH_PB],
        [PLINTH_EXT + 9, PLINTH_EXT + 9, -PLINTH_PB],
        [PLINTH_EXT + 9, -9, -PLINTH_PB],
        [-9, PLINTH_EXT + 9, -PLINTH_PB],
        [0, 0, PLINTH_HMAX + 6],
      ],
      200,
      170,
    );
    const P = proj(C);
    const front = facing(C);
    let radius = value * PLINTH_SP;
    let over: Vec2 | null = null;

    const g = mk('g', {}, svg);
    const [pr, pi] = rings(-9, -9, PLINTH_EXT + 9, PLINTH_EXT + 9, 8, 2.0);
    put(solid(g), prism(P, front, pr, pi, -PLINTH_PB, 0));

    interface PlinthTile {
      kind: 'tile';
      bit: number;
      i: number;
      j: number;
      cx: number;
      cy: number;
      h0: number;
      ring: RingSample[];
      inner: RingSample[];
      sp: SpringState;
      drawn: number;
      el: SolidGroup;
      dot: SVGEllipseElement;
    }

    interface PlinthPost {
      kind: 'post';
      ci: number;
      cj: number;
      cx: number;
      cy: number;
      h0: number;
      ring: RingSample[];
      inner: RingSample[];
      sp: SpringState;
      drawn: number;
      el: SolidGroup;
      dots: SVGEllipseElement[];
    }

    type PlinthItem = PlinthTile | PlinthPost;
    const rawItems: Array<Omit<PlinthTile, 'el' | 'dot'> | Omit<PlinthPost, 'el' | 'dots'>> = [];

    for (let i = 0; i < PLINTH_N; i++) {
      for (let j = 0; j < PLINTH_N; j++) {
        const bit = PLINTH_REST_BITS[j * PLINTH_N + i];
        const cx = (i + 0.5) * PLINTH_SP;
        const cy = (j + 0.5) * PLINTH_SP;
        const dCenter = Math.hypot(cx - 0.5 * PLINTH_EXT, cy - 0.5 * PLINTH_EXT) / PLINTH_EXT;
        const h0 = (bit ? 13 : 5) + 8 * Math.exp(-dCenter * dCenter * 5);
        const [ring, inner] = rings(
          cx - PLINTH_KEY / 2,
          cy - PLINTH_KEY / 2,
          cx + PLINTH_KEY / 2,
          cy + PLINTH_KEY / 2,
          3.2,
          1.0,
        );
        rawItems.push({
          kind: 'tile',
          bit,
          i,
          j,
          cx,
          cy,
          h0,
          ring,
          inner,
          sp: spring(h0, { eps: 0.04 }),
          drawn: NaN,
        });
      }
    }

    for (let ci = 0; ci < PLINTH_N - 1; ci++) {
      for (let cj = 0; cj < PLINTH_N - 1; cj++) {
        const cx = (ci + 1) * PLINTH_SP;
        const cy = (cj + 1) * PLINTH_SP;
        const h0 = ci === 1 && cj === 1 ? 26 : 9 + ((ci + cj) % 2) * 3;
        const [ring, inner] = rings(
          cx - PLINTH_POST / 2,
          cy - PLINTH_POST / 2,
          cx + PLINTH_POST / 2,
          cy + PLINTH_POST / 2,
          2.2,
          0.7,
        );
        rawItems.push({
          kind: 'post',
          ci,
          cj,
          cx,
          cy,
          h0,
          ring,
          inner,
          sp: spring(h0, { eps: 0.04 }),
          drawn: NaN,
        });
      }
    }

    rawItems.sort((a, b) => a.cx + a.cy - (b.cx + b.cy));

    const items: PlinthItem[] = [];
    const posts: PlinthPost[] = [];
    for (const raw of rawItems) {
      const el = solid(g);
      if (raw.kind === 'tile') {
        const dot = flatDot(el.g, C, 1.4, raw.bit ? 'dot m' : 'dot off');
        items.push({ ...raw, el, dot });
      } else {
        const dots = [0, 1, 2, 3].map((k) =>
          flatDot(el.g, C, 0.72, plinthCornerDot(raw.ci, raw.cj, k) ? 'dot m' : 'dot off'),
        );
        const post: PlinthPost = { ...raw, el, dots };
        items.push(post);
        posts.push(post);
      }
    }

    const restPost = posts.find((p) => p.ci === 1 && p.cj === 1) ?? posts[0];
    let active: PlinthPost | null = null;

    function drawItem(it: PlinthItem) {
      const h = Math.max(0.8, it.sp.x);
      const isHi = it === (active ?? restPost);
      if (h !== it.drawn) {
        it.drawn = h;
        put(it.el, prism(P, front, it.ring, it.inner, 0, h));
        if (it.kind === 'tile') {
          place(it.dot, P(it.cx, it.cy, h));
        } else {
          it.dots.forEach((d, k) =>
            place(
              d,
              P(it.cx + ((k % 2) - 0.5) * 3.4, it.cy + (Math.floor(k / 2) - 0.5) * 3.4, h),
            ),
          );
        }
      }
      if (it.kind === 'post') {
        it.el.sil.classList.toggle('hi', isHi);
        it.dots.forEach((d, k) => {
          const on = plinthCornerDot(it.ci, it.cj, k);
          d.setAttribute('class', isHi && on ? 'dot' : on ? 'dot m' : 'dot off');
        });
      }
    }

    const loop = register(stage, (dt) => {
      let moving = false;
      for (const it of items) {
        if (stepS(it.sp, dt)) moving = true;
        drawItem(it);
      }
      return moving;
    });
    bag.add(loop.unregister);

    function retarget(): number {
      if (!over) {
        active = null;
        for (const it of items) it.sp.t = it.h0;
        read.textContent = 'rest';
        loop.wake();
        return -1;
      }
      const ci = clamp(Math.round(over[0] / PLINTH_SP) - 1, 0, PLINTH_N - 2);
      const cj = clamp(Math.round(over[1] / PLINTH_SP) - 1, 0, PLINTH_N - 2);
      active = posts.find((p) => p.ci === ci && p.cj === cj) ?? restPost;
      for (const it of items) {
        const d = Math.hypot(it.cx - active.cx, it.cy - active.cy);
        const base = it.kind === 'post' ? PLINTH_HMAX : PLINTH_HMAX - 7;
        it.sp.t = Math.max(3, base * plinthFalloff(d / radius));
      }
      read.textContent = `node ${ci + 1}·${cj + 1}`;
      loop.wake();
      return cj * (PLINTH_N - 1) + ci;
    }

    bag.add(
      pointer(stage, {
        move: (p) => {
          over = unproj(C, p[0], p[1], 0);
          retarget();
        },
        down: (p) => {
          over = unproj(C, p[0], p[1], 0);
          const idx = retarget();
          if (idx >= 0) onPick?.(idx);
        },
        leave: () => {
          over = null;
          retarget();
        },
      }),
    );
    bag.add(() => svg.replaceChildren());

    return {
      set: (v: number) => {
        radius = v * PLINTH_SP;
        if (over) retarget();
      },
      destroy: bag.dispose,
    };
  },
};

// ---------------------------------------------------------------------------
// 2. WITNESS-CALIPER: 8-register linear verifier bed + sliding back carriage
// ---------------------------------------------------------------------------
const CAL_N = 8;
const CAL_SP = 19;
const CAL_W = 13;
const CAL_LEN = 34;
const CAL_EXT = CAL_N * CAL_SP;
const CAL_HMAX = 38;
const CAL_PB = 5;
const CAL_REST_H = [8, 12, 18, 11, 24, 15, 9, 13];

const caliperFalloff = (u: number): number =>
  u <= 0
    ? 1
    : u <= 0.45
      ? 1 - (u / 0.45) * 0.65
      : u <= 1
        ? 0.35 - ((u - 0.45) / 0.55) * 0.24
        : 0.11;

export const WITNESS_CALIPER_FIGURE: HairlineFigureSpec = {
  name: 'witness-caliper',
  title: 'Witness Caliper · O(|F| + |C|) Linear NP Verifier Pass',
  means: 'Eight corner registers scanned in one linear pass to verify τ(S_k) = r(S_k) in O(N·M) time.',
  rules: [1, 3, 4, 6, 8],
  range: [24, 46, 78],
  rangeLabel: 'scan width',
  tour: [[108, 136], [192, 178], [278, 220], null],
  mount({ stage, svg, read, onPick }, value) {
    const bag = disposer();
    const C = Cam(45, 0.5, 1.82);
    fit(
      C,
      [
        [-6, -20, -CAL_PB],
        [CAL_EXT + 6, CAL_LEN + 8, -CAL_PB],
        [CAL_EXT + 6, -20, -CAL_PB],
        [-6, CAL_LEN + 8, -CAL_PB],
        [CAL_EXT * 0.4, 0, CAL_HMAX + 5],
      ],
      200,
      172,
    );
    const P = proj(C);
    const front = facing(C);
    let span = value;
    let over: Vec2 | null = null;

    const g = mk('g', {}, svg);
    const [br, bi] = rings(-6, -20, CAL_EXT + 6, CAL_LEN + 8, 8, 2.0);
    reflect(svg, g, P, front, br, -CAL_PB, 10);
    put(solid(g), prism(P, front, br, bi, -CAL_PB, 0));

    // Fixed back rail in y in [-16, -7] (strictly behind all y >= 3 register bars)
    const [rr, ri] = rings(0, -16, CAL_EXT, -7, 2.5, 0.7);
    put(solid(g), prism(P, front, rr, ri, 0, 4));

    const car = solid(g);
    const carDot = flatDot(car.g, C, 1.1, 'dot m');
    const spCar = spring(4.5 * CAL_SP, { eps: 0.05 });

    interface RegBlock {
      i: number;
      cx: number;
      cy: number;
      h0: number;
      ring: RingSample[];
      inner: RingSample[];
      sp: SpringState;
      el: SolidGroup;
      dots: [SVGEllipseElement, SVGEllipseElement];
      drawn: number;
    }

    const regs: RegBlock[] = [];
    for (let i = 0; i < CAL_N; i++) {
      const cx = (i + 0.5) * CAL_SP;
      const cy = CAL_LEN / 2;
      const h0 = CAL_REST_H[i];
      const [ring, inner] = rings(cx - CAL_W / 2, 3, cx + CAL_W / 2, CAL_LEN - 3, 2.4, 0.8);
      const el = solid(g);
      const dots: [SVGEllipseElement, SVGEllipseElement] = [
        flatDot(el.g, C, 0.75, i % 2 === 0 ? 'dot m' : 'dot off'),
        flatDot(el.g, C, 0.75, i === 4 ? 'dot m' : 'dot off'),
      ];
      regs.push({
        i,
        cx,
        cy,
        h0,
        ring,
        inner,
        sp: spring(h0, { eps: 0.04 }),
        el,
        dots,
        drawn: NaN,
      });
    }

    const restFocus = regs[4];
    let active: RegBlock | null = null;
    let prevCx = NaN;

    function drawCarriage() {
      const cx = clamp(spCar.x, 8, CAL_EXT - 8);
      if (cx !== prevCx) {
        prevCx = cx;
        const [cr, ci] = rings(cx - 5.5, -17, cx + 5.5, -6, 2.0, 0.6);
        put(car, prism(P, front, cr, ci, 4, 16));
        place(carDot, P(cx, -11.5, 16));
      }
    }

    function drawReg(r: RegBlock) {
      const h = Math.max(1, r.sp.x);
      const isHi = r === (active ?? restFocus);
      if (h !== r.drawn) {
        r.drawn = h;
        put(r.el, prism(P, front, r.ring, r.inner, 0, h));
        place(r.dots[0], P(r.cx, r.cy - 6, h));
        place(r.dots[1], P(r.cx, r.cy + 6, h));
      }
      r.el.sil.classList.toggle('hi', isHi);
      r.dots[0].setAttribute('class', isHi ? 'dot' : r.i % 2 === 0 ? 'dot m' : 'dot off');
      r.dots[1].setAttribute('class', isHi ? 'dot' : 'dot off');
    }

    const loop = register(stage, (dt) => {
      let moving = false;
      if (stepS(spCar, dt)) moving = true;
      drawCarriage();
      for (const r of regs) {
        if (stepS(r.sp, dt)) moving = true;
        drawReg(r);
      }
      return moving;
    });
    bag.add(loop.unregister);

    function retarget(): number {
      if (!over) {
        active = null;
        spCar.t = restFocus.cx;
        for (const r of regs) r.sp.t = r.h0;
        read.textContent = 'rest';
        loop.wake();
        return -1;
      }
      const idx = clamp(Math.floor(over[0] / CAL_SP), 0, CAL_N - 1);
      active = regs[idx];
      spCar.t = active.cx;
      for (const r of regs) {
        const d = Math.abs(r.cx - over[0]);
        r.sp.t = Math.max(4, CAL_HMAX * caliperFalloff(d / span));
      }
      read.textContent = `reg 0${idx + 1}`;
      loop.wake();
      return idx;
    }

    bag.add(
      pointer(stage, {
        move: (p) => {
          over = unproj(C, p[0], p[1], 0);
          retarget();
        },
        down: (p) => {
          over = unproj(C, p[0], p[1], 0);
          const idx = retarget();
          if (idx >= 0) onPick?.(idx);
        },
        leave: () => {
          over = null;
          retarget();
        },
      }),
    );
    bag.add(() => svg.replaceChildren());

    return {
      set: (v: number) => {
        span = v;
        if (over) retarget();
      },
      destroy: bag.dispose,
    };
  },
};

// ---------------------------------------------------------------------------
// 3. CLAUSE-TURRET: 4 telescopic reduction gadget bays (G1..G4)
// ---------------------------------------------------------------------------
const TURRET_TAGS = ['g1 · wire', 'g2 · not', 'g3 · core', 'g4 · arch'];
const TURRET_CENTERS = [
  { x: 12, y: 114, rest: 6 },
  { x: 46, y: 80, rest: 10 },
  { x: 80, y: 46, rest: 18 },
  { x: 114, y: 12, rest: 8 },
];
const TURRET_LIFT = 24;

function chassisRing(pad: number, n: number): RingSample[] {
  const pts = fillet([[-25, 115], [115, -25], [151, 11], [11, 151]], [10, 10, 10, 10], n);
  const cx = 63;
  const cy = 63;
  return pts.map(([u, v]) => {
    const dx = u - cx;
    const dy = v - cy;
    const len = Math.hypot(dx, dy) || 1;
    const nu = dx / len;
    const nv = dy / len;
    return { u: u - nu * pad, v: v - nv * pad, nu, nv };
  });
}

function makeTurretParts(
  cx: number,
  cy: number,
  idx: number,
): Array<{ r: RingSample[]; ri: RingSample[]; z0: number; z1: number }> {
  if (idx === 0) {
    return [
      rings(cx - 11, cy - 11, cx - 2, cy + 11, 2.2, 0.7),
      rings(cx + 2, cy - 11, cx + 11, cy + 11, 2.2, 0.7),
      rings(cx - 9, cy - 5, cx + 9, cy + 5, 2.0, 0.6),
    ].map(([r, ri], k) => ({ r, ri, z0: k === 2 ? 11 : 0, z1: k === 2 ? 17 : 11 }));
  }
  if (idx === 1) {
    return [
      rings(cx - 12, cy - 11, cx - 3, cy + 11, 2.0, 0.65),
      rings(cx - 4, cy - 12, cx + 4, cy + 4, 2.0, 0.65),
      rings(cx + 3, cy - 4, cx + 12, cy + 12, 2.0, 0.65),
    ].map(([r, ri], k) => ({ r, ri, z0: 0, z1: k === 1 ? 20 : k === 2 ? 14 : 11 }));
  }
  if (idx === 2) {
    return [
      rings(cx - 12, cy - 12, cx + 12, cy + 12, 3.0, 0.8),
      rings(cx - 9, cy - 9, cx - 1, cy - 1, 1.8, 0.55),
      rings(cx - 2, cy + 1, cx + 9, cy + 10, 2.0, 0.6),
    ].map(([r, ri], k) => ({ r, ri, z0: k === 0 ? 0 : 7, z1: k === 0 ? 7 : k === 1 ? 26 : 18 }));
  }
  return [
    rings(cx - 12, cy - 11, cx - 4, cy + 11, 2.0, 0.65),
    rings(cx + 4, cy - 11, cx + 12, cy + 11, 2.0, 0.65),
    rings(cx - 12, cy - 5, cx + 12, cy + 5, 2.2, 0.7),
  ].map(([r, ri], k) => ({ r, ri, z0: k === 2 ? 13 : 0, z1: k === 2 ? 21 : 13 }));
}

export const CLAUSE_TURRET_FIGURE: HairlineFigureSpec = {
  name: 'clause-turret',
  title: 'Clause Turret · Planar 3-SAT ≤ₚ XOR-Square Gadgets (G1–G4)',
  means: 'Four reduction bays: G1 r=0 wire, G2 r=4 NOT inverter, G3 3×3 OR clause core, G4 planar routing.',
  rules: [1, 2, 4, 8, 10],
  range: [0, 45, 90],
  rangeLabel: 'stagger (ms)',
  tour: [[79, 174], [160, 174], [240, 170], [321, 174], null],
  mount({ stage, svg, read, onPick }, value) {
    const bag = disposer();
    let stag = value;
    const C = Cam(45, 0.5, 1.68);
    fit(
      C,
      [
        [-25, 115, -8],
        [115, -25, -8],
        [151, 11, -8],
        [11, 151, -8],
        [80, 46, TURRET_LIFT + 28],
        [12, 114, TURRET_LIFT + 22],
      ],
      200,
      170,
    );
    const P = proj(C);
    const front = facing(C);

    const g = mk('g', {}, svg);
    const br = chassisRing(0, 5);
    const bi = chassisRing(2.2, 5);
    reflect(svg, g, P, front, br, -8, 12);
    put(solid(g), prism(P, front, br, bi, -8, 0));

    interface TurretStation {
      idx: number;
      ctr: { x: number; y: number; rest: number };
      padR: [RingSample[], RingSample[]];
      pad: SolidGroup;
      stemR: [RingSample[], RingSample[]];
      stem: SolidGroup;
      specs: ReturnType<typeof makeTurretParts>;
      els: SolidGroup[];
      dots: SVGEllipseElement[];
      z: TweenState;
      drawn: number;
    }

    const stations: TurretStation[] = TURRET_CENTERS.map((ctr, idx) => {
      const grp = mk('g', {}, g);
      const padR = rings(ctr.x - 14, ctr.y - 14, ctr.x + 14, ctr.y + 14, 3.2, 0.8);
      const stemR = rings(ctr.x - 9, ctr.y - 9, ctr.x + 9, ctr.y + 9, 2.4, 0.7);
      const stem = solid(grp);
      const pad = solid(grp);
      const specs = makeTurretParts(ctr.x, ctr.y, idx);
      const els = specs.map(() => solid(grp));
      const dots = [0, 1, 2, 3].map((k) =>
        flatDot(grp, C, 0.85, k <= idx ? (idx === 2 ? 'dot' : 'dot m') : 'dot off'),
      );
      return {
        idx,
        ctr,
        padR,
        pad,
        stemR,
        stem,
        specs,
        els,
        dots,
        z: tween(ctr.rest),
        drawn: NaN,
      };
    });

    const hitCenters = stations.map((s) => P(s.ctr.x, s.ctr.y, 12));
    const yBand = hitCenters.map((c) => c[1]);
    const yMin = Math.min(...yBand) - 44;
    const yMax = Math.max(...yBand) + 48;
    const xMin = hitCenters[0][0] - 38;
    const xMax = hitCenters[3][0] + 38;

    function hit([sx, sy]: Vec2): number {
      if (sx < xMin || sx > xMax || sy < yMin || sy > yMax) return -1;
      let best = -1;
      let bestD = 42;
      hitCenters.forEach((c, i) => {
        const d = Math.abs(sx - c[0]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    }

    let act = -1;
    function drawStation(st: TurretStation, now: number) {
      const z = tval(st.z, now);
      const isHi = st.idx === (act < 0 ? 2 : act);
      if (z !== st.drawn) {
        st.drawn = z;
        put(st.stem, prism(P, front, st.stemR[0], st.stemR[1], 0, Math.max(2, z + 0.5)));
        put(st.pad, prism(P, front, st.padR[0], st.padR[1], z, z + 2.8));
        st.specs.forEach((sp, k) =>
          put(st.els[k], prism(P, front, sp.r, sp.ri, z + 2.5 + sp.z0, z + 2.5 + sp.z1)),
        );
        st.dots.forEach((d, k) =>
          place(d, P(st.ctr.x - 10 + k * 4.8, st.ctr.y + 11, z + 3.0)),
        );
      }
      st.els.forEach((el) => el.sil.classList.toggle('hi', isHi));
      st.pad.sil.classList.toggle('hi', isHi);
      st.dots.forEach((d, k) => {
        d.setAttribute('class', k <= st.idx ? (isHi ? 'dot' : 'dot m') : 'dot off');
      });
    }

    const loop = register(stage, (_dt, now) => {
      let moving = false;
      stations.forEach((st) => {
        drawStation(st, now);
        if (!tdone(st.z, now)) moving = true;
      });
      return moving;
    });
    bag.add(loop.unregister);

    function setActive(a: number) {
      if (a === act) return;
      const now = performance.now();
      const from = a >= 0 ? a : act;
      act = a;
      stations.forEach((st, i) => {
        const delay = Math.abs(i - from) * stag;
        tset(st.z, a < 0 ? st.ctr.rest : i === a ? TURRET_LIFT : 2.5, now, delay);
      });
      read.textContent = a < 0 ? 'rest' : TURRET_TAGS[a];
      loop.wake();
    }

    bag.add(
      pointer(stage, {
        move: (p) => setActive(hit(p)),
        down: (p) => {
          const idx = hit(p);
          setActive(idx);
          if (idx >= 0) onPick?.(idx);
        },
        leave: () => setActive(-1),
      }),
    );
    bag.add(() => svg.replaceChildren());

    return {
      set: (v: number) => {
        stag = v;
      },
      destroy: bag.dispose,
    };
  },
};

// ---------------------------------------------------------------------------
// 4. PIVOT-TRAY: 6 chronological specimen plates in a walled archival tray
// ---------------------------------------------------------------------------
const TRAY_N = 6;
const TRAY_W = 84;
const TRAY_H = 52;
const TRAY_G = 16;
const TRAY_TW = 24;
const TRAY_TH = 7;
const TRAY_TABS = [6, 30, 54];
const TRAY_TK = 1.5;
const TRAY_REST = -12;
const TRAY_BACK = -24;
const TRAY_FWD = 20;
const TRAY_LIFT = 16;
const TRAY_X0 = -5;
const TRAY_X1 = TRAY_W + 5;
const TRAY_Y0 = -9;
const TRAY_Y1 = (TRAY_N - 1) * TRAY_G + 9;
const TRAY_WH = 20;
const TRAY_WR = 6;
const TRAY_WT = 2.4;

const LR = (pts: Vec2[]): Vec2[] =>
  pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse();

export const PIVOT_TRAY_FIGURE: HairlineFigureSpec = {
  name: 'pivot-tray',
  title: 'Pivot Tray · 6-Stage Research Progression Archive (Weeks 1–10)',
  means: 'Six specimen plates tracing superseded puzzle prototypes to the final Binary XOR-Square proof.',
  rules: [1, 2, 6, 8, 10],
  range: [0, 40, 85],
  rangeLabel: 'stagger (ms)',
  tour: [[156, 136], [198, 152], [242, 168], null],
  mount({ stage, svg, read, onPick }, value) {
    const bag = disposer();
    let stag = value;
    const C = Cam(45, 0.5, 1.62);
    fit(
      C,
      [
        [TRAY_X0, TRAY_Y0, 0],
        [TRAY_X1, TRAY_Y1, -8],
        [TRAY_X1, TRAY_Y0, 0],
        [TRAY_X0, TRAY_Y1, 0],
        [TRAY_X0, TRAY_Y0, TRAY_H + TRAY_TH],
        [TRAY_X1, TRAY_Y0, TRAY_H + TRAY_TH + TRAY_LIFT],
      ],
      200,
      166,
    );
    const P = proj(C);
    const front = facing(C);
    const outer = rrect(TRAY_X0, TRAY_Y0, TRAY_X1, TRAY_Y1, TRAY_WR, 6);
    const inner = rrect(
      TRAY_X0 + TRAY_WT,
      TRAY_Y0 + TRAY_WT,
      TRAY_X1 - TRAY_WT,
      TRAY_Y1 - TRAY_WT,
      TRAY_WR - TRAY_WT,
      6,
    );

    const far: Array<[string, string]> = [
      [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, TRAY_WH)))), 'sil'],
      [poly(ringAt(P, inner, TRAY_WH)), 'nf'],
      [open(ringAt(P, run(inner, (q) => !front(q)), 2.5)), 'nf lo'],
    ];
    const iF = LR(ringAt(P, run(inner, front), TRAY_WH));
    const oT = LR(ringAt(P, run(outer, front), TRAY_WH));
    const oB = LR(ringAt(P, run(outer, front), 0));
    const hx = (TRAY_X0 + TRAY_X1) / 2;
    const onFront = (ring: RingSample[]) => ring.map((q) => P(q.u, TRAY_Y1, q.v));
    const near: Array<[string, string]> = [
      [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), 'fo'],
      [open(oT), 'nf lo'],
      [open(iF), 'nf'],
      [open([oT[0], ...oB, oT[oT.length - 1]]), 'nf sil'],
      [poly(onFront(rrect(hx - 11, 6.5, hx + 11, 12.5, 3, 5))), 'nf'],
      [poly(onFront(rrect(hx - 9.4, 8, hx + 9.4, 11, 1.5, 5))), 'nf lo'],
    ];

    const g = mk('g', {}, svg);
    reflect(svg, g, P, front, outer, 0, 14);
    for (const [d, cls] of far) mk('path', { d, class: cls }, g);

    interface PlateCard {
      n: number;
      t0: number;
      shape: Vec2[];
      back: SVGPathElement;
      face: SVGPathElement;
      head: SVGPathElement;
      rules: SVGPathElement;
      punch: SVGCircleElement[];
      a: TweenState;
      z: TweenState;
    }

    const plates: PlateCard[] = [];
    for (let i = 0; i < TRAY_N; i++) {
      const n = i + 1;
      const t0 = TRAY_TABS[i % 3];
      const shape = fillet(
        [
          [0, 0],
          [TRAY_W, 0],
          [TRAY_W, TRAY_H],
          [t0 + TRAY_TW, TRAY_H],
          [t0 + TRAY_TW, TRAY_H + TRAY_TH],
          [t0, TRAY_H + TRAY_TH],
          [t0, TRAY_H],
          [0, TRAY_H],
        ],
        [1, 1, 3.2, 1.8, 2.4, 2.4, 1.8, 3.2],
      );
      const grp = mk('g', {}, g);
      const back = mk('path', { class: 'lo' }, grp);
      const face = mk('path', { class: 'sil' }, grp);
      const head = mk('path', { class: 'nf' }, grp);
      const rulesEl = mk('path', { class: 'nf lo' }, grp);
      const punch: SVGCircleElement[] = [];
      for (let k = 0; k < 6; k++) {
        punch.push(mk('circle', { r: 1.15, class: `dot ${k === n - 1 ? 'm' : 'off'}` }, grp));
      }
      const initTh = i === TRAY_N - 1 ? -7 : TRAY_REST;
      const initLift = i === TRAY_N - 1 ? 5 : 0;
      plates.push({
        n,
        t0,
        shape,
        back,
        face,
        head,
        rules: rulesEl,
        punch,
        a: tween(initTh),
        z: tween(initLift),
      });
    }
    for (const [d, cls] of near) mk('path', { d, class: cls }, g);

    const top = (i: number): Vec2 =>
      P(TRAY_W / 2, i * TRAY_G + TRAY_H * Math.sin(rad(TRAY_REST)), TRAY_H * Math.cos(rad(TRAY_REST)));
    const c0 = top(0);
    const c1 = top(1);
    const dv: Vec2 = [c1[0] - c0[0], c1[1] - c0[1]];
    const px0 = P(0, 0, 0);
    const px1 = P(1, 0, 0);
    const ex: Vec2 = [px1[0] - px0[0], px1[1] - px0[1]];
    const HALF = TRAY_W / 2 + 6;
    const det = dv[0] * ex[1] - dv[1] * ex[0];

    function hit([x, y]: Vec2): number {
      const qx = x - c0[0];
      const qy = y - c0[1];
      const s = (qx * ex[1] - qy * ex[0]) / det;
      const r = (dv[0] * qy - dv[1] * qx) / det;
      if (Math.abs(r) > HALF || s < -0.5 || s > TRAY_N + 0.8) return -1;
      return clamp(Math.round(s), 0, TRAY_N - 1);
    }

    let act = -1;
    function draw(i: number, th: number, lift: number) {
      const cd = plates[i];
      const yb = i * TRAY_G;
      const s = Math.sin(rad(th));
      const c = Math.cos(rad(th));
      const w = (u: number, v: number): Vec2 => P(u, yb + v * s, v * c + lift);
      const wb = (u: number, v: number): Vec2 =>
        P(u, yb + v * s - TRAY_TK * c, v * c + TRAY_TK * s + lift);
      const punchPts: Vec2[] = [];
      for (let k = 0; k < 6; k++) {
        punchPts.push(
          w(
            cd.t0 + TRAY_TW / 2 + ((k % 3) - 1) * 4.4,
            TRAY_H + TRAY_TH / 2 + (0.5 - Math.floor(k / 3)) * 2.8,
          ),
        );
      }

      const isHi = i === (act < 0 ? TRAY_N - 1 : act);
      cd.back.setAttribute('d', poly(cd.shape.map((p) => wb(p[0], p[1]))));
      cd.face.setAttribute('d', poly(cd.shape.map((p) => w(p[0], p[1]))));
      cd.head.setAttribute('d', seg(w(6, TRAY_H - 10), w(TRAY_W - 6, TRAY_H - 10)));
      cd.rules.setAttribute(
        'd',
        [TRAY_H - 18, TRAY_H - 25, TRAY_H - 33]
          .map((v) => seg(w(6, v), w(TRAY_W - 6, v)))
          .join(''),
      );
      cd.face.classList.toggle('hi', isHi);
      cd.head.classList.toggle('hi', isHi);
      cd.punch.forEach((el, k) => {
        place(el, punchPts[k]);
        el.setAttribute('class', k === cd.n - 1 ? (isHi ? 'dot' : 'dot m') : 'dot off');
      });
    }

    const loop = register(stage, (_dt, now) => {
      let moving = false;
      plates.forEach((cd, i) => {
        draw(i, tval(cd.a, now), tval(cd.z, now));
        if (!tdone(cd.a, now) || !tdone(cd.z, now)) moving = true;
      });
      return moving;
    });
    bag.add(loop.unregister);

    function setActive(a: number) {
      if (a === act) return;
      const now = performance.now();
      const from = a >= 0 ? a : act;
      act = a;
      plates.forEach((cd, i) => {
        const delay = Math.abs(i - from) * stag;
        const th = a < 0 ? (i === TRAY_N - 1 ? -7 : TRAY_REST) : i < a ? TRAY_BACK : i > a ? TRAY_FWD : 0;
        const lz = a < 0 ? (i === TRAY_N - 1 ? 5 : 0) : i === a ? TRAY_LIFT : 0;
        tset(cd.a, th, now, delay);
        tset(cd.z, lz, now, delay);
      });
      read.textContent = a < 0 ? 'rest' : `stage 0${a + 1}`;
      loop.wake();
    }

    bag.add(
      pointer(stage, {
        move: (p) => setActive(hit(p)),
        down: (p) => {
          const idx = hit(p);
          setActive(idx);
          if (idx >= 0) onPick?.(idx);
        },
        leave: () => setActive(-1),
      }),
    );
    bag.add(() => svg.replaceChildren());

    return {
      set: (v: number) => {
        stag = v;
      },
      destroy: bag.dispose,
    };
  },
};

export const ALL_HAIRLINE_FIGURES: HairlineFigureSpec[] = [
  PARITY_PLINTH_FIGURE,
  WITNESS_CALIPER_FIGURE,
  CLAUSE_TURRET_FIGURE,
  PIVOT_TRAY_FIGURE,
];
