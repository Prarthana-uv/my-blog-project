(function() {
  const chatEl = document.getElementById('chat');
  const formEl = document.getElementById('composer');
  const inputEl = document.getElementById('message');
  const chipsEl = document.getElementById('chips');
  const FIXED_MODEL = 'gemini-1.5-flash';
  // Use the Vercel serverless API endpoint
  const endpoint = (window.GEMINI_CHAT_CONFIG && window.GEMINI_CHAT_CONFIG.endpoint) || '/api/gemini-chat';

  /** @type {{ role: 'user'|'model', content: string }[]} */
  const messages = [];

  function appendMessage(role, content) {
    const container = document.createElement('div');
    container.className = `message role-${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? 'U' : 'G';

    const body = document.createElement('div');
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = role === 'user' ? 'You' : 'Gemini';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = content;

    body.appendChild(meta);
    body.appendChild(bubble);

    container.appendChild(avatar);
    container.appendChild(body);
    chatEl.appendChild(container);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  // Welcome message
  appendMessage('model', 'Hi! I\'m Gemini. Ask me anything or pick a suggestion below.');

  function setBusy(isBusy) {
    const btn = formEl.querySelector('button');
    btn.disabled = isBusy;
    btn.textContent = isBusy ? 'Sending…' : 'Send';
    let spinner = document.getElementById('chat-loading-spinner');
    if (!spinner) {
      spinner = document.createElement('div');
      spinner.id = 'chat-loading-spinner';
      spinner.innerHTML = '<span class="spinner"></span> Waiting for Gemini...';
      spinner.style.textAlign = 'center';
      spinner.style.margin = '18px 0';
      spinner.style.color = '#3b5eff';
      chatEl.parentNode.insertBefore(spinner, chatEl.nextSibling);
    }
    spinner.style.display = isBusy ? '' : 'none';
  }

  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
  }

  inputEl.addEventListener('input', autoResize);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formEl.requestSubmit();
    }
  });
  autoResize();

  // Quick suggestions
  if (chipsEl) {
    chipsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-text]');
      if (!btn) return;
      inputEl.value = btn.getAttribute('data-text');
      autoResize();
      formEl.requestSubmit();
    });
  }

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    autoResize();

    messages.push({ role: 'user', content: text });
    appendMessage('user', text);
    setBusy(true);
    const chatErrorEl = document.getElementById('chat-error');
    if (chatErrorEl) chatErrorEl.textContent = '';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: FIXED_MODEL })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.reply || '';
      messages.push({ role: 'model', content: reply });
      appendMessage('model', reply);
    } catch (err) {
      let msg = (err && err.message) ? err.message : 'Request failed';
      // More helpful hints for common misconfigurations
      if (/Missing GEMINI_API_KEY/i.test(msg)) {
        msg = 'Server is missing GEMINI_API_KEY. Add it in Vercel → Settings → Environment Variables, then redeploy.';
      }
      // Show error in a more visible way
      appendMessage('model', `❗ ${msg}`);
      if (chatErrorEl) chatErrorEl.textContent = msg;
    } finally {
      setBusy(false);
    }
  });
})();

