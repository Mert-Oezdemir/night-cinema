'use strict';
const sampleCatalog = [
  { id:'relay', title:'Antenna at Dawn', year:2032, genre:'Science fiction', minutes:98, art:'signal', sky:'#68477b', shape:'#e5e7a4', summary:'A radio caretaker starts receiving weather reports from a town nobody can find.' },
  { id:'fern', title:'Under the Fern Line', year:2027, genre:'Drama', minutes:107, art:'fern', sky:'#355f55', shape:'#c8e78c', summary:'Two siblings follow their late father’s trail markers through a forest reclaiming its roads.' },
  { id:'clock', title:'Five Minutes to Thimble', year:2028, genre:'Comedy', minutes:84, art:'clock', sky:'#82506f', shape:'#ffe09a', summary:'A watch repairer agrees to keep an entire station on time during its busiest afternoon.' },
  { id:'moon', title:'The Moon Takes a Ferry', year:2030, genre:'Science fiction', minutes:113, art:'moon', sky:'#45668a', shape:'#f5dab4', summary:'A retired pilot follows an impossible passenger across a midnight river.' },
  { id:'strip', title:'End Credits for Elise', year:2029, genre:'Drama', minutes:92, art:'filmstrip', sky:'#694752', shape:'#e8bbcf', summary:'An archivist splices together a hometown cinema’s last reel as the building changes hands.' },
  { id:'canal', title:'Somebody Moved the Canal', year:2026, genre:'Comedy', minutes:89, art:'canal', sky:'#3b566b', shape:'#f5aeb7', summary:'A wedding planner and a ferryman disagree about where the town used to end.' },
];
const search = document.querySelector('#search');
const genre = document.querySelector('#genre');
const source = document.querySelector('#source');
const savedOnly = document.querySelector('#saved-only');
const films = document.querySelector('#films');
const resultCount = document.querySelector('#result-count');
const watchCount = document.querySelector('#watch-count');
const previous = document.querySelector('#previous-page');
const next = document.querySelector('#next-page');
const pageInfo = document.querySelector('#page-info');
const serviceStatus = document.querySelector('#service-status');
const watchlist = new Set();
const savedFilms = new Map();
let liveFilms = [];
let currentPage = 1;
let totalPages = 0;
let requestVersion = 0;
let timer;

function validFilm(film) {
  return film && typeof film.id === 'string' && /^tmdb-\d+$/.test(film.id)
    && typeof film.title === 'string' && typeof film.summary === 'string';
}
try {
  const saved = JSON.parse(localStorage.getItem('night-cinema-v1') || '[]');
  if (Array.isArray(saved)) for (const film of sampleCatalog) if (saved.includes(film.id)) watchlist.add(film.id);
  const stored = JSON.parse(localStorage.getItem('night-cinema-live-v1') || '[]');
  if (Array.isArray(stored)) for (const film of stored.filter(validFilm)) {
    watchlist.add(film.id);
    savedFilms.set(film.id, film);
  }
} catch { serviceStatus.textContent = 'Saved films could not be read in this browser.'; }
for (const value of [...new Set(sampleCatalog.map(film => film.genre))].sort()) genre.add(new Option(value));

function render() {
  const live = source.value === 'live';
  const watchlistOnly = savedOnly.getAttribute('aria-pressed') === 'true';
  const catalog = live ? (watchlistOnly ? [...savedFilms.values()] : liveFilms) : sampleCatalog;
  const term = search.value.trim().toLowerCase();
  const shown = catalog.filter(film => {
    const matchesText = live && !watchlistOnly ? true : (film.title + ' ' + film.summary).toLowerCase().includes(term);
    return matchesText && (live || !genre.value || film.genre === genre.value) && (!watchlistOnly || watchlist.has(film.id));
  });
  watchCount.textContent = 'Watchlist (' + watchlist.size + ')';
  genre.disabled = live;
  resultCount.textContent = shown.length ? shown.length + (shown.length === 1 ? ' film found.' : ' films found.')
    : 'No films match. Try clearing a filter.';
  if (watchlistOnly && !shown.length) resultCount.textContent = 'Your watchlist is empty or no saved films match these filters.';
  films.replaceChildren(...shown.map(film => {
    const item = document.createElement('li');
    item.className = 'film';
    const poster = document.createElement('div');
    poster.className = 'poster ' + (live ? 'filmstrip' : film.art);
    poster.style.setProperty('--sky', live ? '#45668a' : film.sky);
    poster.style.setProperty('--shape', live ? '#f5dab4' : film.shape);
    poster.setAttribute('aria-hidden', 'true');
    const title = document.createElement('h2');
    title.textContent = film.title;
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = live ? String(film.year || '') : film.genre + ' / ' + film.year + ' / ' + film.minutes + ' min';
    const summary = document.createElement('p');
    summary.className = 'synopsis';
    summary.textContent = film.summary;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.film = film.id;
    button.setAttribute('aria-label', 'Watchlist for ' + film.title);
    button.setAttribute('aria-pressed', String(watchlist.has(film.id)));
    button.textContent = watchlist.has(film.id) ? 'Saved to watchlist' : 'Add to watchlist';
    item.append(poster, title, meta, summary, button);
    return item;
  }));
  previous.hidden = !live || watchlistOnly || currentPage <= 1;
  next.hidden = !live || watchlistOnly || currentPage >= totalPages;
  pageInfo.textContent = live && !watchlistOnly && totalPages ? 'Page ' + currentPage + ' of ' + totalPages : '';
  document.querySelector('#tmdb-attribution').hidden = !live;
}

async function loadLive() {
  const version = ++requestVersion;
  if (source.value !== 'live' || savedOnly.getAttribute('aria-pressed') === 'true') { render(); return; }
  if (!/^https?:$/.test(location.protocol)) {
    serviceStatus.textContent = 'Run npm start and configure TMDB_API_TOKEN to search live films.';
    liveFilms = [];
    render();
    return;
  }
  serviceStatus.textContent = 'Loading films from TMDB.';
  previous.disabled = next.disabled = true;
  try {
    const query = new URLSearchParams({ query: search.value.trim(), page: String(currentPage) });
    const response = await fetch('api/movies?' + query);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The movie request failed.');
    if (version !== requestVersion) return;
    liveFilms = result.films;
    totalPages = result.totalPages;
    serviceStatus.textContent = result.totalResults + ' results from TMDB.';
  } catch (error) {
    if (version !== requestVersion) return;
    liveFilms = [];
    totalPages = 0;
    serviceStatus.textContent = error.message;
  } finally {
    if (version === requestVersion) { previous.disabled = next.disabled = false; render(); }
  }
}

search.addEventListener('input', () => {
  currentPage = 1;
  requestVersion++;
  clearTimeout(timer);
  if (source.value === 'live') timer = setTimeout(loadLive, 300);
  else render();
});
genre.addEventListener('change', render);
source.addEventListener('change', () => {
  clearTimeout(timer);
  currentPage = 1;
  serviceStatus.textContent = '';
  loadLive();
});
savedOnly.addEventListener('click', () => {
  savedOnly.setAttribute('aria-pressed', String(savedOnly.getAttribute('aria-pressed') !== 'true'));
  requestVersion++;
  if (source.value === 'live' && savedOnly.getAttribute('aria-pressed') !== 'true') loadLive();
  else render();
});
previous.addEventListener('click', () => { currentPage--; loadLive(); });
next.addEventListener('click', () => { currentPage++; loadLive(); });
films.addEventListener('click', event => {
  const button = event.target.closest('button[data-film]');
  if (!button) return;
  const id = button.dataset.film;
  if (watchlist.delete(id)) savedFilms.delete(id);
  else {
    watchlist.add(id);
    const film = liveFilms.find(film => film.id === id);
    if (film) savedFilms.set(id, film);
  }
  try {
    localStorage.setItem('night-cinema-v1', JSON.stringify([...watchlist].filter(id => !id.startsWith('tmdb-'))));
    localStorage.setItem('night-cinema-live-v1', JSON.stringify([...savedFilms.values()]));
  } catch { serviceStatus.textContent = 'Browser storage is unavailable. Keep this tab open to retain the watchlist.'; }
  render();
  const nextButton = [...films.querySelectorAll('button')].find(button => button.dataset.film === id) || savedOnly;
  nextButton.focus({ preventScroll: true });
});
render();
