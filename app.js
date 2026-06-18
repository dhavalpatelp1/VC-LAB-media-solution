const STORAGE_KEY = 'vc_lab_media_state_v1';

function seed() {
  return {
    theme: 'light',
    benchMode: false,
    recipes: [
      {
        id: crypto.randomUUID(),
        name: 'LB Broth (1X)',
        unit: 'L',
        baseVolume: 1,
        components: [
          { name: 'Tryptone', amount: 10, unit: 'g' },
          { name: 'Yeast Extract', amount: 5, unit: 'g' },
          { name: 'NaCl', amount: 10, unit: 'g' }
        ]
      },
      {
        id: crypto.randomUUID(),
        name: 'PBS (1X)',
        unit: 'L',
        baseVolume: 1,
        components: [
          { name: 'NaCl', amount: 8, unit: 'g' },
          { name: 'KCl', amount: 0.2, unit: 'g' },
          { name: 'Na2HPO4', amount: 1.44, unit: 'g' },
          { name: 'KH2PO4', amount: 0.24, unit: 'g' }
        ]
      }
    ]
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('loadState error:', e);
  }
  return seed();
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('saveState error:', e);
  }
}

const state = loadState();
let selectedRecipeId = state.recipes[0]?.id || null;

function fmt(n) {
  return Number.isFinite(n) ? Number(n.toFixed(4)).toString() : '-';
}

function setTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle('dark', theme === 'dark');
  saveState(state);
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="bg-layer">
      <div class="blob" style="width:240px;height:240px;left:5%;top:8%;background:var(--accent)"></div>
      <div class="blob" style="width:280px;height:280px;right:6%;top:18%;background:var(--accent2)"></div>
      <div class="dotgrid"></div>
    </div>

    <header class="header">
      <div class="brand"><span class="beaker-emoji">🧪</span>Venkata Lab media</div>
      <div class="flex items-center gap-12">
        <label class="switch muted">
          <input id="benchMode" type="checkbox" ${state.benchMode ? 'checked' : ''}/> Bench Mode
        </label>
        <div class="theme-dots">
          <button class="theme-dot" data-theme="light" style="background:#f8fafc"></button>
          <button class="theme-dot" data-theme="dark" style="background:#0b1020"></button>
        </div>
      </div>
    </header>

    <main class="container grid" style="gap:16px">
      <section class="row">
        <aside class="card">
          <div class="flex justify-between items-center">
            <h3 style="margin:0">Recipes</h3>
            <button id="newRecipe" class="btn small">+ New</button>
          </div>
          <div id="recipeList" class="grid" style="margin-top:10px"></div>
        </aside>

        <div class="grid" style="gap:16px">
          <section class="card">
            <div class="flex justify-between items-center">
              <h3 style="margin:0">Media Scaler</h3>
              <span class="badge">Auto-scale</span>
            </div>
            <div id="scalerPane" style="margin-top:10px"></div>
          </section>

          <section class="card">
            <h3 style="margin-top:0">Lab Calculators</h3>
            <div class="grid cols-2">
              <div class="list-item">
                <h4 style="margin:0 0 8px">% w/v or v/v</h4>
                <div class="grid cols-2">
                  <input id="pct" class="input" type="number" min="0" step="any" placeholder="%"/>
                  <input id="pctVolume" class="input" type="number" min="0" step="any" placeholder="Volume (mL)"/>
                </div>
                <p class="muted" id="pctResult" style="margin:8px 0 0">Enter values.</p>
              </div>

              <div class="list-item">
                <h4 style="margin:0 0 8px">Molarity</h4>
                <div class="grid cols-3">
                  <input id="mw" class="input" type="number" min="0" step="any" placeholder="MW g/mol"/>
                  <input id="molarity" class="input" type="number" min="0" step="any" placeholder="Molarity (M)"/>
                  <input id="molarityVol" class="input" type="number" min="0" step="any" placeholder="Volume (L)"/>
                </div>
                <p class="muted" id="molarityResult" style="margin:8px 0 0">Enter values.</p>
              </div>

              <div class="list-item" style="grid-column:1 / -1">
                <h4 style="margin:0 0 8px">C1V1 = C2V2</h4>
                <div class="grid cols-4">
                  <input id="c1" class="input" type="number" min="0" step="any" placeholder="C1"/>
                  <input id="v1" class="input" type="number" min="0" step="any" placeholder="V1"/>
                  <input id="c2" class="input" type="number" min="0" step="any" placeholder="C2"/>
                  <input id="v2" class="input" type="number" min="0" step="any" placeholder="V2"/>
                </div>
                <p class="muted" id="dilutionResult" style="margin:8px 0 0">Fill any 3 fields to solve the 4th.</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  `;

  bindStaticEvents();
  renderRecipeList();
  renderScaler();
  bindCalculatorEvents();
  setTheme(state.theme || 'light');
}

function bindStaticEvents() {
  document.querySelectorAll('.theme-dot').forEach((btn) => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });

  document.getElementById('benchMode').addEventListener('change', (e) => {
    state.benchMode = e.target.checked;
    document.body.classList.toggle('dark', state.benchMode || state.theme === 'dark');
    document.querySelectorAll('.card').forEach((c) => c.classList.toggle('neon', state.benchMode));
    saveState(state);
  });

  document.getElementById('newRecipe').addEventListener('click', () => {
    const recipe = {
      id: crypto.randomUUID(),
      name: `New recipe ${state.recipes.length + 1}`,
      unit: 'L',
      baseVolume: 1,
      components: [{ name: 'New component', amount: 1, unit: 'g' }]
    };
    state.recipes.push(recipe);
    selectedRecipeId = recipe.id;
    saveState(state);
    renderRecipeList();
    renderScaler();
  });
}

function renderRecipeList() {
  const container = document.getElementById('recipeList');
  container.innerHTML = '';
  state.recipes.forEach((recipe) => {
    const row = document.createElement('button');
    row.className = 'btn outline';
    row.style.textAlign = 'left';
    row.textContent = recipe.name;
    if (recipe.id === selectedRecipeId) row.style.borderColor = 'var(--accent)';
    row.addEventListener('click', () => {
      selectedRecipeId = recipe.id;
      renderRecipeList();
      renderScaler();
    });
    container.appendChild(row);
  });
}

function renderScaler() {
  const recipe = state.recipes.find((r) => r.id === selectedRecipeId);
  const pane = document.getElementById('scalerPane');
  if (!recipe) {
    pane.innerHTML = '<p class="muted">No recipe available.</p>';
    return;
  }

  pane.innerHTML = `
    <div class="grid cols-3">
      <input id="recipeName" class="input" value="${recipe.name}" />
      <input id="baseVolume" class="input" type="number" min="0.0001" step="any" value="${recipe.baseVolume}" />
      <select id="volumeUnit"><option ${recipe.unit === 'L' ? 'selected' : ''}>L</option><option ${recipe.unit === 'mL' ? 'selected' : ''}>mL</option></select>
    </div>
    <div class="grid cols-2" style="margin-top:10px">
      <input id="targetVolume" class="input" type="number" min="0.0001" step="any" value="${recipe.baseVolume}" />
      <div class="muted">Target volume</div>
    </div>
    <div id="components" class="grid" style="margin-top:10px"></div>
    <div class="flex gap-8" style="margin-top:10px">
      <button id="addComponent" class="btn small">+ Component</button>
      <button id="deleteRecipe" class="btn small outline">Delete recipe</button>
    </div>
  `;

  const renderComponents = () => {
    const target = Number(document.getElementById('targetVolume').value || recipe.baseVolume);
    const factor = target / Number(recipe.baseVolume || 1);
    const holder = document.getElementById('components');
    holder.innerHTML = '';

    recipe.components.forEach((c, idx) => {
      const row = document.createElement('div');
      row.className = 'grid cols-5 list-item';
      row.innerHTML = `
        <input class="input" data-k="name" data-i="${idx}" value="${c.name}" />
        <input class="input" data-k="amount" data-i="${idx}" type="number" min="0" step="any" value="${c.amount}" />
        <input class="input" data-k="unit" data-i="${idx}" value="${c.unit}" />
        <div class="input" style="display:flex;align-items:center">Scaled: ${fmt(c.amount * factor)} ${c.unit}</div>
        <button class="btn outline small" data-del="${idx}">Remove</button>
      `;
      holder.appendChild(row);
    });

    holder.querySelectorAll('input[data-k]').forEach((input) => {
      input.addEventListener('input', (e) => {
        const i = Number(e.target.dataset.i);
        const k = e.target.dataset.k;
        recipe.components[i][k] = k === 'amount' ? Number(e.target.value || 0) : e.target.value;
        saveState(state);
        renderComponents();
      });
    });

    holder.querySelectorAll('button[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.del);
        recipe.components.splice(idx, 1);
        saveState(state);
        renderComponents();
      });
    });
  };

  document.getElementById('recipeName').addEventListener('input', (e) => {
    recipe.name = e.target.value;
    saveState(state);
    renderRecipeList();
  });

  document.getElementById('baseVolume').addEventListener('input', (e) => {
    recipe.baseVolume = Number(e.target.value || 1);
    saveState(state);
    renderComponents();
  });

  document.getElementById('volumeUnit').addEventListener('change', (e) => {
    recipe.unit = e.target.value;
    saveState(state);
  });

  document.getElementById('targetVolume').addEventListener('input', renderComponents);

  document.getElementById('addComponent').addEventListener('click', () => {
    recipe.components.push({ name: 'Component', amount: 1, unit: 'g' });
    saveState(state);
    renderComponents();
  });

  document.getElementById('deleteRecipe').addEventListener('click', () => {
    if (state.recipes.length === 1) return;
    state.recipes = state.recipes.filter((r) => r.id !== recipe.id);
    selectedRecipeId = state.recipes[0]?.id || null;
    saveState(state);
    renderRecipeList();
    renderScaler();
  });

  renderComponents();
}

function bindCalculatorEvents() {
  const pct = document.getElementById('pct');
  const pctVolume = document.getElementById('pctVolume');
  const pctResult = document.getElementById('pctResult');

  const mw = document.getElementById('mw');
  const molarity = document.getElementById('molarity');
  const molarityVol = document.getElementById('molarityVol');
  const molarityResult = document.getElementById('molarityResult');

  const c1 = document.getElementById('c1');
  const v1 = document.getElementById('v1');
  const c2 = document.getElementById('c2');
  const v2 = document.getElementById('v2');
  const dilutionResult = document.getElementById('dilutionResult');

  const calcPct = () => {
    const p = Number(pct.value);
    const vol = Number(pctVolume.value);
    if (!p || !vol) return (pctResult.textContent = 'Enter % and volume.');
    const needed = (p / 100) * vol;
    pctResult.textContent = `Need ${fmt(needed)} g (for w/v) or mL (for v/v).`;
  };

  const calcMolarity = () => {
    const mwVal = Number(mw.value);
    const m = Number(molarity.value);
    const vol = Number(molarityVol.value);
    if (!mwVal || !m || !vol) return (molarityResult.textContent = 'Enter MW, molarity, and volume.');
    const grams = mwVal * m * vol;
    molarityResult.textContent = `Weigh ${fmt(grams)} g.`;
  };

  const calcDilution = () => {
    const values = [c1, v1, c2, v2].map((el) => Number(el.value));
    const filled = values.filter((v) => !!v).length;
    if (filled < 3) return (dilutionResult.textContent = 'Fill any 3 fields to solve the 4th.');

    if (!values[0]) values[0] = (values[2] * values[3]) / values[1];
    else if (!values[1]) values[1] = (values[2] * values[3]) / values[0];
    else if (!values[2]) values[2] = (values[0] * values[1]) / values[3];
    else if (!values[3]) values[3] = (values[0] * values[1]) / values[2];

    [c1, v1, c2, v2].forEach((el, i) => {
      if (!el.value) el.value = fmt(values[i]);
    });
    dilutionResult.textContent = `Solved with C1V1 = C2V2.`;
  };

  [pct, pctVolume].forEach((el) => el.addEventListener('input', calcPct));
  [mw, molarity, molarityVol].forEach((el) => el.addEventListener('input', calcMolarity));
  [c1, v1, c2, v2].forEach((el) => el.addEventListener('input', calcDilution));
}

render();
if (state.benchMode) {
  document.body.classList.add('dark');
  document.querySelectorAll('.card').forEach((c) => c.classList.add('neon'));
}
