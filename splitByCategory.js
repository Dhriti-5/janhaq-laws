const fs = require("fs");

// Load the big laws.json
const allLaws = JSON.parse(fs.readFileSync("laws.json", "utf-8"));

// Prepare an object to hold arrays per category
const categories = {};

// Loop through all laws
allLaws.forEach(law => {
  const category = law.category || "Unknown";
  if (!categories[category]) {
    categories[category] = [];
  }
  categories[category].push(law);
});

// Save each category into a separate JSON file
for (const [category, laws] of Object.entries(categories)) {
  // Make filename safe
  const safeName = category.replace(/\s+/g, "_").toLowerCase() + ".json";
  fs.writeFileSync(safeName, JSON.stringify(laws, null, 2));
  console.log(`Saved ${laws.length} entries → ${safeName}`);
}

console.log("✅ Done! All categories split into separate files.");
