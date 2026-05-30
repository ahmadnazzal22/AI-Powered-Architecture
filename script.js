let allTools = [];
let allCategories = [];
let currentLang = 'en';
let currentCategory = 'all';
let currentPricing = 'all';
let searchQuery = '';

async function init() {
  const res = await fetch('data/tools.json');
  const data = await res.json();
  allTools = data.tools;
  allCategories = data.categories;
  buildCategories();
  updateStats();
  renderFeatured();
  renderTools();
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'ar' : 'en';
  document.body.classList.toggle('ar', currentLang === 'ar');
  document.getElementById('langToggle').textContent = currentLang === 'en' ? '🌐 عربي' : '🌐 English';
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.getAttribute('data-' + currentLang);
  });
  const inp = document.getElementById('searchInput');
  inp.placeholder = inp.getAttribute('data-placeholder-' + currentLang);
  buildCategories();
  renderFeatured();
  renderTools();
}

function t(tool, field) {
  if (currentLang === 'ar' && tool[field + '_ar']) return tool[field + '_ar'];
  return tool[field];
}

function tCat(cat, field) {
  if (currentLang === 'ar' && cat[field + '_ar']) return cat[field + '_ar'];
  return cat[field];
}

function updateStats() {
  document.getElementById('totalCount').textContent = allTools.length;
  document.getElementById('freeCount').textContent = allTools.filter(t => t.pricing === 'free').length;
  document.getElementById('catCount').textContent = allCategories.length - 1;
}

function buildCategories() {
  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';
  allCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (currentCategory === cat.id ? ' active' : '');
    btn.innerHTML = cat.icon + ' ' + tCat(cat, 'name');
    btn.onclick = () => setCategory(btn, cat.id);
    container.appendChild(btn);
  });
}

function setCategory(el, catId) {
  currentCategory = catId;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTools();
  renderFeatured();
}

function setPricing(el, price) {
  currentPricing = price;
  document.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderTools();
  renderFeatured();
}

function filterTools() {
  searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
  document.getElementById('searchClear').classList.toggle('show', searchQuery.length > 0);
  renderTools();
  renderFeatured();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  searchQuery = '';
  document.getElementById('searchClear').classList.remove('show');
  renderTools();
  renderFeatured();
}

function getFilteredTools() {
  return allTools.filter(tool => {
    const matchCat = currentCategory === 'all' || tool.category === currentCategory;
    const matchPrice = currentPricing === 'all' || tool.pricing === currentPricing;
    const matchSearch = !searchQuery ||
      tool.name.toLowerCase().includes(searchQuery) ||
      tool.description.toLowerCase().includes(searchQuery) ||
      (tool.name_ar && tool.name_ar.includes(searchQuery)) ||
      (tool.description_ar && tool.description_ar.includes(searchQuery)) ||
      tool.tags.some(tag => tag.includes(searchQuery));
    return matchCat && matchPrice && matchSearch;
  });
}

function renderFeatured() {
  const section = document.getElementById('featuredSection');
  if (currentCategory !== 'all' || searchQuery || currentPricing !== 'all') {
    section.style.display = 'none'; return;
  }
  section.style.display = 'block';
  document.getElementById('featuredGrid').innerHTML =
    allTools.filter(t => t.featured).map(tool => createCardHTML(tool, true)).join('');
}

function renderTools() {
  const grid = document.getElementById('toolsGrid');
  const empty = document.getElementById('emptyState');
  const countEl = document.getElementById('resultsCount');
  const filtered = getFilteredTools();
  const titleEl = document.getElementById('toolsSectionTitle');

  if (currentCategory === 'all') {
    titleEl.textContent = currentLang === 'ar' ? 'جميع أدوات AI' : 'All AI Tools';
  } else {
    const cat = allCategories.find(c => c.id === currentCategory);
    if (cat) titleEl.textContent = cat.icon + ' ' + tCat(cat, 'name');
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    countEl.textContent = '';
    return;
  }
  empty.style.display = 'none';
  countEl.textContent = filtered.length + (currentLang === 'ar' ? ' أداة' : ' tools');
  grid.innerHTML = filtered.map((tool, i) => createCardHTML(tool, false, i)).join('');
}

function createCardHTML(tool, isFeatured = false, index = 0) {
  const delay = Math.min(index * 0.04, 0.4);
  const pricingBadge = {
    free: '<span class="badge badge-free">' + (currentLang === 'ar' ? 'مجاني' : 'Free') + '</span>',
    freemium: '<span class="badge badge-freemium">' + (currentLang === 'ar' ? 'مجاني جزئي' : 'Freemium') + '</span>',
    paid: '<span class="badge badge-paid">' + (currentLang === 'ar' ? 'مدفوع' : 'Paid') + '</span>'
  }[tool.pricing] || '';
  const featuredBadge = isFeatured ? '<span class="badge badge-featured">' + (currentLang === 'ar' ? 'مميز' : 'Featured') + '</span>' : '';
  const visitText = currentLang === 'ar' ? 'زيارة الموقع ↗' : 'Visit Site ↗';

  return `
    <div class="tool-card${isFeatured ? ' featured-card' : ''}" style="animation-delay:${delay}s" onclick="openModal(${tool.id})">
      <div class="card-top">
        <div class="card-logo">${tool.logo}</div>
        <div class="card-badges">${featuredBadge}${pricingBadge}</div>
      </div>
      <div class="card-name">${t(tool, 'name')}</div>
      <div class="card-desc">${t(tool, 'description')}</div>
      <div class="card-bottom">
        <div class="card-rating">⭐ ${tool.rating}</div>
        <div class="card-price">${tool.price_detail}</div>
      </div>
      <a href="${tool.url}" target="_blank" rel="noopener" class="card-link" onclick="event.stopPropagation()">${visitText}</a>
    </div>`;
}

function openModal(id) {
  const tool = allTools.find(t => t.id === id);
  if (!tool) return;
  const pricingLabels = {
    free: currentLang === 'ar' ? 'مجاني' : 'Free',
    freemium: currentLang === 'ar' ? 'مجاني جزئي' : 'Freemium',
    paid: currentLang === 'ar' ? 'مدفوع' : 'Paid'
  };
  const pricingColors = { free: 'badge-free', freemium: 'badge-freemium', paid: 'badge-paid' };
  const visitText = currentLang === 'ar' ? '🚀 زيارة الموقع' : '🚀 Visit Website';
  const tags = tool.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('');

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-logo">${tool.logo}</div>
    <div class="modal-name">${t(tool, 'name')}</div>
    <div class="modal-meta">
      <span class="badge ${pricingColors[tool.pricing]}">${pricingLabels[tool.pricing]}</span>
      ${tool.featured ? '<span class="badge badge-featured">' + (currentLang === 'ar' ? 'مميز' : 'Featured') + '</span>' : ''}
      <span class="modal-rating-big">⭐ ${tool.rating}</span>
    </div>
    <div class="modal-desc">${t(tool, 'description')}</div>
    <div class="modal-tags">${tags}</div>
    <a href="${tool.url}" target="_blank" rel="noopener" class="modal-link">${visitText}</a>
    <div class="modal-price-detail">${tool.price_detail}</div>`;

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

init();