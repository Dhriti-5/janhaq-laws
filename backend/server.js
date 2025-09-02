require('dotenv').config();
console.log("Using API key:", process.env.OPENROUTER_API_KEY ? "Loaded" : "Missing");

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/data', express.static(path.join(__dirname, '../data')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

console.log("Using key:", process.env.OPENROUTER_API_KEY.slice(0, 10) + "...");

// API endpoint to explain laws
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
        model: 'gpt-oss-120b', // ✅ use a working free model
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,   // increase
        temperature: 0.7,
      }),
    });

    // log raw response before parsing
    console.log("🔍 Status:", response.status);
    const data = await response.json();
    console.log("🔍 Raw API response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || "API call failed" });
    }

    const explanation =
        data?.choices?.[0]?.message?.content ||
        data?.choices?.[0]?.delta?.content ||
        JSON.stringify(data); // fallback: show raw API response


    res.json({ explanation });

  } catch (error) {
    console.error('❌ Error in /api/explain:', error);
    res.status(500).json({ error: 'Failed to get explanation' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});