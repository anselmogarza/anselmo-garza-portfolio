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
      coin: { ...coin, visible: true, collected: false, value: 1 },
      score: 0,
      events: [],
    };
  }
  // Before: an incomplete handler only removes the coin.
  function collectCoinBefore(coin) {
    coin.visible = false;
  }
  // After: each coin records its own collection state, independent of visibility.
  function collectCoin(coin, player) {
    if (coin.collected) return;
    coin.collected = true;
    player.score += coin.value;
    coin.visible = false;
  }
  function pickup(s) {
    if (!s.coin.visible || s.coin.collected) return;
    s.events.push('Player touched the coin.');
    if (s.fixed) {
      collectCoin(s.coin, s);
      s.events.push(
        'Pickup recorded: score increased to 1.',
        'Coin removed from the screen.',
      );
    } else {
      collectCoinBefore(s.coin);
      s.events.push(
        'Coin removed from the screen.',
        'Score unchanged: the pickup handler never awards the point.',
      );
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
    collectCoin,
    step,
    replayInput,
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PickupGame = api;
})(globalThis);
