// convertSchemes.js
const fs = require("fs");
const csv = require("csvtojson");

csv()
  .fromFile("datasets/updated_data.csv")
  .then((jsonArray) => {
    // Keep only the first 600 schemes
    const limited = jsonArray.slice(0, 600);

    fs.writeFileSync("schemes.json", JSON.stringify(limited, null, 2));
    console.log(`✅ Created schemes.json with ${limited.length} schemes`);
  });
