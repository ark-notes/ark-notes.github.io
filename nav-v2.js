/* ============================================================
   导航增强（对标优秀文档站）
   - 面包屑
   - 上一步 / 下一步
   - 左侧目录（电脑）/ 顶部折叠（手机）
   - 右侧本页目录
   ============================================================ */
(function(){
  const page = location.pathname.split('/').pop() || 'index.html';

  fetch('data/nav.json')
    .then(r => r.json())
    .then(d => { init(d.steps); })
    .catch(()=>{});

  function init(steps){
    const idx = steps.findIndex(s => s.file === page);
    if(idx < 0) return;
    const cur = steps[idx];
    const prev = idx > 0 ? steps[idx-1] : null;
    const next = idx < steps.length-1 ? steps[idx+1] : null;

    const main = document.querySelector('main');
    if(!main) return;
    const wrap = main.querySelector('.wrap') || main;

    /* ---------- 1. 面包屑（插在 page-head 之前） ---------- */
    const head = wrap.querySelector('.page-head') || wrap.querySelector('h1');
    if(head){
      const bc = document.createElement('nav');
      bc.className = 'breadcrumb';
      const parts = [];
      parts.push(`<a href="index.html">首页</a>`);
      if(cur.group) parts.push(`<span>${cur.group}</span>`);
      parts.push(`<b>${cur.title}</b>`);
      bc.innerHTML = parts.join('<i>›</i>');
      head.parentNode.insertBefore(bc, head);
    }

    /* ---------- 2. 上一步 / 下一步 ---------- */
    const nav = document.createElement('div');
    nav.className = 'page-nav';
    if(prev){
      nav.innerHTML += `<a class="pn pn-prev" href="${prev.file}">
        <span class="pn-label">← 上一步</span>
        <span class="pn-title">${prev.title}</span>
      </a>`;
    } else {
      nav.innerHTML += `<span class="pn pn-empty"></span>`;
    }
    if(next){
      nav.innerHTML += `<a class="pn pn-next" href="${next.file}">
        <span class="pn-label">下一步 →</span>
        <span class="pn-title">${next.title}</span>
      </a>`;
    } else {
      nav.innerHTML += `<span class="pn pn-empty"></span>`;
    }
    wrap.appendChild(nav);

    /* ---------- 3. 左侧目录（仅学习路径系列 + 桌面端） ---------- */
    const isLearningPath = (cur.group||'').includes('学习路径');
    if(isLearningPath && window.innerWidth >= 1100){
      const pathSteps = steps.filter(s => (s.group||'').includes('学习路径') && s.file !== 'path.html');
      document.body.classList.add('has-sidenav');
      const toc = document.createElement('aside');
      toc.className = 'side-nav';
      toc.innerHTML = `
        <div class="sn-title">学习路径</div>
        ${pathSteps.map((s,i) => `
          <a class="sn-item${s.file===page?' on':''}" href="${s.file}">
            <span class="sn-num">${String(i+1).padStart(2,'0')}</span>
            <span class="sn-text">${s.title}</span>
          </a>`).join('')}
      `;
      document.body.appendChild(toc);
    }

    /* ---------- 4. 右侧本页目录（长页面） ---------- */
    const content = wrap.querySelector('.content');
    if(content && window.innerWidth >= 1280){
      const hs = content.querySelectorAll('h2');
      if(hs.length >= 4){
        document.body.classList.add('has-tocright');
        const toc = document.createElement('nav');
        toc.className = 'toc-right';
        toc.innerHTML = '<div class="tr-title">本页目录</div>' +
          Array.from(hs).map((h,i) => {
            if(!h.id) h.id = 'sec-'+i;
            return `<a href="#${h.id}">${h.textContent.slice(0,16)}</a>`;
          }).join('');
        document.body.appendChild(toc);

        const links = toc.querySelectorAll('a');
        const io = new IntersectionObserver(es=>{
          es.forEach(en=>{
            if(en.isIntersecting){
              links.forEach(l=>l.classList.remove('on'));
              const i = Array.from(hs).indexOf(en.target);
              if(links[i]) links[i].classList.add('on');
            }
          });
        }, {rootMargin:'-15% 0px -70% 0px'});
        hs.forEach(h=>io.observe(h));
      }
    }
  }

  /* ---------- 5. 底部固定「下一步」条（中国用户习惯） ---------- */
  (function bottomBar(){
    const page = location.pathname.split('/').pop() || 'index.html';
    fetch('data/nav.json').then(r=>r.json()).then(d=>{
      const steps = d.steps;
      const i = steps.findIndex(s=>s.file===page);
      if(i < 0) return;
      const next = i < steps.length-1 ? steps[i+1] : null;
      if(!next) return;

      document.body.classList.add('has-bottombar');
      const bar = document.createElement('div');
      bar.className = 'bottom-bar';
      bar.innerHTML = `
        <div class="bb-info">
          <span class="bb-label">下一步</span>
          <span class="bb-title">${next.title}</span>
        </div>
        <a class="bb-btn" href="${next.file}">
          继续学习
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>`;
      document.body.appendChild(bar);

      // 滚到底部时隐藏（因为页面里已有上/下一页）
      let ticking=false;
      window.addEventListener('scroll', ()=>{
        if(ticking) return;
        ticking=true;
        requestAnimationFrame(()=>{
          const y = window.scrollY + window.innerHeight;
          const h = document.documentElement.scrollHeight;
          const hiding = y > h - 200;
          bar.classList.toggle('hide', hiding);
          document.body.classList.toggle('has-bottombar', !hiding);
          ticking=false;
        });
      }, {passive:true});
      // 初始显示
      bar.classList.add('show');
    }).catch(()=>{});
  })();

})();