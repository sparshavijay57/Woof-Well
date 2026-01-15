/* main.js — minimal UI logic for WoofWell frontend MVP
   - localStorage-based profile (UI-only)
   - login/signup redirect handling
   - dashboard/profile population
   - mood selector
   - tracker progress & points
   - food recommendation demo logic
   - vaccination list (UI-only)
*/

/* Utility: safely parse JSON from localStorage */
function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('Failed to parse JSON', e);
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- SIGNUP (store profile) ---------- */
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // collect fields
    const profile = {
      email: document.getElementById('suEmail').value,
      // Note: password is stored only for UI flow (not secure) — this is a demo.
      password: document.getElementById('suPassword').value,
      dog: {
        name: document.getElementById('dogName').value,
        age: document.getElementById('dogAge').value,
        breed: document.getElementById('dogBreed').value,
        size: document.getElementById('dogSize').value
      }
    };
    writeJSON('woofwell_profile', profile);
    // redirect to dashboard
    window.location.href = 'dashboard.html';
  });
}

/* ---------- LOGIN (UI-only) ---------- */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Simple UI-only login: accept any email/password and go to dashboard.
    // If a profile exists, we'll use it on dashboard/profile pages.
    // For demo: store a 'loggedIn' flag.
    const email = document.getElementById('liEmail').value;
    writeJSON('woofwell_last_email', { email, when: Date.now() });
    window.location.href = 'dashboard.html';
  });
}

/* ---------- DASHBOARD population & mood ---------- */
(function populateDashboard() {
  const dashName = document.getElementById('dashDogName');
  const dashDetails = document.getElementById('dashDogDetails');
  const welcomeMsg = document.getElementById('welcomeMsg');
  const todayDate = document.getElementById('todayDate');
  if (todayDate) {
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    todayDate.textContent = new Date().toLocaleDateString(undefined, opts);
  }

  const profile = readJSON('woofwell_profile', null);
  if (profile && dashName && dashDetails) {
    dashName.textContent = profile.dog?.name || 'Your dog';
    const parts = [
      profile.dog?.age || '—',
      profile.dog?.breed || '—',
      profile.dog?.size || '—'
    ];
    dashDetails.textContent = parts.join(' • ');
    welcomeMsg.textContent = `Welcome, ${profile.dog?.name || 'friend'}`;
  }
})();

/* Mood selector */
const moodButtons = document.querySelectorAll('.mood-btn');
if (moodButtons) {
  moodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      moodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Save mood to localStorage (UI-only)
      writeJSON('woofwell_mood', { mood: btn.dataset.mood, at: Date.now() });
    });
  });
}

/* ---------- PROFILE page populate ---------- */
(function populateProfile() {
  const profileName = document.getElementById('profileName');
  const profileAge = document.getElementById('profileAge');
  const profileBreed = document.getElementById('profileBreed');
  const profileSize = document.getElementById('profileSize');
  const favActivity = document.getElementById('favActivity');

  const profile = readJSON('woofwell_profile', null);
  if (profile && profileName) {
    profileName.textContent = profile.dog?.name || '—';
    profileAge.textContent = `Age: ${profile.dog?.age || '—'}`;
    profileBreed.textContent = `Breed: ${profile.dog?.breed || '—'}`;
    profileSize.textContent = `Size: ${profile.dog?.size || '—'}`;
    favActivity.textContent = profile.dog?.favourite || 'Fetch and long cuddles';
  }
})();

/* ---------- TRACKER: checkboxes, progress, points ---------- */
(function trackerLogic() {
  const checkIds = ['taskWalk', 'taskPlay', 'taskFood', 'taskWater', 'taskGroom'];
  const form = document.getElementById('trackerForm');
  if (!form) return;

  const progressBar = document.getElementById('trackerProgress');
  const pointsCount = document.getElementById('pointsCount');
  const resetBtn = document.getElementById('resetTracker');

  // Load saved state
  const saved = readJSON('woofwell_tracker', {});
  checkIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = !!saved[id];
    el.addEventListener('change', update);
  });

  if (resetBtn) resetBtn.addEventListener('click', () => {
    checkIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    writeJSON('woofwell_tracker', {});
    update();
  });

  function update() {
    const states = {};
    let completed = 0;
    checkIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      states[id] = el.checked;
      if (el.checked) completed++;
    });
    writeJSON('woofwell_tracker', states);
    const percent = Math.round((completed / checkIds.length) * 100);
    if (progressBar) progressBar.style.width = percent + '%';
    if (pointsCount) pointsCount.textContent = (completed * 10).toString(); // 10 points per item (visual)
  }

  // initial update
  update();
})();

/* ---------- FOOD recommendations (simple rules) ---------- */
(function foodLogic() {
  const btn = document.getElementById('getFood');
  const results = document.getElementById('foodResults');
  if (!btn || !results) return;

  btn.addEventListener('click', () => {
    const age = document.getElementById('foodAge').value;
    const size = document.getElementById('foodSize').value;
    const health = document.getElementById('foodHealth').value;

    // Basic demonstration rules (no AI, no medical claims)
    const cards = [];

    // Home food suggestion
    const home = {
      title: 'Home-friendly option',
      desc: (age === 'puppy') ? 'High-protein, soft foods: cooked chicken, rice, pumpkin.' : 'Lean proteins with cooked veggies and rice.',
      price: 'Cost: Low',
      ingredients: 'Protein, boiled rice, pumpkin, carrots'
    };
    cards.push(home);

    // Packaged food suggestion
    const pkg = {
      title: 'Packaged kibble (brand examples)',
      desc: (size === 'small') ? 'Small-breed kibble that is easier to chew.' : 'Balanced adult formula for energy & digestion.',
      price: (health === 'sensitive') ? 'Price: Medium (sensitive formula)' : 'Price: Medium',
      ingredients: 'Balanced protein, fiber, essential vitamins'
    };
    cards.push(pkg);

    // Price/pantry option
    const budget = {
      title: 'Budget-friendly tip',
      desc: 'Mix premium kibble with home-cooked additions to boost nutrients.',
      price: 'Price: Low–Medium',
      ingredients: 'Kibble + boiled protein'
    };
    cards.push(budget);

    // Small health note
    if (health === 'sensitive') {
      cards.push({
        title: 'Sensitive stomach options',
        desc: 'Limited-ingredient diets and novel proteins may help. Introduce changes slowly.',
        price: 'Price: Medium',
        ingredients: 'Single-protein, rice/oat base'
      });
    }

    // Render cards
    results.innerHTML = '';
    cards.forEach(c => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6';
      col.innerHTML = `
        <div class="card soft-card p-3">
          <h6>${c.title}</h6>
          <p class="small text-muted mb-1">${c.desc}</p>
          <div class="small text-muted"> ${c.price} • Ingredients: ${c.ingredients}</div>
        </div>
      `;
      results.appendChild(col);
    });

    // small friendly reminder
    const note = document.createElement('div');
    note.className = 'col-12';
    note.innerHTML = `<div class="small text-muted mt-2">This is a general UI suggestion only. Consult a veterinarian for medical or diet advice.</div>`;
    results.appendChild(note);
  });
})();

/* ---------- VACCINATION list (UI-only sample) ---------- */
(function vaxLogic() {
  const vaxListEl = document.getElementById('vaxList');
  const addBtn = document.getElementById('addVax');
  if (!vaxListEl) return;

  // default sample entries
  const defaults = [
    { name: 'Rabies', given: '2024-04-12', next: '2025-04-12' },
    { name: 'DHPP', given: '2023-10-01', next: '2024-10-01' }
  ];
  const stored = readJSON('woofwell_vax', defaults);
  writeJSON('woofwell_vax', stored);

  function render() {
    const list = readJSON('woofwell_vax', defaults);
    vaxListEl.innerHTML = '';
    list.forEach((v, idx) => {
      const dueSoon = new Date(v.next) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // due within 30 days
      const status = (new Date(v.next) < new Date()) ? 'Completed (overdue?)' : (dueSoon ? 'Upcoming' : 'Completed');
      const col = document.createElement('div');
      col.className = 'col-12';
      col.innerHTML = `
        <div class="card p-3 mb-1">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>${v.name}</strong>
              <div class="small text-muted">Given: ${v.given} • Next: ${v.next}</div>
            </div>
            <div class="text-end">
              <span class="badge ${status.startsWith('Upcoming') ? 'bg-warning' : 'bg-success'}">${status}</span>
              <div class="mt-2">
                <button data-idx="${idx}" class="btn btn-sm btn-outline-danger remove-vax">Remove</button>
              </div>
            </div>
          </div>
        </div>
      `;
      vaxListEl.appendChild(col);
    });

    // attach remove handlers
    document.querySelectorAll('.remove-vax').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.idx);
        const list = readJSON('woofwell_vax', defaults);
        list.splice(idx, 1);
        writeJSON('woofwell_vax', list);
        render();
      });
    });
  }

  render();

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = document.getElementById('vaxName').value || 'Unnamed';
      const given = document.getElementById('vaxGiven').value || new Date().toISOString().slice(0,10);
      const next = document.getElementById('vaxNext').value || '';
      const list = readJSON('woofwell_vax', defaults);
      list.unshift({ name, given, next });
      writeJSON('woofwell_vax', list);
      // clear inputs
      document.getElementById('vaxName').value = '';
      document.getElementById('vaxGiven').value = '';
      document.getElementById('vaxNext').value = '';
      render();
    });
  }
})();

/* ---------- small startup helpers ---------- */
/* Save a little demo profile if none exists (optional starter data) */
(function maybeSeedProfile() {
  const p = readJSON('woofwell_profile', null);
  if (!p) {
    const demo = {
      email: '',
      password: '',
      dog: {
        name: 'Bella',
        age: '3 years',
        breed: 'Golden Retriever',
        size: 'medium',
        favourite: 'Playing fetch'
      }
    };
    // Do NOT overwrite if user has already set something.
    writeJSON('woofwell_profile', demo);
  }
})();