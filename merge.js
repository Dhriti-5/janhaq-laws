const fs = require("fs");
const path = require("path");

// List all individual JSON files inside the data folder
const files = [
  "bills.json",
  "rules.json",
  "amendment.json",
  "state_acts.json",
  "central_act.json"
];

let allLaws = [];

// Read each file from the data folder and append its content to allLaws
files.forEach(file => {
  const filePath = path.join("data", file);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    allLaws.push(...data);
  } else {
    console.warn(`⚠️ File not found: ${filePath}`);
  }
});

// Save merged data into the data folder
fs.writeFileSync(path.join("data", "all_laws.json"), JSON.stringify(allLaws, null, 2));
console.log(`🎉 Merged ${allLaws.length} entries → data/all_laws.json`);
