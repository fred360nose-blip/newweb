const mainContent = document.getElementById('main-row');
const searchInput = document.getElementById('searchInput');
const hero = document.getElementById('hero');
const continueSection = document.getElementById('continue-section');
const continueRow = document.getElementById('continue-row');

const API_KEY = "731a747b7083a0bdd240c0a658431e7f";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

let continueWatching = JSON.parse(localStorage.getItem('continueWatching')) || [];

// Save progress
function saveProgress(item, progress = 65) {
  const existing = continueWatching.findIndex(i => i.id === item.id);
  if (existing !== -1) continueWatching.splice(existing, 1);
  
  continueWatching.unshift({...item, progress, timestamp: Date.now()});
  if (continueWatching.length > 12) continueWatching.pop();
  
  localStorage.setItem('continueWatching', JSON.stringify(continueWatching));
  renderContinueWatching();
}

// Render Continue Watching
function renderContinueWatching() {
  continueRow.innerHTML = '';
  if (continueWatching.length === 0) {
    continueSection.classList.add('hidden');
    return;
  }
  
  continueSection.classList.remove('hidden');
  continueWatching.forEach(item => {
    const card = createCard(item, true);
    continueRow.appendChild(card);
  });
}

// Create Card
function createCard(item, isContinue = false) {
  const card = document.createElement('div');
  card.className = 'card';
  
  const progressHTML = isContinue ? `
    <div class="progress-bar">
      <div class="progress" style="width: ${item.progress || 65}%"></div>
    </div>` : '';

  card.innerHTML = `
    <div class="poster-container">
      <img src="${IMAGE_BASE}${item.poster_path || ''}" 
           alt="${item.title || item.name}" 
           onerror="this.src='https://via.placeholder.com/210x315/1f1f1f/666?text=${encodeURIComponent(item.title || item.name)}'">
      ${progressHTML}
    </div>
    <div class="card-info">
      <h3>${item.title || item.name}</h3>
    </div>
  `;

  card.addEventListener('click', () => {
    saveProgress(item);
    const title = encodeURIComponent(item.title || item.name);
    const type = item.type || (item.media_type === 'tv' ? 'tv' : 'movie');
    let url = `player.html?title=${title}&id=${item.id}&type=${type}`;
    if (type === 'tv') url += "&season=1&episode=1";
    window.location.href = url;
  });

  return card;
}

// Hero Banner
async function setHero(item) {
  hero.style.backgroundImage = `url('${BACKDROP_BASE}${item.backdrop_path}')`;
  document.getElementById('hero-title').textContent = item.title || item.name;
  document.getElementById('hero-overview').textContent = (item.overview || '').substring(0, 180) + '...';
  
  // Save featured for play button
  window.featuredItem = item;
}

// Play featured
function playFeatured() {
  if (window.featuredItem) {
    saveProgress(window.featuredItem);
    const item = window.featuredItem;
    const title = encodeURIComponent(item.title || item.name);
    const type = item.type || (item.media_type === 'tv' ? 'tv' : 'movie');
    let url = `player.html?title=${title}&id=${item.id}&type=${type}`;
    if (type === 'tv') url += "&season=1&episode=1";
    window.location.href = url;
  }
}

function addToMyList() {
  alert("Added to My List! (Demo)");
}

// Search
async function searchTMDB(query) {
  if (!query || query.length < 2) return [];
  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`),
      fetch(`https://api.themoviedb.org/3/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`)
    ]);
    const movies = await movieRes.json();
    const tvs = await tvRes.json();

    return [
      ...movies.results.map(m => ({...m, type: 'movie'})),
      ...tvs.results.map(t => ({...t, type: 'tv'}))
    ].slice(0, 20);
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function renderSearch(query) {
  document.getElementById('section-title').textContent = `Results for "${query}"`;
  mainContent.innerHTML = '';
  const results = await searchTMDB(query);
  results.forEach(item => mainContent.appendChild(createCard(item)));
}

async function loadInitialContent() {
  document.getElementById('section-title').textContent = 'Trending Now';
  mainContent.innerHTML = '';
  
  const popularItems = [
    {title: "The Boys", id: 76479, type: "tv"},
    {title: "House of the Dragon", id: 94997, type: "tv"},
    {title: "Arcane", id: 94605, type: "tv"},
    {title: "Dune: Part Two", id: 693134, type: "movie"},
    {title: "Deadpool & Wolverine", id: 533535, type: "movie"},
  ];

  for (let item of popularItems) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/${item.type}/${item.id}?api_key=${API_KEY}`);
      const data = await res.json();
      Object.assign(item, data);
      if (data.backdrop_path) setHero(data); // Set first one as hero
      mainContent.appendChild(createCard(item));
    } catch (e) {}
  }
  
  renderContinueWatching();
}

// Event Listeners
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query.length >= 2) {
    await renderSearch(query);
  } else {
    loadInitialContent();
  }
});

// Init
loadInitialContent();
