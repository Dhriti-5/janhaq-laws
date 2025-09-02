const fs = require("fs");
const puppeteer = require("puppeteer");

const searchTerms = [
  { term: "bills", file: "bills.json", category: "Bill" },
  { term: "rules", file: "rules.json", category: "Rule" },
  { term: "amendments", file: "amendment.json", category: "Amendment" },
  { term: "state acts", file: "state_acts.json", category: "State Act" },
  { term: "central acts", file: "central_act.json", category: "Central Act" }
];

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  for (const search of searchTerms) {
    console.log(`\n🔍 Scraping: ${search.term}`);
    let url =
      "https://www.indiacode.nic.in/handle/123456789/1362/simple-search?query=" +
      encodeURIComponent(search.term);
    let laws = [];
    let pageCount = 1;

    while (true) {
      console.log(`🌐 Visiting: ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      const rows = await page.$$("table.table-hover tbody tr");
      if (rows.length === 0) {
        console.log("⚠️ No results found on this page.");
        break;
      }

      const results = await page.evaluate((category) => {
        const data = [];
        const rows = document.querySelectorAll("table.table-hover tbody tr");
        rows.forEach(row => {
          const link = row.querySelector("td a");
          if (link) {
            const cells = row.querySelectorAll("td");
            const actTitle = cells[2]?.innerText.trim() || "Unknown Act";
            data.push({
              title: actTitle,
              referenceLink: link.href,
              description: "",
              category: category,
              tags: ["Law", "India", category]
            });
          }
        });
        return data;
      }, search.category);

      console.log(`✅ Scraped ${results.length} entries from page ${pageCount}`);
      laws.push(...results);

      // Find Next page
      const nextHref = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("a[href*='simple-search']"));
        const next = anchors.find(a => a.textContent.trim().toLowerCase() === "next");
        return next ? next.getAttribute("href") : null;
      });

      if (!nextHref) {
        console.log("⛔ No next page, finishing this category...");
        break;
      }

      url = "https://www.indiacode.nic.in" + nextHref;
      pageCount++;

      await new Promise(r => setTimeout(r, 2000)); // 2 sec delay
    }

    fs.writeFileSync(search.file, JSON.stringify(laws, null, 2));
    console.log(`🎉 Saved ${laws.length} entries → ${search.file}`);
  }

  await browser.close();
  console.log("\n✅ All categories scraped successfully!");
})();
