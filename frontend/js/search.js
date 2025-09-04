
let items = []; // will hold both laws + schemes
let fuse;
// Load laws and schemes together
Promise.all([
  fetch('data/all_laws.json').then(res => res.json()),
  fetch('data/schemes.json').then(res => res.json())
])
.then(([laws, schemes]) => {
  console.log("✅ Laws loaded:", laws.length);
  console.log("✅ First law:", laws[0]);
  console.log("✅ Schemes loaded:", schemes.length);

  const normalizedSchemes = schemes.map(s => ({
    title: s.scheme_name,
    description: s.details,
    category: "Scheme",
    referenceLink: "",
    tags: s.tags ? s.tags.split(',').map(t => t.trim()) : []
  }));

  const normalizedLaws = laws.map(l => ({
    title: l.title,
    description: l.description,
    category: l.category,
    referenceLink: l.referenceLink,
    tags: l.tags
  }));

  items = [...normalizedLaws, ...normalizedSchemes];

  fuse = new Fuse(items, {
    keys: ['title', 'description', 'tags'],
    threshold: 0.4,
    includeScore: true
  });

  console.log(`✅ Fuse initialized with ${items.length} items`);
})
.catch(err => console.error('❌ Error loading JSON:', err));


// Function to perform search
function performSearch(query, category = '') {
  if (!fuse) return [];

  let results = query ? fuse.search(query).map(r => r.item) : items;

  if (category) {
    results = results.filter(item => item.category === category);
  }
  console.log("🔎 Search results:", results); // 👈 Add this
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

  if (!query) {
    resultsDiv.innerHTML = '<p>Type something to search for a law or scheme.</p>';
    return;
  }

  const results = performSearch(query, category);

  if (results.length === 0) {
  resultsDiv.innerHTML = '<p>No results found.</p>';
} else {
  resultsDiv.innerHTML = ''; // clear old results

  for (const item of results.slice(0, 5)) {  // show top 5
    if (item.category === "Scheme") {
      resultsDiv.innerHTML += `
        <div class="scheme-card">
          <p><strong>${item.title}</strong> [${item.category}]</p>
          <p>${item.description}</p>
        </div>
      `;
    } else {
      const explanation = await explainLaw(item);
      resultsDiv.innerHTML += `
        <div class="law-card">
          <p><a href="${item.referenceLink}" target="_blank"><strong>${item.title}</strong></a> [${item.category}]</p>
          <p>${marked.parse(explanation)}</p>
        </div>
      `;
    }
  }
}
}


searchInput.addEventListener('input', updateResults);
categorySelect.addEventListener('change', updateResults);

