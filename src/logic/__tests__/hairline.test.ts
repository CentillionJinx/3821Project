/// <reference lib="dom" />
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Cam,
  fit,
  proj,
  rangeValue,
  setReducedMotion,
  spring,
  stepS,
  tdone,
  tset,
  tval,
  tween,
  unproj,
  type Vec3,
} from '../hairlineEngine.ts';
import {
  ALL_HAIRLINE_FIGURES,
  CLAUSE_TURRET_FIGURE,
  PARITY_PLINTH_FIGURE,
  PIVOT_TRAY_FIGURE,
  WITNESS_CALIPER_FIGURE,
} from '../hairlineFigures.ts';

class MockClassList {
  private tokens = new Set<string>();

  syncFromAttr(value: string): void {
    this.tokens = new Set(value.split(/\s+/).filter(Boolean));
  }

  toggle(token: string, force?: boolean): boolean {
    if (force === true) {
      this.tokens.add(token);
      return true;
    }
    if (force === false) {
      this.tokens.delete(token);
      return false;
    }
    if (this.tokens.has(token)) {
      this.tokens.delete(token);
      return false;
    }
    this.tokens.add(token);
    return true;
  }

  contains(token: string): boolean {
    return this.tokens.has(token);
  }
}

class MockElement {
  tagName: string;
  attributes: Record<string, string> = {};
  children: MockElement[] = [];
  classList = new MockClassList();
  listeners = new Map<string, Set<(event: unknown) => void>>();
  textContent: string | null = null;

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  setAttribute(name: string, value: string): void {
    this.attributes[name] = value;
    if (name === 'class') this.classList.syncFromAttr(value);
  }

  getAttribute(name: string): string | null {
    return this.attributes[name] ?? null;
  }

  appendChild(child: MockElement): MockElement {
    this.children.push(child);
    return child;
  }

  replaceChildren(...nodes: MockElement[]): void {
    this.children = [...nodes];
  }

  addEventListener(type: string, fn: (event: unknown) => void): void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(fn);
  }

  removeEventListener(type: string, fn: (event: unknown) => void): void {
    this.listeners.get(type)?.delete(fn);
  }

  dispatch(type: string, event: Record<string, unknown>): void {
    const list = this.listeners.get(type);
    if (!list) return;
    for (const fn of list) fn(event);
  }

  getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
    return { left: 0, top: 0, width: 400, height: 320 };
  }

  contains(): boolean {
    return false;
  }

  releasePointerCapture(): void {}
}

function withMockDom(fn: () => void): void {
  const g = globalThis as unknown as Record<string, unknown>;
  const prevDoc = g.document;
  const prevWin = g.window;
  const prevRaf = g.requestAnimationFrame;
  const prevCancelRaf = g.cancelAnimationFrame;

  const timers = new Map<number, () => void>();
  let nextTimerId = 1;
  let nextRafId = 1;

  g.document = {
    createElementNS: (_ns: string, tag: string) => new MockElement(tag),
    createElement: (tag: string) => new MockElement(tag),
    head: new MockElement('head'),
    documentElement: new MockElement('html'),
  };

  g.window = {
    setTimeout: (cb: () => void, ms: number) => {
      const id = nextTimerId++;
      if (ms === 0) {
        cb();
      } else {
        timers.set(id, cb);
      }
      return id;
    },
    clearTimeout: (id: number) => {
      timers.delete(id);
    },
  };

  g.requestAnimationFrame = () => nextRafId++;
  g.cancelAnimationFrame = () => {};

  try {
    fn();
  } finally {
    timers.clear();
    if (prevDoc === undefined) delete g.document;
    else g.document = prevDoc;

    if (prevWin === undefined) delete g.window;
    else g.window = prevWin;

    if (prevRaf === undefined) delete g.requestAnimationFrame;
    else g.requestAnimationFrame = prevRaf;

    if (prevCancelRaf === undefined) delete g.cancelAnimationFrame;
    else g.cancelAnimationFrame = prevCancelRaf;
  }
}

test('Cam + fit + proj + unproj roundtrips within floating-point precision', () => {
  const cam = Cam(45, 0.5, 1.5);
  const corners: Vec3[] = [
    [-10, -10, 0],
    [100, -10, 0],
    [100, 100, 0],
    [-10, 100, 0],
    [45, 45, 30],
  ];
  fit(cam, corners, 200, 160);
  const P = proj(cam);

  const testPoints: Vec3[] = [
    [0, 0, 0],
    [34, 68, 12],
    [95.5, 12.25, 28],
    [-8, 72, -6],
  ];

  for (const [x, y, z] of testPoints) {
    const [sx, sy] = P(x, y, z);
    const [rx, ry] = unproj(cam, sx, sy, z);
    assert.ok(Math.abs(rx - x) < 1e-9, `x mismatch: ${rx} vs ${x}`);
    assert.ok(Math.abs(ry - y) < 1e-9, `y mismatch: ${ry} vs ${y}`);
  }
});

test('spring and tween clocks converge cleanly and honor reduced motion', () => {
  setReducedMotion(false);
  const sp = spring(0, { k: 180, c: 22, eps: 0.01 });
  sp.t = 40;
  let running = true;
  for (let i = 0; i < 180 && running; i++) {
    running = stepS(sp, 1 / 60);
  }
  assert.equal(running, false);
  assert.equal(sp.x, 40);
  assert.equal(sp.v, 0);

  const tw = tween(0, 400);
  tset(tw, 24, 100, 50);
  assert.equal(tval(tw, 120), 0);
  assert.equal(tdone(tw, 250), false);
  const mid = tval(tw, 350);
  assert.ok(mid > 0 && mid < 24, `expected eased mid value in (0, 24), got ${mid}`);
  assert.equal(tdone(tw, 550), true);
  assert.equal(tval(tw, 550), 24);

  setReducedMotion(true);
  sp.t = 12;
  assert.equal(stepS(sp, 1 / 60), false);
  assert.equal(sp.x, 12);
  setReducedMotion(false);
});

test('rangeValue maps intensity in [0, 1] monotonically across [lo, mid, hi]', () => {
  assert.equal(rangeValue([1.2, 2.2, 3.6], 0), 1.2);
  assert.equal(rangeValue([1.2, 2.2, 3.6], 0.25), 1.7);
  assert.equal(rangeValue([1.2, 2.2, 3.6], 0.5), 2.2);
  assert.equal(rangeValue([1.2, 2.2, 3.6], 0.75), 2.9);
  assert.equal(rangeValue([1.2, 2.2, 3.6], 1), 3.6);
});

test('all four custom Hairline figures satisfy metadata, caption, range, and tour contracts', () => {
  assert.equal(ALL_HAIRLINE_FIGURES.length, 4);
  assert.deepEqual(
    ALL_HAIRLINE_FIGURES.map((f) => f.name),
    ['parity-plinth', 'witness-caliper', 'clause-turret', 'pivot-tray'],
  );

  for (const fig of ALL_HAIRLINE_FIGURES) {
    assert.ok(fig.means.length > 10 && fig.means.length <= 140, `${fig.name} caption out of bounds`);
    const [lo, mid, hi] = fig.range;
    assert.ok(lo < mid && mid < hi, `${fig.name} range not strictly increasing`);
    assert.ok(fig.tour.length >= 3 && fig.tour.length <= 7, `${fig.name} tour stop count`);
    assert.equal(fig.tour[fig.tour.length - 1], null, `${fig.name} tour must end with rest (null)`);
    for (const stop of fig.tour) {
      if (!stop) continue;
      assert.ok(stop[0] >= 0 && stop[0] <= 400, `${fig.name} tour X out of viewBox`);
      assert.ok(stop[1] >= 0 && stop[1] <= 320, `${fig.name} tour Y out of viewBox`);
    }
  }
});

test('all four custom Hairline figures mount, respond to pointer hover/click, update intensity, and clean up', () => {
  withMockDom(() => {
    const figures = [
      PARITY_PLINTH_FIGURE,
      WITNESS_CALIPER_FIGURE,
      CLAUSE_TURRET_FIGURE,
      PIVOT_TRAY_FIGURE,
    ];

    for (const fig of figures) {
      const stage = new MockElement('div');
      const svg = new MockElement('svg');
      const read = { textContent: 'rest' as string | null };
      const picked: number[] = [];

      const handle = fig.mount(
        {
          stage: stage as unknown as HTMLElement,
          svg: svg as unknown as SVGSVGElement,
          read,
          onPick: (index) => picked.push(index),
        },
        fig.range[1],
      );

      assert.ok(svg.children.length > 0, `${fig.name} should populate SVG primitives on mount`);
      assert.ok(
        (stage.listeners.get('pointermove')?.size ?? 0) === 1,
        `${fig.name} should attach pointermove`,
      );

      const firstStop = fig.tour.find((s) => s !== null);
      assert.ok(firstStop, `${fig.name} should expose at least one active tour coordinate`);

      stage.dispatch('pointermove', {
        clientX: firstStop[0],
        clientY: firstStop[1],
        pointerType: 'mouse',
      });
      assert.notEqual(
        read.textContent,
        'rest',
        `${fig.name} readout should update on pointermove at (${firstStop[0]}, ${firstStop[1]})`,
      );

      stage.dispatch('pointerdown', {
        clientX: firstStop[0],
        clientY: firstStop[1],
        pointerType: 'mouse',
        pointerId: 1,
      });
      assert.ok(picked.length >= 1 && picked[0] >= 0, `${fig.name} pointerdown should invoke onPick`);

      stage.dispatch('pointerleave', { pointerType: 'mouse' });
      assert.equal(read.textContent, 'rest', `${fig.name} pointerleave should return readout to rest`);

      handle.set(fig.range[2]);
      handle.destroy();

      assert.equal(svg.children.length, 0, `${fig.name} destroy should clear SVG`);
      assert.equal(
        stage.listeners.get('pointermove')?.size ?? 0,
        0,
        `${fig.name} destroy should remove pointermove listener`,
      );
    }
  });
});
