import { fetchNewsSnippets } from './news.js';

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API')));
    return res.status(500).json({ 
      error: 'Missing GEMINI_API_KEY env var',
      debug: 'Check environment variables in Vercel dashboard or .env file'
    });
  }

  try {
    const { url, text } = req.body || {};
    if (!url && !text) {
      return res.status(400).json({ error: 'Provide text or url' });
    }

    // Fetch live news snippets for real-time context
    let newsSnippets = [];
    let newsQuery = text || url || '';
    try {
      if (newsQuery) {
        newsSnippets = await fetchNewsSnippets(newsQuery, 3);
      }
    } catch (e) {
      // If Bing News fails, continue without news
      newsSnippets = [];
    }

    const prompt = buildPromptWithNews(url, text, newsSnippets);

    const body = {
      contents: [
        {
          role: 'user',
          parts: [ { text: prompt } ]
        }
      ]
    };

    const model = 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Upstream error:', json);
      return res.status(upstream.status).json({ error: 'Upstream error', status: upstream.status, raw: json });
    }

    const textOut = extractText(json);
    const parsed = parseStructured(textOut);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) });
  }
}

function buildPromptWithNews(url, text, newsSnippets) {
  const base = `You are an advanced fact-checking AI. Your job is to assess whether a news article or claim is likely misinformation, using the latest available evidence and reputable sources.

Instructions:
- Search for and cite credible sources (news, scientific, government, fact-checkers) that support or refute the claim/article.
- If a URL is provided, analyze the content and cross-check with external sources.
- If only text is provided, treat it as the main claim or article.
- Consider context, date, and possible bias.
- If the claim is unverified or ambiguous, say so and explain why.

You are provided with recent news snippets for context. Use them as evidence if relevant:
${newsSnippets && newsSnippets.length ? newsSnippets.map((n, i) => `  [${i+1}] ${n.name} (${n.provider}): ${n.description} [${n.url}]`).join('\n') : '  (No recent news found)'}

Return a concise JSON with these keys:
  verdict: (Likely True | Uncertain | Likely False)
  confidence: (0..1)
  rationale: (short, clear explanation with evidence and citations)
  signals: (array of short bullet points, each with a source or reasoning)

Do NOT include markdown fences or extra commentary. Only output the JSON object.

Prioritize accuracy, evidence, and transparency.`;
  const source = [
    url ? `URL: ${url}` : '',
    text ? `TEXT: ${text}` : ''
  ].filter(Boolean).join('\n\n');
  return `${base}\n\n${source}`;
}

function extractText(json) {
  let out = '';
  const parts = json && json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts || [];
  for (const p of parts) { if (p && p.text) out += p.text; }
  return out || '';
}

function parseStructured(s) {
  try {
    // Try direct JSON first
    const direct = JSON.parse(s);
    return sanitize(direct);
  } catch (_) {
    // Fallback: extract JSON substring
    const m = s.match(/\{[\s\S]*\}/);
    if (m) {
      try { return sanitize(JSON.parse(m[0])); } catch (_) {}
    }
    // Last resort: map free text
    return {
      verdict: 'Uncertain',
      confidence: 0.5,
      rationale: s.slice(0, 800),
      signals: []
    };
  }
}

function sanitize(obj) {
  const verdict = String(obj.verdict || 'Uncertain');
  let confidence = Number(obj.confidence);
  if (!(confidence >= 0 && confidence <= 1)) confidence = 0.5;
  const rationale = String(obj.rationale || '');
  const signals = Array.isArray(obj.signals) ? obj.signals.map(String) : [];
  return { verdict, confidence, rationale, signals };
}

export default handler;
