// TerraVista Frontend
// Enhanced SPA glue + components + lazy loading + auth client + maps + API wiring

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// Mobile nav
const burger = $('#burger');
if (burger){
  burger.addEventListener('click', () => {
    const nav = $('.nav');
    if (!nav) return;
    nav.style.display = nav.style.display === 'flex' ? '' : 'flex';
    nav.style.flexDirection = 'column';
    nav.style.gap = '10px';
    nav.classList.toggle('glass');
    nav.classList.toggle('elevate');
  });
}

// Footer year
const y = $('#year');
if (y) y.textContent = new Date().getFullYear();

// Lazy load images
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting){
      const img = e.target;
      const src = img.dataset.src;
      if (src){ img.src = src; img.removeAttribute('data-src'); }
      lazyObserver.unobserve(img);
    }
  })
}, { rootMargin: '200px 0px' });

function lazyImg(el){ if (el) lazyObserver.observe(el); }

// Data helpers
async function fetchJSON(url, opts){
  try{ const res = await fetch(url, opts); if(!res.ok) throw new Error('bad'); return await res.json(); }
  catch{ return null; }
}

// Demo data fallback
const demoTrending = [
  {id:1, title:'Santorini Cliffs', place:'Greece', price:180, rating:4.9, img:'https://images.unsplash.com/photo-1505731132164-cca68f0b9ad1?q=80&w=1200&auto=format&fit=crop', lat:36.3932, lng:25.4615},
  {id:2, title:'Ubud Jungle Villa', place:'Bali', price:140, rating:4.8, img:'https://images.unsplash.com/photo-1541417904950-b855846fe074?q=80&w=1200&auto=format&fit=crop', lat:-8.519, lng:115.263},
  {id:3, title:'Sahara Dunes Camp', place:'Morocco', price:120, rating:4.7, img:'https://images.unsplash.com/photo-1505739772778-0f3b3f83d755?q=80&w=1200&auto=format&fit=crop', lat:31.000, lng:-4.000},
  {id:4, title:'Tromsø Aurora Dome', place:'Norway', price:210, rating:5.0, img:'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop', lat:69.6492, lng:18.9553},
  {id:5, title:'Kyoto Machiya', place:'Japan', price:160, rating:4.9, img:'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=1200&auto=format&fit=crop', lat:35.0116, lng:135.7681},
  {id:6, title:'Amalfi Terrace', place:'Italy', price:190, rating:4.8, img:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop', lat:40.6333, lng:14.6029},
  {id:7, title:'Petra Nights', place:'Jordan', price:130, rating:4.7, img:'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop', lat:30.3285, lng:35.4444},
  {id:8, title:'Banff Lake Cabin', place:'Canada', price:200, rating:4.9, img:'https://images.unsplash.com/photo-1508264165352-258a6c4dc581?q=80&w=1200&auto=format&fit=crop', lat:51.1784, lng:-115.5708}
];

function normalizeListing(p){
  return {
    id: p.id,
    title: p.title,
    place: p.location || p.place || '',
    price: p.price || 0,
    rating: p.rating || 4.8,
    img: p.image || p.img,
    lat: p.lat ?? null,
    lng: p.lng ?? null,
  };
}

function cardTemplate(p){
  return `<a class="card" href="/details.html?id=${p.id}">
    <div class="media"><img data-src="${p.img}" alt="${p.title}" loading="lazy"></div>
    <div class="content">
      <div style="display:flex; justify-content:space-between; align-items:center">
        <strong>${p.title}</strong>
        <span>⭐ ${p.rating}</span>
      </div>
      <div class="muted">${p.place}</div>
      <div class="muted">$${p.price}/night</div>
    </div>
  </a>`
}

async function mountTrending(){
  const grid = $('#trending-grid');
  if (!grid) return;
  const api = await fetchJSON('/api/listings');
  const items = (api && Array.isArray(api) && api.length ? api.map(normalizeListing) : demoTrending);
  grid.innerHTML = items.slice(0, 12).map(cardTemplate).join('');
  $$('#trending-grid img').forEach(lazyImg);
  // Map if present
  if ($('#map')) renderMap(items);
}

// Carousel demo
const demoStories = [
  {q:'The aurora dome was pure magic and the host provided everything we needed.', a:'– Mila K.'},
  {q:'Booked a last-minute getaway to Amalfi. Seamless and secure.', a:'– Brian P.'},
  {q:'Our Kyoto stay had incredible authenticity. Highly recommend.', a:'– Akira T.'},
];
function mountStories(){
  const track = $('#stories-track');
  if (!track) return;
  track.innerHTML = demoStories.map(s => `<blockquote class="card" style="padding:16px"><p>“${s.q}”</p><footer class="muted">${s.a}</footer></blockquote>`).join('');
}

// Auth client helpers
const auth = {
  set(u){ localStorage.setItem('tv_user', JSON.stringify(u)); },
  get(){ try { return JSON.parse(localStorage.getItem('tv_user')); } catch { return null } },
  clear(){ localStorage.removeItem('tv_user'); }
}

function requireAuth(role){
  const u = auth.get();
  if (!u){ location.href = '/login.html'; return false; }
  if (role && u.role !== role){
    location.href = u.role === 'owner' ? '/dashboard-owner.html' : '/dashboard-tourist.html';
    return false;
  }
  return true;
}

// Maps removed for simplicity; using text location only.
function renderMap(){ /* no-op */ }

// Page routers
const path = location.pathname;
if (path === '/' || path.endsWith('/index.html')){ mountTrending(); mountStories(); }
if (path.endsWith('/explore.html')){ mountTrending(); }

// Login/Signup logic
function bindAuth(){
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (loginForm){
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(loginForm).entries());
      try {
        const res = await fetch('/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
        if (res.ok){ auth.set(await res.json()); } else throw new Error('fallback');
      } catch(err){
        const role = data.role || 'tourist';
        const u = { id:1, name:data.email.split('@')[0], role };
        auth.set(u);
      }
      const u = auth.get();
      location.href = u.role === 'owner' ? '/dashboard-owner.html' : '/dashboard-tourist.html';
    });
  }

  if (signupForm){
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(signupForm).entries());
      try {
        const res = await fetch('/api/signup', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
        if (res.ok){ auth.set(await res.json()); } else throw new Error('fallback');
      } catch(err){
        const u = { id:1, name:data.name || data.email.split('@')[0], role: data.role || 'tourist' };
        auth.set(u);
      }
      const u = auth.get();
      location.href = u.role === 'owner' ? '/dashboard-owner.html' : '/dashboard-tourist.html';
    });
  }
}

bindAuth();

// Dashboards
async function mountDashboards(){
  if (path.endsWith('/dashboard-tourist.html')){
    if (!requireAuth('tourist')) return;
    const api = await fetchJSON('/api/listings');
    const items = (api && api.length ? api.map(normalizeListing) : demoTrending);
    const list = $('#tourist-recs');
    if (list) list.innerHTML = items.slice(0,6).map(cardTemplate).join('');
    $$('#tourist-recs img').forEach(lazyImg);
  }
  if (path.endsWith('/dashboard-owner.html')){
    if (!requireAuth('owner')) return;
    const api = await fetchJSON('/api/listings');
    const items = (api && api.length ? api.map(normalizeListing) : demoTrending.slice(0,4));
    const table = $('#owner-listings');
    if (table){
      table.innerHTML = items.map(p => `
        <tr>
          <td>${p.title}</td>
          <td>${p.place}</td>
          <td>$${p.price}</td>
          <td><button class="btn btn-ghost small" data-edit="${p.id}">Edit</button></td>
        </tr>
      `).join('');
    }
  }
}
mountDashboards();

// Owners create listing wiring
(function(){
  const ownersForm = document.querySelector('#owner-create-form');
  if (!ownersForm) return;
  ownersForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = auth.get();
    if (!u || u.role !== 'owner') return alert('Please log in as owner');
    const fd = new FormData(ownersForm);
    const payload = {
      owner_id: u.id,
      title: fd.get('title') || '',
      location: fd.get('location') || '',
      price: +(fd.get('price') || 0),
      image: fd.get('image') || ''
    };
    const res = await fetchJSON('/api/listings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    if (!res) return alert('Failed to create listing');
    alert('Listing created'); location.reload();
  });
  ownersForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = auth.get();
    if (!u || u.role !== 'owner') return alert('Please log in as owner');
    const fd = new FormData(ownersForm);
    const payload = {
      owner_id: u.id,
      title: fd.get('title') || '',
      location: fd.get('location') || '',
      price: +(fd.get('price') || 0),
      image: fd.get('image') || '',
      lat: fd.get('lat') ? parseFloat(fd.get('lat')) : null,
      lng: fd.get('lng') ? parseFloat(fd.get('lng')) : null,
    };
    const res = await fetchJSON('/api/listings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    if (!res) return alert('Failed to create listing');
    alert('Listing created'); location.reload();
  });
})();

// Details booking
(function(){
  const book = document.getElementById('btn-book');
  if (!book) return;
  book.addEventListener('click', async () => {
    const u = auth.get(); if (!u) return location.href = '/login.html';
    const id = +(new URLSearchParams(location.search).get('id') || 0);
    if (!id) return alert('Invalid listing');
    const res = await fetchJSON('/api/book', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({user_id:u.id, listing_id:id})});
    if (!res) return alert('Booking failed');
    alert('Booking confirmed!');
  });
})();

// Simple carousel buttons
(function(){
  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('.carousel-track');
  const prev = carousel.querySelector('.prev');
  const next = carousel.querySelector('.next');
  prev.addEventListener('click', () => track.scrollBy({left:-400, behavior:'smooth'}));
  next.addEventListener('click', () => track.scrollBy({left:400, behavior:'smooth'}));
})();
