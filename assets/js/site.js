// Minimal JS: nav toggle, year, small enhancements
(function(){
  // year
  const y = new Date().getFullYear();document.getElementById('year')&&(document.getElementById('year').textContent = y);

  // mobile nav
  const nav = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  toggle && toggle.addEventListener('click', ()=>{
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // close nav on link click (mobile)
  nav && nav.addEventListener('click', (e)=>{
    if(e.target.tagName === 'A' && window.innerWidth < 820){nav.classList.remove('open');toggle && toggle.setAttribute('aria-expanded','false')}
  });

  // smooth hash scroll fallback for browsers without CSS smooth scroll
  function offsetScrollToHash(){
    if(location.hash){
      const el = document.querySelector(location.hash);
      if(el){
        const top = el.getBoundingClientRect().top + window.scrollY - 64; // account for header
        window.scrollTo({top, behavior:'smooth'});
      }
    }
  }
  window.addEventListener('load', ()=>{setTimeout(offsetScrollToHash, 50)});
  window.addEventListener('hashchange', offsetScrollToHash);

  // Load and filter Medium posts from writing.json by tag
  async function loadWritingPosts(){
    const essaysList = document.getElementById('essays-list');
    const creativeList = document.getElementById('creative-list');
    
    // Only run if we're on a page with these elements
    if(!essaysList && !creativeList) return;
    
    try{
      const resp = await fetch('/content/writing.json');
      if(!resp.ok) throw new Error('Failed to load writing.json');
      const data = await resp.json();
      const posts = [...(data.local_posts || []), ...(data.medium_posts || [])]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const isExternal = (url) => /^https?:\/\//i.test(url);
      const renderItem = (p) => `
          <li class="post-item">
            ${p.image ? `<img src="${p.image}" alt="${p.title}" class="post-image">` : ''}
            <div class="post-content">
              <h3><a href="${p.url}"${isExternal(p.url) ? ' target="_blank" rel="noopener"' : ''}>${p.title}</a></h3>
              <p class="post-date">${new Date(p.date).toLocaleDateString('en-US', {year:'numeric', month:'long'})}</p>
              ${p.excerpt ? `<p class="post-excerpt">${p.excerpt}</p>` : ''}
            </div>
          </li>
        `;

      // Filter essays (posts with 'Essay' tag - case insensitive)
      const essays = posts.filter(p => p.tags && p.tags.some(t => t.toLowerCase() === 'essay'));
      if(essaysList){
        essaysList.innerHTML = essays.length ? essays.map(renderItem).join('\n') : '<li>No essays yet.</li>';
      }

      // Filter creative (posts with 'Creative' tag - case insensitive)
      const creative = posts.filter(p => p.tags && p.tags.some(t => t.toLowerCase() === 'creative'));
      if(creativeList){
        creativeList.innerHTML = creative.length ? creative.map(renderItem).join('\n') : '<li>No creative pieces yet.</li>';
      }
    }catch(err){
      console.error('Error loading writing posts:', err);
    }
  }

  // Load featured Medium posts for homepage
  async function loadFeaturedWriting(){
    const researchItem = document.getElementById('featured-research');
    const essayItem = document.getElementById('featured-essay');
    const creativeItem = document.getElementById('featured-creative');

    if(!researchItem && !essayItem && !creativeItem) return;

    try{
      const resp = await fetch('/content/writing.json');
      if(!resp.ok) throw new Error('Failed to load writing.json');
      const data = await resp.json();
      const localPosts = (data.local_posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      const mediumPosts = (data.medium_posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));

      const isExternal = (url) => /^https?:\/\//i.test(url);
      const venueLink = (url) => isExternal(url)
        ? '<a href="https://medium.com/@juanmaphd" target="_blank" rel="noopener">Medium</a>'
        : '<a href="/writing">juanma.phd</a>';

      // Get most recent local post for Research row
      const research = localPosts[0];
      if(researchItem && research){
        const dateStr = new Date(research.date).toLocaleDateString('en-US', {year:'numeric', month:'short'});
        researchItem.innerHTML = `
          <h3><a href="${research.url}"${isExternal(research.url) ? ' target="_blank" rel="noopener"' : ''}>${research.title}</a></h3>
          <p class="excerpt">${research.excerpt}</p>
          <p class="meta">Analysis · ${dateStr} · <a href="/writing">juanma.phd</a></p>
        `;
      }

      // Get first essay from Medium only (local posts shown in Research row)
      const essay = mediumPosts.find(p => p.tags && p.tags.some(t => t.toLowerCase() === 'essay'));
      if(essayItem && essay){
        const dateStr = new Date(essay.date).toLocaleDateString('en-US', {year:'numeric', month:'short'});
        essayItem.innerHTML = `
          <h3><a href="${essay.url}"${isExternal(essay.url) ? ' target="_blank" rel="noopener"' : ''}>${essay.title}</a></h3>
          <p class="excerpt">${essay.excerpt}</p>
          <p class="meta">Essay · ${dateStr} · ${venueLink(essay.url)}</p>
        `;
      }

      // Get first creative from Medium only
      const creative = mediumPosts.find(p => p.tags && p.tags.some(t => t.toLowerCase() === 'creative'));
      if(creativeItem && creative){
        const dateStr = new Date(creative.date).toLocaleDateString('en-US', {year:'numeric', month:'short'});
        creativeItem.innerHTML = `
          <h3><a href="${creative.url}"${isExternal(creative.url) ? ' target="_blank" rel="noopener"' : ''}>${creative.title}</a></h3>
          <p class="excerpt">${creative.excerpt}</p>
          <p class="meta">Creative · ${dateStr} · ${venueLink(creative.url)}</p>
        `;
      }
    }catch(err){
      console.error('Error loading featured writing:', err);
    }
  }
  
  // Load speaking from speaking.json
  async function loadSpeaking(){
    const list = document.getElementById('speaking-list');
    if(!list) return;
    try{
      const resp = await fetch('/content/speaking.json');
      if(!resp.ok) throw new Error('Failed to load speaking.json');
      const data = await resp.json();
      const talks = (data.talks || []).sort((a,b) => new Date(b.date) - new Date(a.date));
      list.innerHTML = talks.length ? talks.map(t => {
        const dateStr = new Date(t.date).toLocaleDateString('en-US', {year:'numeric', month:'long'});
        const typeLabel = t.type ? t.type.charAt(0).toUpperCase()+t.type.slice(1) : 'Talk';
        const primaryUrl = t.links && t.links[0] ? t.links[0].url : '#';
        const badges = t.links ? t.links.map((l,i) =>
          `${i>0?'<span class="sep">·</span>':''}<a href="${l.url}" target="_blank" rel="noopener">${l.platform}</a>`
        ).join('') : '';
        return `
          <li class="post-item">
            ${t.thumbnail ? `<img src="${t.thumbnail}" alt="${t.title}" class="post-image">` : '<div class="post-thumb-placeholder"></div>'}
            <div class="post-content">
              <h3><a href="${primaryUrl}" target="_blank" rel="noopener">${t.title}</a></h3>
              <p class="post-date">${typeLabel} · ${dateStr}${t.venue ? ' · ' + t.venue : ''}</p>
              ${t.description ? `<p class="post-excerpt">${t.description}</p>` : ''}
              ${badges ? `<p class="platform-links">${badges}</p>` : ''}
            </div>
          </li>`;
      }).join('\n') : '<li>No speaking engagements yet.</li>';
    }catch(err){
      console.error('Error loading speaking:', err);
    }
  }

  // Load featured speaking for homepage
  async function loadFeaturedSpeaking(){
    const container = document.getElementById('featured-speaking');
    if(!container) return;
    try{
      const resp = await fetch('/content/speaking.json');
      if(!resp.ok) throw new Error('Failed to load speaking.json');
      const data = await resp.json();
      const featured = (data.talks || []).filter(t => t.featured).slice(0,3);

      container.innerHTML = featured.map(t => {
        const dateStr = new Date(t.date).toLocaleDateString('en-US', {year:'numeric', month:'short'});
        const typeLabel = t.type ? t.type.charAt(0).toUpperCase()+t.type.slice(1) : 'Talk';
        const primaryUrl = t.links && t.links[0] ? t.links[0].url : '#';
        const shortDesc = t.description && t.description.length > 150
          ? t.description.substring(0, 150) + '...'
          : t.description;
        const thumbHtml = t.thumbnail
          ? `<img src="${t.thumbnail}" alt="${t.title}" class="post-image" style="width:100%;height:auto;max-width:300px;margin-bottom:1rem;border-radius:4px;">`
          : '';
        return `
          <article class="writing-item">
            ${thumbHtml}
            <h3><a href="${primaryUrl}" target="_blank" rel="noopener">${t.title}</a></h3>
            <p class="excerpt">${shortDesc}</p>
            <p class="meta">${typeLabel} · ${dateStr}${t.venue ? ' · ' + t.venue : ''}</p>
          </article>`;
      }).join('\n');
    }catch(err){
      console.error('Error loading featured speaking:', err);
    }
  }

  // Contact form: submit via fetch and show inline status
  function initContactForm(){
    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-status');
    if(!form || !status) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      status.hidden = true;
      status.classList.remove('error','success');
      try{
        const resp = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: {'Accept': 'application/json'}
        });
        const data = await resp.json().catch(() => ({}));
        if(resp.ok && data.success !== false){
          status.textContent = 'Thanks — your message was sent.';
          status.classList.add('success');
          form.reset();
        } else {
          status.textContent = (data && data.message) || 'Something went wrong. Please try again or email directly.';
          status.classList.add('error');
        }
      }catch(err){
        status.textContent = 'Network error. Please try again or email directly.';
        status.classList.add('error');
      }finally{
        status.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }

  // Run after DOM is ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      loadWritingPosts();
      loadFeaturedWriting();
      loadSpeaking();
      loadFeaturedSpeaking();
      initContactForm();
    });
  } else {
    loadWritingPosts();
    loadFeaturedWriting();
    loadSpeaking();
    loadFeaturedSpeaking();
    initContactForm();
  }
})();