let articles = [];

async function loadArticles() {
  try {
    const res = await fetch('artikelen.json'); 
    articles = await res.json();
    renderArticles();
  } catch (e) {
    console.error('Kon artikelen.json niet laden', e);
  }
}

function renderArticles() {
  const container = document.querySelector('.article-list');
  if (!container) return;

  container.innerHTML = articles
    .map(article => `
      <article class="article-card">
        <img src="${article.thumbnail}" alt="Thumbnail bij artikel: ${article.title}" class="article-thumbnail" />
        <div class="article-content">
          <div class="article-date">${formatDate(article.date)}</div>
          <h3>${article.title}</h3>
          <p>${article.description}</p>
          <a href="${article.content}" class="btn btn-secondary">Lees artikel</a>
        </div>
      </article>
    `)
    .join('');
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' });
}

if (document.querySelector('.article-list')) {
  document.addEventListener('DOMContentLoaded', loadArticles);
}