// 404 page: forwards the common slips to the right page instead of showing "not found":
//   /berlin-namaz-vakitleri/  (trailing slash)   → /berlin-namaz-vakitleri
//   /berlin, /köln, /Münih                        → the Turkish city page
//   /en/munich, /en/munich-prayer-times/          → the English city page
//   /sehirler, /en/cities                         → the city list
(() => {
  const el = document.getElementById('nf-data');
  if (!el) return;
  const d = JSON.parse(el.textContent);
  let path = location.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    /* keep it encoded */
  }
  if (!path.startsWith(d.base)) return;
  let rest = path.slice(d.base.length).replace(/\/+$/, '').replace(/\.html?$/, '');
  const en = /^en(\/|$)/.test(rest);
  if (en) rest = rest.replace(/^en\/?/, '');
  if (rest.includes('/')) return;
  const key = rest
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-?(namaz-vakitleri|namaz-vakti|prayer-times|prayer-time)$/, '');
  const lang = en ? 1 : 0;
  let to = null;
  if (rest === '') to = en ? d.base : null; // /en alone: the app picks the language itself
  else if (key === '' || key === 'sehirler' || key === 'cities') to = d.index[lang];
  else if (d.routes[key]) to = d.routes[key][lang];
  if (to && to !== location.pathname) location.replace(to + location.search + location.hash);
})();
