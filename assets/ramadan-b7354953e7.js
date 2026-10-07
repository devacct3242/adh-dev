// Ramadan pages: switches the header between "before Ramadan" (countdown in days), "during" (time to the end of
// suhoor, time to iftar, tomorrow's suhoor after iftar) and Eid, marks today's row, and prints the page.
// Everything else is static HTML. Times are local "HH:mm" in the city's time zone.
(() => {
  const el = document.getElementById('rp-data');
  if (!el) return;
  const d = JSON.parse(el.textContent);
  const x = d.txt;
  const $ = (id) => document.getElementById(id);
  const fill = (s, a = '', b = '') => s.replace('{a}', a).replace('{b}', b);
  const parts = (at) =>
    Object.fromEntries(
      new Intl.DateTimeFormat('en-US-u-nu-latn', { timeZone: d.tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(at)
        .map((p) => [p.type, p.value]),
    );
  const mins = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  const utc = (ymd) => Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)));
  const duration = (m) => {
    if (m < 1) return x.units.less;
    const h = Math.floor(m / 60);
    return h ? `${h} ${x.units.h} ${m % 60} ${x.units.min}` : `${m} ${x.units.min}`;
  };
  const dayLong = (ymd) => new Intl.DateTimeFormat(d.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(utc(ymd));

  function setPair(a, b) {
    const pair = $('r-pair');
    if (!a) {
      pair.hidden = true;
      return;
    }
    pair.hidden = false;
    for (const [id, [label, time, on]] of [['r-a', a], ['r-b', b]]) {
      const box = $(id);
      box.querySelector('small').textContent = label;
      box.querySelector('b').textContent = time;
      box.className = on ? 'on' : '';
    }
  }
  const setText = (id, html) => {
    const node = $(id);
    node.innerHTML = html; // only our own strings from rp-data, never user input
    node.hidden = !html;
  };

  function update() {
    const p = parts(Date.now());
    const today = `${p.year}-${p.month}-${p.day}`;
    const now = Number(p.hour) * 60 + Number(p.minute);
    const idx = d.days.findIndex((r) => r[0] === today);
    let progress = 0;

    if (today < d.start) {
      const left = Math.round((utc(d.start) - utc(today)) / 864e5);
      setText('r-big', left === 1 ? x.tomorrow : fill(x.daysTo, left));
    } else if (idx >= 0 && idx < d.n) {
      const row = d.days[idx];
      const next = d.days[idx + 1];
      const fajr = mins(row[1]);
      const maghrib = mins(row[5]);
      progress = idx + 1;
      setText('r-kicker', fill(x.dayN, idx + 1, dayLong(today)));
      if (now < fajr) {
        setText('r-big', fill(x.toSuhoor, duration(fajr - now)));
        setPair([x.suhoorEnds, row[1], true], [x.iftar, row[5]]);
        setText('r-sub', '');
      } else if (now < maghrib) {
        setText('r-big', fill(x.toIftar, duration(maghrib - now)));
        setPair([x.suhoorEnded, row[1]], [x.iftar, row[5], true]);
        setText('r-sub', idx < d.n - 1 ? fill(x.tomorrowSuhoor, next[1]) : '');
      } else if (idx === d.n - 1) {
        setText('r-big', x.eidTomorrow);
        setPair(null);
        setText('r-sub', '');
      } else {
        setText('r-big', fill(x.tonight, next[1]));
        setPair([x.tmrSuhoor, next[1], true], [x.tmrIftar, next[5]]);
        setText('r-sub', '');
      }
    } else if (idx === d.n) {
      setText('r-kicker', dayLong(today));
      setText('r-big', x.eidToday);
      setPair(null);
      setText('r-sub', fill(x.eidSub, d.days[d.n][2]));
    } else if (today > d.eid) {
      setText('r-big', fill(x.over, d.next));
      setPair(null);
      setText('r-sub', '');
    }

    const bar = $('r-prog');
    bar.hidden = !progress;
    bar.firstElementChild.style.width = `${Math.round((progress / d.n) * 100)}%`;
    setText('r-progl', progress ? fill(x.progress, progress, d.n) : '');

    document.querySelectorAll('.month tr.today').forEach((tr) => tr.classList.remove('today'));
    document.querySelectorAll(`.month tr[data-d="${today}"]`).forEach((tr) => tr.classList.add('today'));
  }

  $('r-print')?.addEventListener('click', () => window.print());
  update();
  setInterval(update, 30_000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && update());
})();
