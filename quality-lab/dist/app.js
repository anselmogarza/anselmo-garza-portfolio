(() => {
  const $ = (id) => document.getElementById(id);
  let fixed = false, busy = false, investigated = false, generation = 0;
  const tabs = [...document.querySelectorAll('[role=tab]')];
  function selectTab(tab) {
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      $(item.dataset.panel).hidden = !active;
    });
    if (tab.dataset.panel !== 'results' && investigated && !fixed) setStep(1);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next]); tabs[next].focus(); }
    });
  });
  function setStep(index) { document.querySelectorAll('#steps li').forEach((step, i) => step.classList.toggle('active', i === index)); }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function run() {
    if (busy) return;
    busy = true;
    const current = generation;
    const isFixed = fixed;
    $('run').disabled = true; $('fix').disabled = true;
    selectTab(tabs[0]);
    $('save-state').textContent = 'Saving order…';
    $('result-output').innerHTML = '<span class="label">RUNNING CHECK</span><h3>Observing the save sequence…</h3><p>Checking persisted state when success is reported.</p>';
    const events = [];
    const start = performance.now();
    let persisted = false;
    const event = (message) => events.push({ ms: Math.round(performance.now() - start), message });
    event('Save request started');
    const persistence = wait(700).then(() => { persisted = true; event('Order persisted in browser model'); });
    if (isFixed) await persistence;
    event('Success notification emitted');
    const passed = persisted;
    event(`Assertion: persisted order exists → ${passed ? 'PASS' : 'FAIL'}`);
    await persistence;
    if (generation !== current) return;
    investigated = true; busy = false;
    $('run').disabled = false; $('run').textContent = isFixed ? '▶ Rerun verification' : '▶ Rerun failing check';
    $('fix').disabled = isFixed;
    $('save-state').textContent = isFixed ? 'Order saved after persistence' : 'Success was reported before persistence';
    $('result-output').innerHTML = passed
      ? '<span class="pill success">PASS · 1 / 1 CHECK</span><h3>Persistence completed before success.</h3><p>The same assertion now passes. This verifies ordering in the simulation; it does not establish production release readiness.</p>'
      : '<span class="pill warning">FAIL · 1 / 1 CHECK</span><h3>Success notification ≠ persisted order.</h3><p>Expected persisted state: true. Observed at notification: false. Open the event timeline, then “The fix” to correct the ordering.</p>';
    $('timeline-output').replaceChildren(...events.map(({ ms, message }) => {
      const row = document.createElement('div'); row.className = 'timeline-row';
      const time = document.createElement('time'); time.textContent = `+${ms} ms`;
      const text = document.createElement('span'); text.textContent = message;
      row.append(time, text); return row;
    }));
    setStep(isFixed ? 3 : 1);
  }
  $('run').addEventListener('click', run);
  $('fix').addEventListener('click', () => {
    if (!investigated || busy || fixed) return;
    fixed = true; $('mode').textContent = 'FIX APPLIED'; $('mode').className = 'pill success';
    $('fix').disabled = true; $('fix').textContent = '✓ Ordering fix applied';
    $('run').textContent = '▶ Verify the fix'; $('save-state').textContent = 'Fix applied · verification pending';
    $('result-output').innerHTML = '<span class="label">VERIFICATION PENDING</span><h3>The ordering changed. Now verify it.</h3><p>Run the same check against the corrected save sequence.</p>';
    setStep(2);
  });
  $('reset').addEventListener('click', () => {
    generation++; fixed = false; busy = false; investigated = false;
    $('mode').textContent = 'BUG PRESENT'; $('mode').className = 'pill warning';
    $('run').disabled = false; $('run').textContent = '▶ Run save check';
    $('fix').disabled = true; $('fix').textContent = 'Apply ordering fix';
    $('save-state').textContent = 'Ready to reproduce';
    $('result-output').innerHTML = '<span class="label">AWAITING EXECUTION</span><h3>Does “saved” mean persisted?</h3><p>Run the check to inspect the order immediately after the success notification.</p>';
    $('timeline-output').textContent = 'Run the check to capture the event sequence.';
    selectTab(tabs[0]); setStep(0);
  });
})();
