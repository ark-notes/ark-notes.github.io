/* ============================================
   ARK 学习指南 — 页面增强 + 阿奇助手
   ============================================ */
(function(){
  const FORM = "https://wj.qq.com/s2/28049534/bw59/";
  const inSub = location.pathname.includes('/transcripts/');
  const P = inSub ? '../' : '';
  const ARKIE_SM = P + 'assets/arkie-sm.png';

  /* ---------- 1. 阅读进度条 ---------- */
  const bar = document.createElement('div');
  bar.className = 'read-bar';
  document.body.appendChild(bar);

  /* ---------- 3. 右下角功能区 ---------- */
  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.innerHTML = `
    <div class="dock-menu" id="dockMenu">
      <div class="dm-title">去哪看看？</div>
      <a class="dm-item" href="${P}index.html">首页</a>
      <a class="dm-item" href="${P}path.html">学习路径</a>
      <a class="dm-item" href="${P}lecturer.html">讲师板块</a>
      <a class="dm-item" href="${P}soul-five.html">灵魂五问</a>
      <a class="dm-item" href="${P}query-guide.html">链上查询</a>
      <a class="dm-item" href="${P}qa.html">疑难问答</a>
      <a class="dm-item" href="${P}transcripts.html">逐字稿库</a>
    </div>

    <div class="dock-stack">
      <a class="dock-pill dock-back" id="dockBack" href="${P}index.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
        </svg>
        <span class="dp-text">返回</span>
      </a>
      <button class="dock-pill dock-top" id="dockTop" aria-label="返回顶部">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 18V7"/><path d="M6.5 12.5L12 7l5.5 5.5"/>
        </svg>
        <span class="dp-text">顶部</span>
      </button>
      <a class="dock-pill dock-cta" href="${FORM}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/>
        </svg>
        <span class="dp-text">提个建议</span>
        <span class="dp-dot"></span>
      </a>
    </div>

    <button class="dock-arkie" id="dockArkie" aria-label="阿奇助手">
      <span class="ring"></span>
      <span class="ring2"></span>
      <img src="${ARKIE_SM}" alt="阿奇">
      <span class="tip" id="arkieTip">点我导航</span>
    </button>
  `;
  document.body.appendChild(dock);

  const arkieBtn = document.getElementById('dockArkie');
  const menu = document.getElementById('dockMenu');
  const topBtn = document.getElementById('dockTop');
  const tip = document.getElementById('arkieTip');
  let open = false;

  arkieBtn.addEventListener('click', e=>{
    e.stopPropagation();
    open = !open;
    menu.classList.toggle('show', open);
    arkieBtn.classList.toggle('active', open);
    tip.classList.remove('show');
  });
  document.addEventListener('click', e=>{
    if(open && !dock.contains(e.target)){
      open=false; menu.classList.remove('show'); arkieBtn.classList.remove('active');
    }
  });
  topBtn.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));

  // 返回按钮：根据当前页决定去哪
  const backBtn = document.getElementById('dockBack');
  if(backBtn && !inSub){
    const page = location.pathname.split('/').pop() || 'index.html';
    const backMap = {
      'lecturer-15.html':'lecturer.html','lecturer-30.html':'lecturer.html',
      'lecturer-60.html':'lecturer.html','lecturer-online.html':'lecturer.html',
      'full-script.html':'lecturer.html',
    };
    if(page === 'index.html' || page === ''){
      backBtn.style.display='none';           // 首页不显示
    } else if(backMap[page]){
      backBtn.href = backMap[page];           // 子页返回上级
    } else {
      backBtn.href = 'index.html';            // 其他页返回首页
    }
  }

  // 首次提示
  try{
    if(!sessionStorage.getItem('arkieTip')){
      setTimeout(()=>tip.classList.add('show'), 2200);
      setTimeout(()=>tip.classList.remove('show'), 8000);
      sessionStorage.setItem('arkieTip','1');
    }
  }catch(e){}

  /* ---------- 4. 滚动 ---------- */
  const header = document.querySelector('.site-header');
  let ticking = false;
  function onScroll(){
    const y = window.scrollY || document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if(bar) bar.style.width = (h>0 ? (y/h*100) : 0) + '%';
    if(header) header.classList.toggle('scrolled', y > 20);
    // 返回顶部按钮 —— 滑动 300px 就出现
    if(topBtn) topBtn.classList.toggle('show', y > 300);
    // 提建议按钮 —— 滑动后变小，但一直在
    dock.classList.toggle('lifted', y > 260);
    ticking = false;
  }
  window.addEventListener('scroll', ()=>{
    if(!ticking){ requestAnimationFrame(onScroll); ticking = true; }
  }, {passive:true});
  onScroll();

  /* ---------- 5. 左侧目录 ---------- */
  const content = document.querySelector('.content');
  if(content && window.innerWidth > 1400){
    const hs = content.querySelectorAll('h2');
    if(hs.length >= 3){
      const toc = document.createElement('nav');
      toc.className = 'toc';
      hs.forEach((h,i)=>{
        if(!h.id) h.id = 'sec-'+i;
        const a = document.createElement('a');
        a.href = '#'+h.id;
        a.textContent = h.textContent.slice(0,14);
        toc.appendChild(a);
      });
      document.body.appendChild(toc);
      const links = toc.querySelectorAll('a');
      const io = new IntersectionObserver(es=>{
        es.forEach(en=>{
          if(en.isIntersecting){
            links.forEach(l=>l.classList.remove('on'));
            const idx = Array.from(hs).indexOf(en.target);
            if(links[idx]) links[idx].classList.add('on');
          }
        });
      }, {rootMargin:'-20% 0px -70% 0px'});
      hs.forEach(h=>io.observe(h));
    }
  }


  /* ---------- 6. 卡片光点跟随鼠标 ---------- */
  document.querySelectorAll('.card').forEach(card=>{
    if(!card.querySelector('.glow')){
      const g = document.createElement('span');
      g.className = 'glow';
      card.appendChild(g);
    }
    const glow = card.querySelector('.glow');
    card.addEventListener('mousemove', e=>{
      const r = card.getBoundingClientRect();
      glow.style.left = (e.clientX - r.left) + 'px';
      glow.style.top  = (e.clientY - r.top) + 'px';
    });
  });
})();