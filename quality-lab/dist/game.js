(() => {
  'use strict';
  const gameModel = window.PickupGame,
    $ = (id) => document.getElementById(id),
    canvas = $('game'),
    ctx = canvas.getContext('2d');
  let state = gameModel.create(),
    fixed = false,
    running = false,
    failed = false,
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
    if (!state.collected) {
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
    if ($('hitboxes').checked) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#276b51';
      ctx.strokeRect(state.x, state.y, state.w, state.h);
      ctx.strokeRect(
        gameModel.coin.x,
        gameModel.coin.y,
        gameModel.coin.w,
        gameModel.coin.h,
      );
      const h = gameModel.hitbox(state);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#97632a';
      ctx.strokeRect(h.x, h.y, h.w, h.h);
      ctx.setLineDash([]);
      ctx.fillStyle = '#805021';
      ctx.fillText('PICKUP AREA', h.x + 30, h.y + 15);
    }
    $('count').textContent = 'Collected: ' + (state.collected ? 1 : 0) + ' / 1';
  }
  function finish() {
    running = false;
    clear();
    $('test').disabled = false;
    const pass = state.collected;
    failed = !pass;
    $('result').className = 'test-result ' + (pass ? 'pass' : 'fail');
    $('result').textContent =
      (pass ? 'PASS' : 'FAIL') +
      ' · Expected collected: 1. Observed: ' +
      (pass ? 1 : 0) +
      '. Same ' +
      gameModel.replayTicks +
      '-step replay and pickup assertion.';
    $('observations').textContent =
      'Visible coin overlap: ' +
      (state.contact ? 'yes' : 'no') +
      '. Pickup offset: ' +
      (fixed ? 0 : -gameModel.pickupOffset) +
      'px. Collected: ' +
      (pass ? 1 : 0) +
      '.';
    $('fix').disabled = fixed || !failed;
    $('evidence').open = true;
    if (!pass) $('hitboxes').checked = true;
    status(
      pass
        ? 'Coin collected. The same pickup check now passes.'
        : 'The player reached the visible coin, but its pickup area was elsewhere.',
    );
  }
  function advance() {
    const collected = state.collected,
      contact = state.contact;
    gameModel.step(
      state,
      running
        ? gameModel.replayInput(tick++)
        : { left: held.has('left'), right: held.has('right'), jump },
    );
    jump = false;
    if (!running && !collected && state.collected)
      status('Coin collected! Run the pickup test to verify the fix.');
    else if (!running && !contact && state.contact && !state.collected)
      status(
        'You touched the coin, but it did not collect. Run the pickup test to investigate.',
      );
    if (running && tick === gameModel.replayTicks) finish();
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
    running = true;
    accumulator = 0;
    $('test').disabled = true;
    $('fix').disabled = true;
    $('result').className = 'test-result';
    $('result').textContent =
      'Running: move → jump → overlap coin → assert collected count…';
    status(
      'Automated replay in progress. Manual controls resume when it finishes.',
    );
  };
  $('fix').onclick = () => {
    if (running || !failed || fixed) return;
    fixed = true;
    state = gameModel.create(true);
    clear();
    $('mode').textContent = 'FIX APPLIED';
    $('mode').className = 'pill success';
    $('fix').disabled = true;
    $('fix').textContent = '✓ Hitbox fix applied';
    $('test').textContent = '▶ Retest pickup';
    $('result').className = 'test-result';
    $('result').textContent =
      'Fix applied · verification pending. Rerun the same check.';
    status('Pickup bounds now follow the coin. Try it yourself or retest.');
  };
  $('reset').onclick = () => {
    running = fixed = failed = false;
    tick = accumulator = 0;
    clear();
    state = gameModel.create();
    $('mode').textContent = 'BUG PRESENT';
    $('mode').className = 'pill warning';
    $('test').disabled = false;
    $('test').textContent = '▶ Run pickup test';
    $('fix').disabled = true;
    $('fix').textContent = 'Apply hitbox fix';
    $('result').className = 'test-result';
    $('result').textContent = 'Ready. Play freely or run the automated replay.';
    $('observations').textContent =
      'Run the test to capture collision evidence.';
    $('hitboxes').checked = false;
    $('evidence').open = false;
    status('Jump onto the platform and reach the coin.');
  };
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
