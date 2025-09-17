(function(){
  var form = document.getElementById('detect-form');
  var urlEl = document.getElementById('articleUrl');
  var textEl = document.getElementById('articleText');
  var summaryEl = document.getElementById('summary');
  var evidenceEl = document.getElementById('evidence');
  var statusEl = document.getElementById('status');

  function setBusy(isBusy){
    var btn = document.getElementById('analyzeBtn');
    btn.disabled = isBusy;
    statusEl.textContent = isBusy ? 'Analyzing…' : '';
  }

  function renderResult(data){
    var verdict = (data && data.verdict) ? String(data.verdict) : 'Unknown';
    var confidence = (data && typeof data.confidence === 'number') ? Math.round(data.confidence * 100) + '%' : '—';
    var rationale = (data && data.rationale) ? String(data.rationale) : '';
    var signals = (data && Array.isArray(data.signals)) ? data.signals : [];

    var tone = 'neutral';
    if (/fake|false|misleading/i.test(verdict)) tone = 'bad';
    if (/true|likely true|reliable/i.test(verdict)) tone = 'ok';

    summaryEl.className = 'card result-card ' + tone;
    summaryEl.style.display = 'block';
    summaryEl.innerHTML = '<h3 style="margin:0 0 6px 0;">Verdict: ' + verdict + ' <span style="opacity:.8;font-weight:400;">(' + confidence + ')</span></h3>' +
      (rationale ? '<div style="color:#d7dbec;">' + escapeHtml(rationale) + '</div>' : '');

    evidenceEl.className = 'card result-card neutral';
    evidenceEl.style.display = signals.length ? 'block' : 'none';
    if (signals.length){
      var items = signals.map(function(s){ return '<li>' + escapeHtml(String(s)) + '</li>'; }).join('');
      evidenceEl.innerHTML = '<h4 style="margin:0 0 6px 0;">Signals</h4><ul style="margin:0 0 0 18px; padding:0;">' + items + '</ul>';
    }
  }

  function escapeHtml(str){
    return str.replace(/[&<>\"']/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#39;'}[ch]);
    });
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var url = (urlEl.value || '').trim();
    var text = (textEl.value || '').trim();
    if (!url && !text){
      statusEl.textContent = 'Enter article text or a URL.';
      return;
    }
    setBusy(true);
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, text: text })
    }).then(function(res){
      if (!res.ok) return res.json().catch(function(){ return {}; }).then(function(err){ throw new Error(err.error || ('HTTP ' + res.status)); });
      return res.json();
    }).then(function(json){
      renderResult(json);
    }).catch(function(err){
      summaryEl.style.display = 'block';
      summaryEl.className = 'card result-card bad';
      summaryEl.innerHTML = '<strong>Error:</strong> ' + escapeHtml(err && err.message ? err.message : 'Request failed');
      evidenceEl.style.display = 'none';
    }).finally(function(){
      setBusy(false);
    });
  });
})();


