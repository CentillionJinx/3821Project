/// <reference lib="dom" />
/**
 * Hairline isometric line-drawing kernel (extracted from @lucasmarkes/hairline
 * for custom non-stock interactive figures in TypeScript + React).
 *
 * ViewBox convention: 400 x 320, default camera Cam(45, 0.5, S) (2:1 isometric),
 * back-to-front painter's order ascending in (x + y).
 */

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export interface RingSample {
  u: number;
  v: number;
  nu: number;
  nv: number;
}

export interface Camera {
  az: number;
  k: number;
  S: number;
  ox: number;
  oy: number;
}

export type Projector = (x: number, y: number, z: number) => Vec2;

export interface SolidGroup {
  g: SVGGElement;
  sil: SVGPathElement;
  cr: SVGPathElement;
}

export interface SpringState {
  x: number;
  v: number;
  t: number;
  k: number;
  c: number;
  m: number;
  eps: number;
}

export interface TweenState {
  from: number;
  to: number;
  t0: number;
  dur: number;
}

export interface Disposer {
  add: (fn: () => void) => void;
  on: (
    target: EventTarget,
    type: string,
    fn: EventListenerOrEventListenerObject,
    opts?: AddEventListenerOptions | boolean,
  ) => void;
  dispose: () => void;
}

export interface PointerHandlers {
  move: (point: Vec2, event: PointerEvent | { pointerType: string }) => void;
  down?: (point: Vec2, event: PointerEvent | { pointerType: string }) => void;
  leave: (event?: PointerEvent | { pointerType: string }) => void;
}

export interface HairlineReadout {
  get textContent(): string | null;
  set textContent(value: string | null);
}

export interface HairlineMountEnv {
  stage: HTMLElement;
  svg: SVGSVGElement;
  read: HairlineReadout;
  onPick?: (index: number) => void;
}

export interface HairlineHandle {
  set: (value: number) => void;
  destroy: () => void;
}

export interface HairlineFigureSpec {
  name: string;
  title: string;
  means: string;
  rules: number[];
  range: [number, number, number];
  tour: Array<Vec2 | null>;
  rangeLabel: string;
  mount: (env: HairlineMountEnv, value: number) => HairlineHandle;
}

// ---------------------------------------------------------------------------
// Isometric geometry & projection
// ---------------------------------------------------------------------------
export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const rad = (deg: number): number => (deg * Math.PI) / 180;
export const r2 = (n: number): number => Math.round(n * 100) / 100;

export const poly = (pts: Vec2[]): string =>
  'M' + pts.map((p) => `${r2(p[0])} ${r2(p[1])}`).join('L') + 'Z';

export const seg = (a: Vec2, b: Vec2): string =>
  `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}`;

export const open = (pts: Vec2[]): string =>
  pts.length < 2 ? '' : 'M' + pts.map((p) => `${r2(p[0])} ${r2(p[1])}`).join('L');

export const Cam = (azDeg: number, k: number, S: number): Camera => ({
  az: rad(azDeg),
  k,
  S,
  ox: 0,
  oy: 0,
});

export function proj(C: Camera): Projector {
  const c = Math.cos(C.az);
  const s = Math.sin(C.az);
  const zf = Math.sqrt(1 - C.k * C.k);
  return (x: number, y: number, z: number): Vec2 => {
    const X = x * c - y * s;
    const Y = x * s + y * c;
    return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * zf)];
  };
}

export function unproj(C: Camera, sx: number, sy: number, z: number): Vec2 {
  const c = Math.cos(C.az);
  const s = Math.sin(C.az);
  const zf = Math.sqrt(1 - C.k * C.k);
  const X = (sx - C.ox) / C.S;
  const Y = ((sy - C.oy) / C.S + z * zf) / C.k;
  return [X * c + Y * s, -X * s + Y * c];
}

export function fit(C: Camera, pts: Vec3[], cx: number, cy: number): void {
  C.ox = 0;
  C.oy = 0;
  const P = proj(C);
  let minX = 1e9;
  let maxX = -1e9;
  let minY = 1e9;
  let maxY = -1e9;
  for (const p of pts) {
    const q = P(p[0], p[1], p[2]);
    minX = Math.min(minX, q[0]);
    maxX = Math.max(maxX, q[0]);
    minY = Math.min(minY, q[1]);
    maxY = Math.max(maxY, q[1]);
  }
  C.ox = cx - (minX + maxX) / 2;
  C.oy = cy - (minY + maxY) / 2;
}

export function rrect(u0: number, v0: number, u1: number, v1: number, r: number, n = 4): RingSample[] {
  const radius = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
  const out: RingSample[] = [];
  const corners: Array<[number, number, number]> = [
    [u1 - radius, v1 - radius, 0],
    [u0 + radius, v1 - radius, 90],
    [u0 + radius, v0 + radius, 180],
    [u1 - radius, v0 + radius, 270],
  ];
  for (const [cu, cv, a0] of corners) {
    for (let k = 0; k <= n; k++) {
      const a = rad(a0 + (90 * k) / n);
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      out.push({ u: cu + radius * ca, v: cv + radius * sa, nu: ca, nv: sa });
    }
  }
  return out;
}

export function circ(R: number, n = 96): RingSample[] {
  const out: RingSample[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    out.push({ u: R * ca, v: R * sa, nu: ca, nv: sa });
  }
  return out;
}

export function hull(input: Vec2[]): Vec2[] {
  const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Vec2, a: Vec2, b: Vec2) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Vec2[] = [];
  const up: Vec2[] = [];
  for (const p of pts) {
    while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  lo.pop();
  up.pop();
  return lo.concat(up);
}

export const ringAt = (P: Projector, ring: RingSample[], z: number): Vec2[] =>
  ring.map((q) => P(q.u, q.v, z));

export const facing = (C: Camera): ((q: RingSample) => boolean) => {
  const s = Math.sin(C.az);
  const c = Math.cos(C.az);
  return (q: RingSample) => q.nu * s + q.nv * c >= -1e-6;
};

export function run(ring: RingSample[], keep: (q: RingSample) => boolean): RingSample[] {
  const n = ring.length;
  let startIdx = -1;
  for (let i = 0; i < n; i++) {
    if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) {
      startIdx = i;
      break;
    }
  }
  if (startIdx < 0) return keep(ring[0]) ? ring.slice() : [];
  const out: RingSample[] = [];
  for (let k = 0; k < n && keep(ring[(startIdx + k) % n]); k++) {
    out.push(ring[(startIdx + k) % n]);
  }
  return out;
}

export function prism(
  P: Projector,
  front: (q: RingSample) => boolean,
  ring: RingSample[],
  inner: RingSample[] | null,
  z0: number,
  z1: number,
): { sil: string; crease: string } {
  return {
    sil: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))),
    crease: inner ? open(ringAt(P, run(inner, front), z1)) : '',
  };
}

export const rings = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  b: number,
): [RingSample[], RingSample[]] => [
  rrect(x0, y0, x1, y1, r),
  rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.3, r - b)),
];

export function extremes(P: Projector, ring: RingSample[]): [RingSample, RingSample, RingSample] {
  const pr = ring.map((q) => P(q.u, q.v, 0));
  let a = 0;
  let b = 0;
  let c = 0;
  pr.forEach((p, k) => {
    if (p[0] < pr[a][0]) a = k;
    if (p[0] > pr[b][0]) b = k;
    if (p[1] > pr[c][1]) c = k;
  });
  return [ring[a], ring[b], ring[c]];
}

export function fillet(pts: Vec2[], rs: number[], n = 4): Vec2[] {
  const m = pts.length;
  const out: Vec2[] = [];
  for (let i = 0; i < m; i++) {
    const a = pts[(i + m - 1) % m];
    const p = pts[i];
    const b = pts[(i + 1) % m];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const t = Math.min(rs[i], la / 2, lb / 2);
    const p1: Vec2 = [p[0] + ((a[0] - p[0]) / la) * t, p[1] + ((a[1] - p[1]) / la) * t];
    const p2: Vec2 = [p[0] + ((b[0] - p[0]) / lb) * t, p[1] + ((b[1] - p[1]) / lb) * t];
    for (let k = 0; k <= n; k++) {
      const s = k / n;
      const w = 1 - s;
      out.push([
        w * w * p1[0] + 2 * w * s * p[0] + s * s * p2[0],
        w * w * p1[1] + 2 * w * s * p[1] + s * s * p2[1],
      ]);
    }
  }
  return out;
}

export function ghost(
  P: Projector,
  front: (q: RingSample) => boolean,
  ring: RingSample[],
  z0: number,
  depth: number,
): { d: string; y0: number; y1: number } {
  const f = run(ring, front);
  const lowP = ringAt(P, f, z0 - depth);
  const drops = [f[0], f[f.length - 1]]
    .map((q) => seg(P(q.u, q.v, z0), P(q.u, q.v, z0 - depth)))
    .join('');
  return {
    d: open(lowP) + drops,
    y0: Math.min(...ringAt(P, f, z0).map((p) => p[1])),
    y1: Math.max(...lowP.map((p) => p[1])) + 2,
  };
}

// ---------------------------------------------------------------------------
// Clocks: spring + bezier tween
// ---------------------------------------------------------------------------
let reduced = false;
export const setReducedMotion = (on: boolean): void => {
  reduced = on;
};
export const reducedMotion = (): boolean => reduced;

export function spring(
  x: number,
  opts: Partial<{ k: number; c: number; m: number; eps: number }> = {},
): SpringState {
  return {
    x,
    v: 0,
    t: x,
    k: opts.k ?? 100,
    c: opts.c ?? 18,
    m: opts.m ?? 1,
    eps: opts.eps ?? 0.01,
  };
}

export function stepS(sp: SpringState, dt: number): boolean {
  if (reduced) {
    sp.x = sp.t;
    sp.v = 0;
    return false;
  }
  const n = Math.max(1, Math.ceil(dt * 240));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const a = (-sp.k * (sp.x - sp.t) - sp.c * sp.v) / sp.m;
    sp.v += a * h;
    sp.x += sp.v * h;
  }
  if (Math.abs(sp.x - sp.t) < sp.eps && Math.abs(sp.v) < sp.eps * 10) {
    sp.x = sp.t;
    sp.v = 0;
    return false;
  }
  return true;
}

export function bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (u: number) => ((ax * u + bx) * u + cx) * u;
  const Y = (u: number) => ((ay * u + by) * u + cy) * u;
  const dX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const e = X(u) - t;
      if (Math.abs(e) < 1e-5) break;
      const d = dX(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    if (!(u >= 0 && u <= 1) || Math.abs(X(u) - t) > 1e-4) {
      let lo = 0;
      let hi = 1;
      u = t;
      for (let i = 0; i < 24; i++) {
        if (X(u) < t) lo = u;
        else hi = u;
        u = (lo + hi) / 2;
      }
    }
    return Y(u);
  };
}

export const EASE_LIFT = bezier(0.32, 0.72, 0, 1);

export const tween = (v: number, dur = 700): TweenState => ({
  from: v,
  to: v,
  t0: -1e9,
  dur,
});

export const tval = (tw: TweenState, now: number): number => {
  const p = clamp((now - tw.t0) / tw.dur, 0, 1);
  return tw.from + (tw.to - tw.from) * (reduced ? 1 : EASE_LIFT(p));
};

export const tset = (tw: TweenState, to: number, now: number, delay: number): void => {
  if (tw.to === to) return;
  tw.from = tval(tw, now);
  tw.to = to;
  tw.t0 = now + delay;
};

export const tdone = (tw: TweenState, now: number): boolean => reduced || now >= tw.t0 + tw.dur;

// ---------------------------------------------------------------------------
// SVG scene graph, animation scheduler, pointer, tour & scoped stylesheet
// ---------------------------------------------------------------------------
const SVG_NS = 'http://www.w3.org/2000/svg';

export function mk<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
  parent?: Element,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      el.setAttribute(k, String(attrs[k]));
    }
  }
  if (parent) parent.appendChild(el);
  return el;
}

export function solid(parent: Element): SolidGroup {
  const g = mk('g', {}, parent);
  return {
    g,
    sil: mk('path', { class: 'sil' }, g),
    cr: mk('path', { class: 'nf lo' }, g),
  };
}

export const put = (el: SolidGroup, s: { sil: string; crease: string }): void => {
  el.sil.setAttribute('d', s.sil);
  el.cr.setAttribute('d', s.crease);
};

export const flatDot = (parent: Element, C: Camera, r: number, cls: string): SVGEllipseElement =>
  mk('ellipse', { rx: r2(r * C.S), ry: r2(r * C.S * C.k), class: cls }, parent);

export const place = (el: Element, q: Vec2): void => {
  el.setAttribute('cx', String(r2(q[0])));
  el.setAttribute('cy', String(r2(q[1])));
};

let fadeId = 0;

export function fade(svg: SVGSVGElement, y0: number, y1: number, a0 = 0.7): string {
  const id = `hl-fd-${++fadeId}`;
  const defs = mk('defs', {}, svg);
  const lg = mk(
    'linearGradient',
    { id: `${id}g`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: r2(y0), x2: 0, y2: r2(y1) },
    defs,
  );
  mk('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': a0 }, lg);
  mk('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, lg);
  const m = mk('mask', { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 400, height: 320 }, defs);
  mk('rect', { x: 0, y: 0, width: 400, height: 320, fill: `url(#${id}g)` }, m);
  return `url(#${id})`;
}

export function reflect(
  svg: SVGSVGElement,
  parent: Element,
  P: Projector,
  front: (q: RingSample) => boolean,
  ring: RingSample[],
  z0: number,
  depth: number,
): void {
  const r = ghost(P, front, ring, z0, depth);
  const gh = mk('g', { class: 'ghost', mask: fade(svg, r.y0, r.y1) }, parent);
  mk('path', { d: r.d }, gh);
}

interface BoardEntry {
  stage: HTMLElement;
  tick: (dt: number, now: number) => boolean;
  vis: boolean;
  awake: boolean;
}

let boards: BoardEntry[] = [];
const byStage = new Map<HTMLElement, Set<BoardEntry>>();
let raf = 0;
let last = 0;
let io: IntersectionObserver | null = null;
let rm: MediaQueryList | null = null;

function frame() {
  const now = performance.now();
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  let any = false;
  for (const b of boards.slice()) {
    if (b.vis && b.awake) {
      b.awake = !!b.tick(dt, now);
      any = any || b.awake;
    }
  }
  raf = any ? requestAnimationFrame(frame) : 0;
}

function wakeBoard(b: BoardEntry) {
  b.awake = true;
  if (!raf && typeof requestAnimationFrame === 'function') {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}

const onMotionChange = () => {
  setReducedMotion(!!rm?.matches);
  boards.forEach(wakeBoard);
};

function startLoop() {
  if (io || typeof IntersectionObserver === 'undefined') return;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const set = byStage.get(e.target as HTMLElement);
        if (!set) continue;
        for (const b of set) {
          b.vis = e.isIntersecting;
          if (b.vis) wakeBoard(b);
        }
      }
    },
    { rootMargin: '80px' },
  );
  rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  setReducedMotion(rm.matches);
  rm.addEventListener('change', onMotionChange);
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  io?.disconnect();
  io = null;
  rm?.removeEventListener('change', onMotionChange);
  rm = null;
}

export function register(
  stage: HTMLElement,
  tick: (dt: number, now: number) => boolean,
): { wake: () => void; unregister: () => void } {
  startLoop();
  const b: BoardEntry = { stage, tick, vis: typeof IntersectionObserver === 'undefined', awake: true };
  boards.push(b);
  const peers = byStage.get(stage);
  if (peers) {
    for (const p of peers) b.vis = p.vis;
    peers.add(b);
    if (b.vis) wakeBoard(b);
  } else {
    byStage.set(stage, new Set([b]));
    io?.observe(stage);
  }
  tick(0, performance.now());
  let gone = false;
  return {
    wake: () => {
      if (!gone) wakeBoard(b);
    },
    unregister: () => {
      if (gone) return;
      gone = true;
      boards = boards.filter((x) => x !== b);
      const set = byStage.get(stage);
      if (set) {
        set.delete(b);
        if (!set.size) {
          byStage.delete(stage);
          io?.unobserve(stage);
        }
      }
      if (!boards.length) stopLoop();
    },
  };
}

const pointerHandlers = new WeakMap<HTMLElement, PointerHandlers>();
const activeTours = new WeakMap<HTMLElement, { hold: () => void; release: () => void }>();

export function pointer(stage: HTMLElement, on: PointerHandlers): () => void {
  pointerHandlers.set(stage, on);
  let tm = 0;
  const pt = (e: PointerEvent): Vec2 => {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return [200, 160];
    return [((e.clientX - r.left) / r.width) * 400, ((e.clientY - r.top) / r.height) * 320];
  };
  const move = (e: PointerEvent) => {
    window.clearTimeout(tm);
    activeTours.get(stage)?.hold();
    on.move(pt(e), e);
  };
  const down = (e: PointerEvent) => {
    window.clearTimeout(tm);
    activeTours.get(stage)?.hold();
    if (e.pointerType !== 'mouse') stage.releasePointerCapture?.(e.pointerId);
    if (on.down) on.down(pt(e), e);
    else on.move(pt(e), e);
  };
  const leave = (e: PointerEvent) => {
    window.clearTimeout(tm);
    tm = window.setTimeout(
      () => {
        on.leave(e);
        activeTours.get(stage)?.release();
      },
      e.pointerType === 'mouse' ? 0 : 1400,
    );
  };
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerdown', down);
  stage.addEventListener('pointerleave', leave);
  return () => {
    window.clearTimeout(tm);
    if (pointerHandlers.get(stage) === on) pointerHandlers.delete(stage);
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerdown', down);
    stage.removeEventListener('pointerleave', leave);
  };
}

export const LAP: Array<Vec2 | null> = [
  [128, 150],
  [200, 118],
  [272, 150],
  [200, 206],
  null,
];

const TRAVEL = 900;
const DWELL = 1100;
const REST_MS = 1600;
const RESUME_MS = 600;
const GHOST_EVENT = { pointerType: 'ghost' };

function entryEdge([x, y]: Vec2): Vec2 {
  const dx = x - 200;
  const dy = y - 160;
  if (!dx && !dy) return [200, 320];
  const k = Math.min(
    dx ? (dx > 0 ? 200 : -200) / dx : Infinity,
    dy ? (dy > 0 ? 160 : -160) / dy : Infinity,
  );
  return [200 + dx * k, 160 + dy * k];
}

export function tour(
  stage: HTMLElement,
  stops: Array<Vec2 | null>,
  onStop?: (index: number) => void,
): { stop: () => void } {
  let i = 0;
  let wait = RESUME_MS;
  let t = -1;
  let at: Vec2 | null = null;
  let origin: Vec2 = [200, 320];
  let hand = false;
  let keys = stage.contains(stage.ownerDocument.activeElement);
  let gone = false;

  const leave = () => {
    at = null;
    t = -1;
    pointerHandlers.get(stage)?.leave(GHOST_EVENT);
  };

  const tick = (dt: number) => {
    if (hand || keys || !stops.length) return false;
    if (reducedMotion()) {
      if (at) leave();
      return false;
    }
    if (wait > 0) {
      wait -= dt * 1000;
      return true;
    }
    const stopItem = stops[i];
    if (stopItem === null) {
      if (at) leave();
      onStop?.(i);
      i = (i + 1) % stops.length;
      wait = REST_MS;
      return true;
    }
    const h = pointerHandlers.get(stage);
    if (!h) return true;
    if (t < 0) {
      origin = at ?? entryEdge(stopItem);
      t = 0;
    }
    t = Math.min(TRAVEL, t + dt * 1000);
    const k = EASE_LIFT(t / TRAVEL);
    at = [origin[0] + (stopItem[0] - origin[0]) * k, origin[1] + (stopItem[1] - origin[1]) * k];
    h.move(at, GHOST_EVENT);
    if (t < TRAVEL) return true;
    onStop?.(i);
    i = (i + 1) % stops.length;
    t = -1;
    wait = DWELL;
    return true;
  };

  const take = () => {
    at = null;
    t = -1;
  };

  const give = () => {
    if (hand || keys) return;
    i = 0;
    t = -1;
    wait = RESUME_MS;
    board.wake();
  };

  const ctrl = {
    hold: () => {
      hand = true;
      take();
    },
    release: () => {
      if (!hand) return;
      hand = false;
      give();
    },
  };

  const focusIn = () => {
    keys = true;
    take();
  };
  const focusOut = (e: FocusEvent) => {
    if (keys && !stage.contains(e.relatedTarget as Node | null)) {
      keys = false;
      give();
    }
  };

  stage.addEventListener('focusin', focusIn);
  stage.addEventListener('focusout', focusOut);
  activeTours.set(stage, ctrl);
  const board = register(stage, tick);

  return {
    stop: () => {
      if (gone) return;
      gone = true;
      board.unregister();
      stage.removeEventListener('focusin', focusIn);
      stage.removeEventListener('focusout', focusOut);
      if (activeTours.get(stage) === ctrl) activeTours.delete(stage);
      if (at) leave();
    },
  };
}

export function disposer(): Disposer {
  let fns: Array<() => void> = [];
  return {
    add: (fn) => {
      fns.push(fn);
    },
    on: (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      fns.push(() => target.removeEventListener(type, fn, opts));
    },
    dispose: () => {
      const list = fns;
      fns = [];
      for (let i = list.length - 1; i >= 0; i--) list[i]();
    },
  };
}

export function rangeValue(range: [number, number, number], intensity01: number): number {
  const [lo, mid, hi] = range;
  const v =
    intensity01 <= 0.5
      ? lo + (intensity01 / 0.5) * (mid - lo)
      : mid + ((intensity01 - 0.5) / 0.5) * (hi - mid);
  return Math.round(v * 1000) / 1000;
}

const injectedDocs = new WeakSet<Document>();

export function injectHairlineStyles(doc: Document): void {
  if (injectedDocs.has(doc)) return;
  injectedDocs.add(doc);
  const EASE = 'cubic-bezier(0.5,0,0.1,1)';
  const SVG = ':where([data-hairline]>svg)';
  const sheetText = [
    `:where([data-hairline]){display:block;position:relative;aspect-ratio:5/4;touch-action:pan-y;user-select:none;-webkit-user-select:none;--hl-sw:var(--hairline-stroke,1);--hl-plate:var(--hairline-plate,#090708);--hl-hi:var(--hairline-hi,#b3f2b3);--hl-edge:var(--hairline-edge,rgba(160,253,244,0.82));--hl-mid:var(--hairline-mid,rgba(160,253,244,0.38));--hl-lo:var(--hairline-lo,rgba(160,253,244,0.18));}`,
    `:where([data-hairline]:focus-visible){outline:1.5px solid var(--hl-hi);outline-offset:2px}`,
    `${SVG}{position:absolute;inset:0;width:100%;height:100%;display:block}`,
    `${SVG} :where(path,polygon,ellipse,line){fill:var(--hl-plate);stroke:var(--hl-mid);stroke-width:var(--hl-sw);vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;transition:stroke 260ms ${EASE}}`,
    `${SVG} :where(.nf){fill:none}`,
    `${SVG} :where(.fo){stroke:none}`,
    `${SVG} :where(.sil){stroke:var(--hl-edge)}`,
    `${SVG} :where(.hi){stroke:var(--hl-hi)}`,
    `${SVG} :where(.lo){stroke:var(--hl-lo)}`,
    `${SVG} :where(.dash){stroke-dasharray:1 3}`,
    `${SVG} :where(.dot){stroke:none;fill:var(--hl-hi);transition:fill 260ms ${EASE}}`,
    `${SVG} :where(.dot.m){fill:var(--hl-edge)}`,
    `${SVG} :where(.dot.off){fill:var(--hl-lo)}`,
    `${SVG} :where(.ghost path){fill:none;stroke:var(--hl-mid)}`,
  ].join('');
  const style = doc.createElement('style');
  style.setAttribute('data-hairline-style', '');
  style.textContent = sheetText;
  (doc.head ?? doc.documentElement).appendChild(style);
}
