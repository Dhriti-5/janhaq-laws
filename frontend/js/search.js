let laws = [];
let fuse;

// Load all laws JSON
fetch('data/all_laws.json')
  .then(res => res.json())
  .then(data => {
    laws = data;

    // Initialize Fuse.js
    fuse = new Fuse(laws, {
      keys: ['title', 'description', 'tags'],
      threshold: 0.5,  // adjust for more/less fuzziness
      includeScore: true
    });
  })
  .catch(err => console.error('Error loading JSON:', err));

// Function to perform search
function performSearch(query, category = '') {
  if (!fuse) return []; // JSON not loaded yet

  let results = query ? fuse.search(query).map(r => r.item) : laws;

  // Filter by category if selected
  if (category) {
    results = results.filter(law => law.category === category);
  }

  return results;
}

// Hook input and select
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('category');
const resultsDiv = document.getElementById('results');

async function explainLaw(law) {
  // Send title & description to backend
  const response = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: law.title, description: law.description })
  });
  const data = await response.json();
  return data.explanation; 
}

async function updateResults() {
  const query = searchInput.value;
  const category = categorySelect.value;

    // If no query, clear results and return
  if (!query) {
    resultsDiv.innerHTML = '<p>Type something to search for a law.</p>';
    return;
  }
  
  const results = performSearch(query, category);

  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>No results found.</p>';
  } else {
    const topLaw = results[0]; // most relevant
    const explanation = await explainLaw(topLaw);

    resultsDiv.innerHTML = `
      <div class="law-card">
        <p><a href="${topLaw.referenceLink}" target="_blank"><strong>${topLaw.title}</strong></a> [${topLaw.category}]</p>
        <p>${explanation}</p>
      </div>
    `;
  }
}

searchInput.addEventListener('input', updateResults);
categorySelect.addEventListener('change', updateResults);

