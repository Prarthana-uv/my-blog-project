// Simple Bing News Search API wrapper (free tier)
// Docs: https://www.microsoft.com/en-us/bing/apis/bing-news-search-api
// Requires BING_NEWS_API_KEY in .env

export async function fetchNewsSnippets(query, count = 3) {
  const apiKey = process.env.BING_NEWS_API_KEY;
  if (!apiKey) throw new Error('Missing BING_NEWS_API_KEY');
  const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=${count}&mkt=en-US&safeSearch=Moderate`;
  const res = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey }
  });
  if (!res.ok) throw new Error('Bing News API error');
  const data = await res.json();
  return (data.value || []).map(article => ({
    name: article.name,
    url: article.url,
    description: article.description,
    provider: (article.provider && article.provider[0] && article.provider[0].name) || ''
  }));
}
