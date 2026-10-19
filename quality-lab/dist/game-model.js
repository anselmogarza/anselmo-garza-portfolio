(function (root) {
  'use strict';
  const width = 720,
    height = 400,
    replayTicks = 90;
  const platform = { x: 260, y: 250, w: 300, h: 18 };
  const coin = { x: 365, y: 218, w: 22, h: 22 };
  const scenarios = [
    {
      id: 'normal',
      name: 'Normal movement',
      expected: 1,
      note: '3 pixels per update; endpoints overlap.',
    },
    {
      id: 'fast',
      name: 'Fast crossing',
      expected: 1,
      note: '90 pixels in one update; both endpoints miss.',
    },
    {
      id: 'hitch',
      name: 'Frame hitch',
      expected: 1,
      note: 'A controlled 180ms gap at 1,500px/s: 270 pixels in one update.',
    },
    {
      id: 'near',
      name: 'Near miss',
      expected: 0,
      note: 'Cross 8 pixels above the coin; must not collect.',
    },
    {
      id: 'once',
      name: 'Collect only once',
      expected: 1,
      note: 'Cross repeatedly; award exactly one pickup.',
    },
  ];
  const overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function create(mode = 'endpoint') {
    return {
      x: 60,
      y: 320,
      w: 24,
      h: 40,
      vy: 0,
      grounded: true,
      mode,
      collected: false,
      count: 0,
      updates: 0,
      trace: null,
      evidence: null,
    };
  }
  function hitbox(s) {
    const padding = s.mode === 'padded' ? 20 : 0;
    return {
      x: coin.x - padding,
      y: coin.y - padding,
      w: coin.w + padding * 2,
      h: coin.h + padding * 2,
    };
  }
  // Sweep the player's top-left point against a coin expanded by player size.
  // Intersect time intervals on both axes to reject diagonal bounding-box false positives.
  function crosses(from, to, target = coin) {
    let enter = 0,
      exit = 1;
    for (const [axis, size] of [
      ['x', 'w'],
      ['y', 'h'],
    ]) {
      const delta = to[axis] - from[axis];
      const min = target[axis] - from[size],
        max = target[axis] + target[size];
      if (delta === 0) {
        if (from[axis] <= min || from[axis] >= max) return false;
      } else {
        const a = (min - from[axis]) / delta,
          b = (max - from[axis]) / delta;
        enter = Math.max(enter, Math.min(a, b));
        exit = Math.min(exit, Math.max(a, b));
        if (enter >= exit) return false;
      }
    }
    return enter < exit;
  }
  function move(s, x, y) {
    const from = { x: s.x, y: s.y, w: s.w, h: s.h };
    s.x = x;
    s.y = y;
    const to = { x, y, w: s.w, h: s.h };
    const endpoint = overlap(to, coin),
      crossing = crosses(from, to);
    const detected = s.mode === 'swept' ? crossing : overlap(to, hitbox(s));
    const trace = { from, to, endpoint, crossing, detected, dx: x - from.x };
    s.trace = trace;
    if (crossing || detected) s.evidence = trace;
    if (detected && !s.collected) {
      s.collected = true;
      s.count++;
    }
    return s;
  }
  function step(s, input = {}) {
    const speed = input.condition === 'fast' ? 90 : 3;
    const hitch = input.condition === 'hitch' && s.updates % 45 === 0;
    const distance = hitch ? 270 : speed;
    const x = Math.max(
      0,
      Math.min(
        width - s.w,
        s.x + (input.right ? distance : 0) - (input.left ? distance : 0),
      ),
    );
    if (input.jump && s.grounded) {
      s.vy = -11;
      s.grounded = false;
    }
    const bottom = s.y + s.h;
    s.vy += 0.38;
    let y = s.y + s.vy;
    s.grounded = false;
    for (const p of [platform, { x: 0, y: 360, w: width }]) {
      if (
        s.vy >= 0 &&
        bottom <= p.y &&
        y + s.h >= p.y &&
        x + s.w > p.x &&
        x < p.x + p.w
      ) {
        y = p.y - s.h;
        s.vy = 0;
        s.grounded = true;
      }
    }
    s.updates++;
    return move(s, x, y);
  }
  function replayState(mode, id) {
    const s = create(mode);
    s.x = id === 'hitch' ? 240 : id === 'normal' || id === 'once' ? 330 : 300;
    s.y = id === 'near' ? 170 : 210;
    return s;
  }
  // Isolate horizontal pickup behavior; manual play still includes gravity and jumping.
  // Hold the decisive crossing for inspection without depending on device frame timing.
  function replayStep(s, id, tick) {
    if (tick < 20) return s;
    let dx = 0;
    if (id === 'normal' && tick < 50) dx = 3;
    if ((id === 'fast' || id === 'near') && tick === 20) dx = 90;
    if (id === 'hitch' && tick === 20) dx = 270;
    if (id === 'once' && tick < 80)
      dx = Math.floor((tick - 20) / 20) % 2 === 0 ? 3 : -3;
    if (dx) move(s, s.x + dx, s.y);
    return s;
  }
  function runCase(mode, id) {
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) throw new Error('Unknown pickup scenario: ' + id);
    const s = replayState(mode, id);
    for (let tick = 0; tick < replayTicks; tick++) replayStep(s, id, tick);
    return {
      ...scenario,
      actual: s.count,
      pass: s.count === scenario.expected,
      evidence: s.evidence,
    };
  }
  const api = {
    width,
    height,
    replayTicks,
    platform,
    coin,
    scenarios,
    create,
    hitbox,
    crosses,
    move,
    step,
    replayState,
    replayStep,
    runCase,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PickupGame = api;
})(globalThis);
