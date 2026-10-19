(() => {
  'use strict';
  const gameModel = window.PickupGame,
    $ = (id) => document.getElementById(id);
  const canvas = $('game'),
    ctx = canvas.getContext('2d');
  const labels = {
    endpoint: 'ENDPOINT CHECK',
    padded: 'QUICK PATCH',
    swept: 'PATH FIX · UNVERIFIED',
  };
  let frozen = false;
  let mode = 'endpoint',
    running = false,
    tick = 0,
    previous = 0,
    accumulator = 0,
    jump = false;
  let state = gameModel.create(mode),
    replayId = 'fast',
    reproduced = false,
    regressionFailed = false;
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
    $('suite').disabled = running;
    $('scenario').disabled = running;
    $('fix').disabled = running || !reproduced || mode !== 'endpoint';
    $('proper-fix').disabled =
      running || !regressionFailed || mode !== 'padded';
    $('restart-play').disabled = running;
  }
  function setMode(next) {
    frozen = false;
    mode = next;
    state = gameModel.create(mode);
    clear();
    $('mode').textContent = labels[mode];
    $('mode').className = 'pill warning';
    $('result').className = 'test-result';
    $('result').textContent =
      'Change applied · verification pending. Retest the reproduction, then run regression.';
    $('matrix').replaceChildren();
    buttons();
  }
  function showEvidence(trace) {
    if (!trace) {
      $('observations').textContent = 'No crossing recorded in this scenario.';
      return;
    }
    $('observations').textContent =
      'Previous x: ' +
      trace.from.x +
      ' → current x: ' +
      trace.to.x +
      ' (' +
      trace.dx +
      'px). Endpoint overlap: ' +
      (trace.endpoint ? 'yes' : 'no') +
      '. Path crosses coin: ' +
      (trace.crossing ? 'yes' : 'no') +
      '. Active detector accepted: ' +
      (trace.detected ? 'yes' : 'no') +
      '.';
  }
  function finish() {
    running = false;
    frozen = true;
    clear();
    const scenario = gameModel.scenarios.find((item) => item.id === replayId);
    const pass = state.count === scenario.expected;
    if (mode === 'endpoint' && !pass && ['fast', 'hitch'].includes(replayId))
      reproduced = true;
    $('result').className = 'test-result ' + (pass ? 'pass' : 'fail');
    $('result').textContent =
      (pass ? 'PASS' : 'FAIL') +
      ' · ' +
      scenario.name +
      ' · Expected pickups: ' +
      scenario.expected +
      '. Observed: ' +
      state.count +
      (mode === 'padded' && pass
        ? '. One passing reproduction is not enough: run regression.'
        : '.');
    $('evidence').open = true;
    $('hitboxes').checked = true;
    showEvidence(state.evidence || state.trace);
    status(scenario.note);
    buttons();
  }
  function advance() {
    if (running) {
      gameModel.replayStep(state, replayId, tick++);
      if (tick === gameModel.replayTicks) finish();
    } else if (!frozen) {
      const collected = state.collected;
      gameModel.step(state, {
        left: held.has('left'),
        right: held.has('right'),
        jump,
        condition: $('condition').value,
      });
      if (!collected && state.collected)
        status('Coin collected. Restart play to compare another condition.');
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
    frozen = true;
    clear();
    replayId = $('scenario').value;
    state = gameModel.replayState(mode, replayId);
    tick = 0;
    accumulator = 0;
    running = true;
    $('matrix').replaceChildren();
    $('result').className = 'test-result';
    $('result').textContent = 'Replaying controlled movement…';
    status(
      'Recorded horizontal crossing: gravity is paused to isolate pickup detection.',
    );
    buttons();
  };
  $('suite').onclick = () => {
    if (running) return;
    const results = gameModel.scenarios.map((item) =>
      gameModel.runCase(mode, item.id),
    );
    const passed = results.filter((item) => item.pass).length;
    $('matrix').replaceChildren(
      ...results.map((item) => {
        const row = document.createElement('tr');
        for (const text of [
          item.name,
          String(item.expected),
          String(item.actual),
          item.pass ? 'PASS' : 'FAIL',
        ]) {
          const cell = document.createElement('td');
          cell.textContent = text;
          row.append(cell);
        }
        row.className = item.pass ? 'case-pass' : 'case-fail';
        return row;
      }),
    );
    const pass = passed === results.length;
    $('result').className = 'test-result ' + (pass ? 'pass' : 'fail');
    $('result').textContent =
      (pass ? 'PASS' : 'FAIL') +
      ' · Regression: ' +
      passed +
      ' / ' +
      results.length +
      (mode === 'padded'
        ? '. Larger bounds hide the fast crossing but miss the hitch and collect the near miss.'
        : mode === 'swept' && pass
          ? '. Path detection passes the same five checks with the original coin bounds.'
          : '. Compare passing normal movement with failing fast and hitch crossings.');
    if (mode === 'padded' && !pass) regressionFailed = true;
    if (mode === 'endpoint' && !pass) reproduced = true;
    if (mode === 'swept' && pass) {
      $('mode').textContent = 'VERIFIED · 5 / 5';
      $('mode').className = 'pill success';
    }
    $('evidence').open = true;
    buttons();
  };
  $('fix').onclick = () => {
    if (running || !reproduced || mode !== 'endpoint') return;
    setMode('padded');
    $('hitboxes').checked = true;
    status(
      'Quick patch: expand pickup bounds by 20px. Retest Fast crossing, then run regression.',
    );
  };
  $('proper-fix').onclick = () => {
    if (running || !regressionFailed || mode !== 'padded') return;
    setMode('swept');
    $('hitboxes').checked = true;
    status(
      'Path fix: intersect the movement segment with the original coin bounds. Run regression to verify.',
    );
  };
  $('restart-play').onclick = () => {
    if (running) return;
    frozen = false;
    clear();
    state = gameModel.create(mode);
    status(
      'Fresh attempt, same detector. Jump onto the platform; compare movement conditions.',
    );
  };
  $('reset').onclick = () => {
    frozen = false;
    running = reproduced = regressionFailed = false;
    tick = accumulator = 0;
    mode = 'endpoint';
    clear();
    state = gameModel.create();
    $('scenario').value = 'fast';
    $('condition').value = 'normal';
    $('mode').textContent = 'ENDPOINT CHECK';
    $('mode').className = 'pill warning';
    $('result').className = 'test-result';
    $('result').textContent =
      'Ready. Compare normal movement with a fast crossing.';
    $('matrix').replaceChildren();
    $('observations').textContent = 'Run a replay to capture the crossing.';
    $('hitboxes').checked = false;
    $('evidence').open = false;
    status(
      'Jump onto the platform. Normal movement works; fast crossings can skip the coin.',
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
      const trace = state.evidence || state.trace;
      if (trace) {
        ctx.strokeStyle = '#667d91';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(trace.from.x, trace.from.y, state.w, state.h);
        ctx.strokeRect(trace.to.x, trace.to.y, state.w, state.h);
        ctx.beginPath();
        ctx.moveTo(trace.from.x + 12, trace.from.y + 20);
        ctx.lineTo(trace.to.x + 12, trace.to.y + 20);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#536b80';
        ctx.fillText('PREVIOUS → CURRENT', 265, 120);
      }
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
