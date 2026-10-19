(() => {
  'use strict';
  const gameModel = window.PickupGame,
    $ = (id) => document.getElementById(id);
  const canvas = $('game'),
    ctx = canvas.getContext('2d');
  let fixed = false,
    running = false,
    frozen = false,
    reproduced = false;
  let state = gameModel.create(),
    tick = 0,
    previous = 0,
    accumulator = 0,
    jump = false;
  const held = new Set();
  function clear() {
    held.clear();
    jump = false;
  }
  function status(text) {
    $('play-status').textContent = text;
  }
  function buttons() {
    $('test').disabled = running;
    $('restart-play').disabled = running;
    $('fix').disabled = running || fixed || !reproduced;
  }
  function timeline() {
    $('timeline').replaceChildren(
      ...state.events.map((text) => {
        const event = document.createElement('li');
        event.textContent = text;
        return event;
      }),
    );
  }
  function finish() {
    running = false;
    frozen = true;
    clear();
    const removed = !state.coinVisible,
      scored = state.count === 1;
    const before = state.count;
    // Simulate another pickup callback at the same location to check the guard.
    gameModel.pickup(state);
    const noDuplicate = state.count === before;
    const pass = removed && scored && noDuplicate;
    if (!pass) reproduced = true;
    $('assertions').replaceChildren(
      ...[
        [removed, 'Coin removed', removed ? 'yes' : 'no', 'yes'],
        [scored, 'Score increased', String(state.count), '1'],
      ].map(([ok, name, actual, expected]) => {
        const row = document.createElement('p');
        row.className = ok ? 'check-pass' : 'check-fail';
        row.textContent =
          (ok ? 'PASS' : 'FAIL') +
          ' · ' +
          name +
          ' — expected ' +
          expected +
          ', observed ' +
          actual +
          '.';
        return row;
      }),
    );
    $('result').className = 'test-result ' + (pass ? 'pass' : 'fail');
    $('result').textContent = pass
      ? 'PASS · Coin gone. Score 1/1. Repeated pickup awards no extra point.'
      : 'FAIL · The coin disappeared, but the point was never awarded.';
    $('mode').textContent = fixed && pass ? 'FIX VERIFIED' : 'BUG PRESENT';
    $('mode').className = 'pill ' + (fixed && pass ? 'success' : 'warning');
    timeline();
    $('evidence').open = true;
    buttons();
    status('Replay complete. Use Restart play to try it yourself.');
  }
  function advance() {
    if (running) {
      gameModel.step(state, gameModel.replayInput(tick++));
      if (tick === gameModel.replayTicks) finish();
    } else if (!frozen) {
      const visible = state.coinVisible;
      gameModel.step(state, {
        left: held.has('left'),
        right: held.has('right'),
        jump,
      });
      if (visible && !state.coinVisible) {
        if (!fixed) reproduced = true;
        timeline();
        buttons();
        status(
          fixed
            ? 'Coin gone and score 1/1. Run the pickup test to verify.'
            : 'The coin vanished, but your score is still zero. Run the pickup test.',
        );
      }
    }
    jump = false;
  }
  function frame(time) {
    accumulator += Math.min((time - (previous || time)) / 1000, 0.1);
    previous = time;
    while (accumulator >= 1 / 60) {
      advance();
      accumulator -= 1 / 60;
    }
    draw();
    requestAnimationFrame(frame);
  }
  $('test').onclick = () => {
    clear();
    state = gameModel.create(fixed);
    tick = 0;
    accumulator = 0;
    running = true;
    frozen = false;
    $('assertions').replaceChildren();
    $('timeline').replaceChildren();
    $('result').className = 'test-result';
    $('result').textContent =
      'Running: move, jump, touch coin, check removal and score…';
    status(
      'The replay uses the same movement and pickup handler as manual play.',
    );
    buttons();
  };
  $('fix').onclick = () => {
    if (running || fixed || !reproduced) return;
    fixed = true;
    frozen = false;
    clear();
    state = gameModel.create(true);
    $('mode').textContent = 'FIX APPLIED · UNVERIFIED';
    $('mode').className = 'pill warning';
    $('result').className = 'test-result';
    $('result').textContent =
      'Fix applied · verification pending. Rerun the same pickup test.';
    $('assertions').replaceChildren();
    $('test').textContent = '▶ Retest pickup';
    status(
      'The pickup now records the point and removes the coin together. Retest to verify.',
    );
    buttons();
  };
  $('restart-play').onclick = () => {
    if (running) return;
    frozen = false;
    clear();
    state = gameModel.create(fixed);
    status('Fresh attempt. Move and jump onto the platform to touch the coin.');
  };
  $('reset').onclick = () => {
    fixed = running = frozen = reproduced = false;
    tick = accumulator = 0;
    clear();
    state = gameModel.create();
    $('mode').textContent = 'BUG PRESENT';
    $('mode').className = 'pill warning';
    $('test').textContent = '▶ Run pickup test';
    $('result').className = 'test-result';
    $('result').textContent = 'Ready. Touch the coin, then check your score.';
    $('assertions').replaceChildren();
    $('timeline').replaceChildren();
    $('evidence').open = false;
    status(
      'Jump onto the platform and touch the coin. Watch both the coin and your score.',
    );
    buttons();
  };
  function draw() {
    ctx.clearRect(0, 0, 720, 400);
    ctx.strokeStyle = '#dce6d5';
    ctx.lineWidth = 1;
    for (let x = 0; x < 720; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
    ctx.fillStyle = '#d8e4cd';
    ctx.fillRect(0, 360, 720, 40);
    ctx.fillStyle = '#365e49';
    const p = gameModel.platform;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.font = '12px Consolas, monospace';
    ctx.fillStyle = '#68746e';
    ctx.fillText('REACH THE COIN', 285, 293);
    if (state.coinVisible) {
      ctx.fillStyle = '#e8b94d';
      ctx.beginPath();
      ctx.arc(
        gameModel.coin.x + gameModel.coin.w / 2,
        gameModel.coin.y + gameModel.coin.h / 2,
        gameModel.coin.w / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = '#805021';
      ctx.fillText('1', 372, 233);
    }
    const x = state.x + 12,
      y = state.y;
    ctx.strokeStyle = '#203e30';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y + 6, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x, y + 26);
    ctx.moveTo(x - 10, y + 21);
    ctx.lineTo(x, y + 16);
    ctx.lineTo(x + 10, y + 21);
    ctx.moveTo(x - 9, y + 39);
    ctx.lineTo(x, y + 26);
    ctx.lineTo(x + 9, y + 39);
    ctx.stroke();
    $('count').textContent = 'Score: ' + state.count + ' / 1';
  }

  const keys = {
    ArrowLeft: 'left',
    a: 'left',
    A: 'left',
    ArrowRight: 'right',
    d: 'right',
    D: 'right',
    ' ': 'jump',
    ArrowUp: 'jump',
  };
  canvas.addEventListener('keydown', (e) => {
    const key = keys[e.key];
    if (!key) return;
    e.preventDefault();
    if (running) return;
    if (key === 'jump' && !e.repeat) jump = true;
    else if (key !== 'jump') held.add(key);
  });
  window.addEventListener('keyup', (e) => held.delete(keys[e.key]));
  canvas.addEventListener('blur', clear);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);
  document.querySelectorAll('[data-control]').forEach((button) => {
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (running) return;
      button.setPointerCapture(e.pointerId);
      const key = button.dataset.control;
      if (key === 'jump') jump = true;
      else held.add(key);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      button.addEventListener(event, () => held.delete(button.dataset.control));
    button.addEventListener('keydown', (e) => {
      if (running || ![' ', 'Enter'].includes(e.key)) return;
      e.preventDefault();
      if (button.dataset.control === 'jump' && !e.repeat) jump = true;
      else if (button.dataset.control !== 'jump')
        held.add(button.dataset.control);
    });
    button.addEventListener('keyup', () => held.delete(button.dataset.control));
    button.addEventListener('blur', clear);
  });
  requestAnimationFrame(frame);
})();
