// City pages: keeps today's times, the states (Done/Now/Next) and the countdown live, using the page's own
// timetable (no calculation code needed). Times are local "HH:mm" in the city's time zone.
(() => {
  const el = document.getElementById('cp-data');
  if (!el) return;
  const d = JSON.parse(el.textContent);
  const parts = (at) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('en-US-u-nu-latn', { timeZone: d.tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(at)
        .map((p) => [p.type, p.value]),
    );
  const mins = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const duration = (m) => {
    if (m < 1) return d.units.less;
    const h = Math.floor(m / 60);
    return h ? `${h} ${d.units.h} ${m % 60} ${d.units.min}` : `${m} ${d.units.min}`;
  };

  function update() {
    const p = parts(Date.now());
    const today = `${p.year}-${p.month}-${p.day}`;
    const idx = d.days.findIndex((r) => r[0] === today);
    if (idx < 0) return; // page older than its timetable: keep the printed times
    const nowAbs = idx * 1440 + Number(p.hour) * 60 + Number(p.minute);
    // Every event of today and the following days as an absolute minute count.
    const events = [];
    for (let i = idx - 1; i < Math.min(d.days.length, idx + 2); i++) {
      if (i < 0) continue;
      d.days[i].slice(1).forEach((t, k) => t.includes(':') && events.push({ k, day: i, abs: i * 1440 + mins(t), t }));
    }
    const next = events.find((e) => e.abs > nowAbs);
    const past = events.filter((e) => e.abs <= nowAbs).pop();
    const current = past && past.k !== 1 ? past : null; // no prayer is running between sunrise and Dhuhr

    // the six boxes: today's times and their states
    const row = d.days[idx].slice(1);
    document.querySelectorAll('#six .c').forEach((c) => {
      const k = Number(c.dataset.i);
      const abs = idx * 1440 + mins(row[k]);
      const state = current && current.day === idx && current.k === k ? 'now' : next && next.day === idx && next.k === k ? 'next' : abs <= nowAbs ? 'done' : '';
      c.className = `c ${state}`;
      c.querySelector('b').textContent = row[k];
      c.querySelector('em').textContent = state ? d.states[state] : '';
    });

    // countdown card
    if (next) {
      document.getElementById('now-label').textContent = d.leftUntil[next.k];
      document.getElementById('now-left').textContent = duration(next.abs - nowAbs);
      document.getElementById('now-name').textContent = d.prayers[next.k];
      document.getElementById('now-time').textContent = next.t;
      document.getElementById('now').hidden = false;
    }

    // today's row in the timetable
    document.querySelectorAll('.month tr.today').forEach((tr) => tr.classList.remove('today'));
    document.querySelectorAll(`.month tr[data-d="${today}"]`).forEach((tr) => tr.classList.add('today'));

    // date line
    const dateEl = document.getElementById('date');
    if (dateEl) {
      const long = new Intl.DateTimeFormat(d.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: d.tz }).format(Date.now());
      let hijri = '';
      try {
        hijri = new Intl.DateTimeFormat(`${d.locale}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: d.tz }).format(Date.now());
      } catch {
        /* calendar not supported */
      }
      dateEl.textContent = hijri ? `${long} · ${hijri}` : long;
    }
  }

  update();
  setInterval(update, 30_000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && update());
})();
