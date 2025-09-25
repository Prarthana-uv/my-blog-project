export default async function handler(req, res) {
  // Debug log incoming request
  console.log('[Gemini Chat API] Method:', req.method);
  console.log('[Gemini Chat API] Headers:', req.headers);
  if (req.method === 'POST') {
    let bodyData = '';
    try {
      bodyData = JSON.stringify(req.body);
    } catch (e) {
      bodyData = '[unserializable]';
    }
    console.log('[Gemini Chat API] Body:', bodyData);
  }
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
    const { messages, model = 'gemini-1.5-flash', system } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [ { text: String(m.content || '') } ]
    }));

    const body = { contents };
    if (system) {
      body.systemInstruction = { parts: [ { text: String(system) } ] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream error', status: upstream.status, raw: json });
    }

    let reply = '';
    const parts = json?.candidates?.[0]?.content?.parts || [];
    for (const p of parts) { if (p?.text) reply += p.text; }

    return res.status(200).json({ reply, raw: json });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) });
  }
}

