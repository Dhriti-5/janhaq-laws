
require('dotenv').config();
console.log("Using API key:", process.env.OPENROUTER_API_KEY ? "Loaded" : "Missing");

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/data', express.static(path.join(__dirname, '../frontend/data')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

console.log("Using key:", process.env.OPENROUTER_API_KEY.slice(0, 10) + "...");


// =====================
// ✅ Schemes API
// =====================

// Load schemes.json
const schemesFile = path.join(__dirname, "../frontend/data/schemes.json");

let schemes = [];
try {
  const data = fs.readFileSync(schemesFile, "utf-8");
  schemes = JSON.parse(data);
  console.log(`✅ Loaded ${schemes.length} schemes`);
} catch (err) {
  console.error("❌ Error reading schemes.json:", err.message);
}

// GET /api/schemes → return all schemes
app.get("/api/schemes", (req, res) => {
  res.json(schemes);
});

// GET /api/schemes/search?keyword=education
app.get("/api/schemes/search", (req, res) => {
  const keyword = req.query.keyword?.toLowerCase();
  if (!keyword) return res.json(schemes);

  const results = schemes.filter(
    (s) =>
      s.Scheme_Name?.toLowerCase().includes(keyword) ||
      s.Ministry?.toLowerCase().includes(keyword) ||
      s.Objective?.toLowerCase().includes(keyword)
  );

  res.json(results);
});


// =====================
// ✅ Existing Laws API
// =====================
app.post('/api/explain', async (req, res) => {
  const { title, description } = req.body;

  try {
    const prompt = `
You are a legal explainer.  
Explain the following Indian law in less words **clear, simple language**, and format your response in **Markdown** with headings and bullet points and only in 700 words.  
Use exactly this structure:

## 1. What the law is
- Plain explanation of the law
- Its main features

## 2. Why it exists
- Purpose of the law
- Problems it addresses

## 3. What it means for ordinary people
- Direct impact on citizens
- Rights, responsibilities, penalties

Title: ${title}  
Details: ${description || 'No details provided'}
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
       model: 'deepseek/deepseek-r1:free',
 // ✅ free model
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    console.log("🔍 Status:", response.status);
    const data = await response.json();
    console.log("🔍 Raw API response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "API call failed" });
    }

    const explanation =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.delta?.content ||
      JSON.stringify(data);

    res.json({ explanation });

  } catch (error) {
    console.error('❌ Error in /api/explain:', error);
    res.status(500).json({ error: 'Failed to get explanation' });
  }
});


app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
