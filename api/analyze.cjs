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
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY env var' });
  }

  try {
    const { url, text } = req.body || {};
    if (!url && !text) {
      return res.status(400).json({ error: 'Provide text or url' });
    }

    const prompt = buildPrompt(url, text);

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

function buildPrompt(url, text) {
  const base = `You are a fact-checking assistant assessing whether an article is likely misinformation.
Return a concise JSON with keys: verdict (Likely True|Uncertain|Likely False), confidence (0..1), rationale, signals (array of short bullet points). Do not include markdown fences.
Prioritize source credibility, claim specificity, corroboration with reputable outlets, and language cues.`;
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

module.exports = handler;
