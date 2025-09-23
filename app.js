function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {
    alert('Error loading recipes from browser storage: ' + e);
    console.error('loadState error:', e);
  }
  return seed();
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    console.info('Recipes successfully saved to your browser!');
  } catch(e) {
    alert('Error - could not save recipes. Check your browser privacy settings.');
    console.error('saveState error:', e);
  }
}
