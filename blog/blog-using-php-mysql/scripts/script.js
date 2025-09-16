(function() {
  const chatEl = document.getElementById('chat');
  const formEl = document.getElementById('composer');
  const inputEl = document.getElementById('message');
  const modelEl = document.getElementById('model-select');
  const endpoint = (window.GEMINI_CHAT_CONFIG && window.GEMINI_CHAT_CONFIG.endpoint) || 'gemini_chat.php';

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

  function setBusy(isBusy) {
    formEl.querySelector('button').disabled = isBusy;
  }

  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
  }

  inputEl.addEventListener('input', autoResize);
  autoResize();

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    autoResize();

    messages.push({ role: 'user', content: text });
    appendMessage('user', text);
    setBusy(true);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model: modelEl.value })
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
      const msg = (err && err.message) ? err.message : 'Request failed';
      appendMessage('model', `Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  });
})();

