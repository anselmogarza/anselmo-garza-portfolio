(function (root) {
  'use strict';
  const width = 720,
    height = 400,
    replayTicks = 150,
    pickupOffset = 200;
  const platform = { x: 260, y: 250, w: 220, h: 18 },
    coin = { x: 365, y: 218, w: 22, h: 22 };
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
      collected: false,
      contact: false,
    };
  }
  function hitbox(s) {
    return { ...coin, y: coin.y - (s.fixed ? 0 : pickupOffset) };
  }
  function step(s, i = {}) {
    s.x = Math.max(
      0,
      Math.min(width - s.w, s.x + (i.right ? 3 : 0) - (i.left ? 3 : 0)),
    );
    if (i.jump && s.grounded) {
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
    if (overlap(s, coin)) s.contact = true;
    if (overlap(s, hitbox(s))) s.collected = true;
    return s;
  }
  function replayInput(t) {
    return { right: t < 103, jump: t === 49 };
  }
  const api = {
    width,
    height,
    replayTicks,
    pickupOffset,
    platform,
    coin,
    create,
    hitbox,
    step,
    replayInput,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PickupGame = api;
})(globalThis);
