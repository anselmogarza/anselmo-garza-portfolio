(function (root) {
  'use strict';
  const width = 720,
    height = 400,
    replayTicks = 150;
  const platform = { x: 260, y: 250, w: 300, h: 18 };
  const coin = { x: 365, y: 218, w: 22, h: 22 };
  const overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function create(fixed = false) {
    return {
      x: 60,
      y: 320,
      w: 24,
      h: 40,
      vy: 0,
      grounded: true,
      fixed,
      coinVisible: true,
      collected: false,
      count: 0,
      events: [],
    };
  }
  function pickup(s) {
    if (!s.coinVisible || s.collected) return;
    s.events.push('Player touched the coin.');
    if (s.fixed) {
      s.collected = true;
      s.count++;
      s.coinVisible = false;
      s.events.push(
        'Pickup recorded: score increased to 1.',
        'Coin removed from the screen.',
      );
    } else {
      s.coinVisible = false;
      s.events.push('Coin removed from the screen.');
      // Intentional defect: visibility was changed before it is used as a guard.
      if (s.coinVisible) {
        s.collected = true;
        s.count++;
      } else
        s.events.push('Score update skipped: the coin is no longer visible.');
    }
  }
  function step(s, input = {}) {
    s.x = Math.max(
      0,
      Math.min(width - s.w, s.x + (input.right ? 3 : 0) - (input.left ? 3 : 0)),
    );
    if (input.jump && s.grounded) {
      s.vy = -11;
      s.grounded = false;
    }
    const bottom = s.y + s.h;
    s.vy += 0.38;
    s.y += s.vy;
    s.grounded = false;
    for (const p of [platform, { x: 0, y: 360, w: width }]) {
      if (
        s.vy >= 0 &&
        bottom <= p.y &&
        s.y + s.h >= p.y &&
        s.x + s.w > p.x &&
        s.x < p.x + p.w
      ) {
        s.y = p.y - s.h;
        s.vy = 0;
        s.grounded = true;
      }
    }
    if (overlap(s, coin)) pickup(s);
    return s;
  }
  function replayInput(tick) {
    return { right: tick < 103, jump: tick === 49 };
  }
  const api = {
    width,
    height,
    replayTicks,
    platform,
    coin,
    create,
    pickup,
    step,
    replayInput,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PickupGame = api;
})(globalThis);
