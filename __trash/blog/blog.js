// Blog UI logic for fetching, adding, and deleting posts
const API_URL = '/api/blog';

const blogList = document.getElementById('blog-list');
const blogForm = document.getElementById('blog-form');
const blogFormError = document.getElementById('blog-form-error');

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

async function fetchPosts() {
  blogList.innerHTML = '<div class="spinner"></div> Loading...';
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch posts');
    renderPosts(data.posts || []);
  } catch (err) {
    blogList.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

function renderPosts(posts) {
  if (!posts.length) {
    blogList.innerHTML = '<div>No posts yet.</div>';
    return;
  }
  blogList.innerHTML = posts.map(post => `
    <div class="blog-post">
      <h3>${escapeHtml(post.title)}</h3>
      <div class="blog-meta">${escapeHtml(post.date)}${post.imageUrl ? ` | <img src="${post.imageUrl}" alt="Image" class="blog-img-thumb">` : ''}</div>
      <div class="blog-content">${escapeHtml(post.content)}</div>
      <button class="delete-btn" data-id="${post._id}">Delete</button>
    </div>
  `).join('');
}

blogList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  if (!confirm('Delete this post?')) return;
  const id = btn.getAttribute('data-id');
  try {
    const res = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete');
    fetchPosts();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
});

blogForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  blogFormError.textContent = '';
  const formData = new FormData(blogForm);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add post');
    blogForm.reset();
    fetchPosts();
  } catch (err) {
    blogFormError.textContent = err.message;
  }
});

fetchPosts();
