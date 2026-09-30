/* ============================================================
   ARK 学习指南 - 页面增强 v3
   一个可拖动的阿奇球，点开包含所有功能
   ============================================================ */
(function(){
  const FORM = "https://wj.qq.com/s2/28049534/bw59/";
  const inSub = location.pathname.includes('/transcripts/');
  const P = inSub ? '../' : '';
  const ARKIE_SM = P + 'assets/arkie-sm.png';

  /* ---------- 阅读进度条 ---------- */
  const bar = document.createElement('div');
  bar.className = 'read-bar';
  document.body.appendChild(bar);

  /* ---------- 阿奇悬浮球（可拖动） ---------- */
  const dock = document.createElement('div');
  dock.className = 'arkie-fab';
  dock.innerHTML = `
    <div class="af-menu" id="afMenu">
      <a class="af-item" href="${FORM}" target="_blank" rel="noopener">
        <span class="af-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg></span>
        <span>提个建议</span>
      </a>
      <a class="af-item" href="${P}transcripts.html">
        <span class="af-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v14H4z"/><path d="M8 9.5h8M8 13.5h5"/></svg></span>
        <span>看逐字稿</span>
      </a>
      <a class="af-item" href="${P}tools.html">
        <span class="af-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></span>
        <span>查询工具</span>
      </a>
      <div class="af-sep"></div>
      <div class="af-title">去哪看看？</div>
      <a class="af-nav" href="${P}index.html">首页</a>
      <a class="af-nav" href="${P}path.html">学习路径</a>
      <a class="af-nav" href="${P}lecturer.html">讲师板块</a>
      <a class="af-nav" href="${P}ark-safety.html">安全性</a>
      <a class="af-nav" href="${P}query-guide.html">链上查询</a>
      <a class="af-nav" href="${P}qa.html">疑难问答</a>
    </div>
    <button class="af-top-btn" id="afTopBtn" aria-label="回到顶部" type="button">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 18V7"/><path d="M6.5 12.5L12 7l5.5 5.5"/></svg>
      <span>顶部</span>
    </button>
    <button class="af-ball" id="afBall" aria-label="阿奇助手">
      <img src="${ARKIE_SM}" alt="阿奇">
      <span class="af-tip" id="afTip">点我</span>
    </button>
  `;
  document.body.appendChild(dock);

  const ball = document.getElementById('afBall');
  const menu = document.getElementById('afMenu');
  const tip = document.getElementById('afTip');
  let open = false;

  /* ---------- 点击开合 ---------- */
  ball.addEventListener('click', e => {
    e.stopPropagation();
    open = !open;
    if(open && window.updateMenuDirection) window.updateMenuDirection();
    menu.classList.toggle('show', open);
    ball.classList.toggle('active', open);
    tip.classList.remove('show');
  });
  document.addEventListener('click', e => {
    if(open && !dock.contains(e.target)){
      open = false; menu.classList.remove('show'); ball.classList.remove('active');
    }
  });
  document.getElementById('afTopBtn').addEventListener('click', () => {
    window.scrollTo({top:0, behavior:'smooth'});
  });

  /* ---------- 拖动（鼠标 + 触摸）+ 菜单自适应 ---------- */
  (function drag(){
    let dragging=false, moved=false, sx=0, sy=0, ox=0, oy=0;

    function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

    function start(x,y){
      dragging=true; moved=false; sx=x; sy=y;
      const r = dock.getBoundingClientRect();
      ox=r.left; oy=r.top;
      dock.style.left=ox+'px'; dock.style.top=oy+'px';
      dock.style.right='auto'; dock.style.bottom='auto';
      dock.classList.add('dragging');
      ball.classList.add('dragging');
    }
    function move(x,y){
      if(!dragging) return;
      const dx=x-sx, dy=y-sy;
      if(Math.abs(dx)>6||Math.abs(dy)>6) moved=true;
      const nx = clamp(ox+dx, 8, window.innerWidth - dock.offsetWidth - 8);
      const ny = clamp(oy+dy, 8, window.innerHeight - dock.offsetHeight - 8);
      dock.style.left = nx+'px';
      dock.style.top  = ny+'px';
    }
    function end(){
      if(!dragging) return;
      dragging=false; dock.classList.remove('dragging'); ball.classList.remove('dragging');
      updateMenuDirection();
      try{ localStorage.setItem('arkieFabPos', JSON.stringify({l:dock.style.left,t:dock.style.top})); }catch(e){}
    }

    ball.addEventListener('mousedown', e => { if(e.button===0){ start(e.clientX,e.clientY); } });
    document.addEventListener('mousemove', e => move(e.clientX,e.clientY));
    document.addEventListener('mouseup', end);

    ball.addEventListener('touchstart', e => {
      const t=e.touches[0]; start(t.clientX,t.clientY);
      e.preventDefault();
    }, {passive:false});
    document.addEventListener('touchmove', e => {
      if(!dragging) return;
      const t=e.touches[0];
      move(t.clientX,t.clientY);
      e.preventDefault();     // 拖动时阻止页面滚动
    }, {passive:false});
    document.addEventListener('touchend', end);

    // 拖动后抑制点击
    ball.addEventListener('click', e => {
      if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; }
    }, true);

    // 还原位置
    try{
      const p=JSON.parse(localStorage.getItem('arkieFabPos')||'null');
      if(p && p.l){
        dock.style.left=p.l; dock.style.top=p.t;
        dock.style.right='auto'; dock.style.bottom='auto';
      }
    }catch(e){}

    // 菜单方向自适应
    window.updateMenuDirection = updateMenuDirection;
    function updateMenuDirection(){
      const r = dock.getBoundingClientRect();
      // 上方空间不够 → 菜单往下弹
      const above = r.top;
      const below = window.innerHeight - r.bottom;
      menu.classList.toggle('down', above < 320 && below > above);
      // 靠近左边 → 菜单靠左对齐
      menu.classList.toggle('align-left', r.left < window.innerWidth/2);
    }
    window.addEventListener('resize', updateMenuDirection);
    setTimeout(updateMenuDirection, 100);
  })();

  /* ---------- 首次提示 ---------- */
  try{
    if(!sessionStorage.getItem('arkieTip')){
      setTimeout(()=>tip.classList.add('show'), 2200);
      setTimeout(()=>tip.classList.remove('show'), 7000);
      sessionStorage.setItem('arkieTip','1');
    }
  }catch(e){}

  /* ---------- 滚动 ---------- */
  const header = document.querySelector('.site-header');
  let ticking=false;
  function onScroll(){
    const y = window.scrollY || document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h>0 ? (y/h*100) : 0) + '%';
    if(header) header.classList.toggle('scrolled', y > 20);
    const tb = document.getElementById('afTopBtn');
    if(tb) tb.classList.toggle('show', y > 400);
    dock.classList.toggle('compact', y > 300);
    ticking=false;
  }
  window.addEventListener('scroll', () => {
    if(!ticking){ requestAnimationFrame(onScroll); ticking=true; }
  }, {passive:true});
  onScroll();

  /* ---------- 逐字稿库 ---------- */
  if(document.getElementById('transcriptApp')) initTranscripts();

  function initTranscripts(){
    const REPO = "https://raw.githubusercontent.com/ark-notes/ark-transcripts/main/";
    const listView=document.getElementById('listView'), readView=document.getElementById('readView');
    const tbody=document.getElementById('tbody'), tempty=document.getElementById('tempty');
    const search=document.getElementById('search');
    let files=[], curFilter='all';
    const MAP={"鏅氶棿AMA":"晚间AMA","鏅ㄩ棿":"晨间","澶滆亰":"夜聊","鍗堣":"午课"};
    function cleanName(n){ let s=n.replace(/\.txt$/,''); for(const[b,g] of Object.entries(MAP)) s=s.split(b).join(g); return s; }
    function kindOf(n){ const s=cleanName(n);
      if(s.includes('晚间AMA'))return'晚间AMA'; if(s.includes('晨间'))return'晨间';
      if(s.includes('夜聊'))return'夜聊'; if(s.includes('午课'))return'午课'; return'课程'; }

    fetch('data/index.json').then(r=>r.json()).then(d=>{ files=d; render(); })
      .catch(()=>{ tbody.innerHTML='<div class="loading">索引加载失败</div>'; });

    function render(){
      const q=(search.value||'').trim().toLowerCase();
      const rows=files.filter(f=>{
        if(curFilter!=='all' && kindOf(f.name)!==curFilter) return false;
        if(!q) return true;
        return (cleanName(f.name)+' '+f.name).toLowerCase().includes(q);
      });
      if(!rows.length){ tbody.innerHTML=''; tempty.style.display='block'; return; }
      tempty.style.display='none';
      tbody.innerHTML=rows.map(f=>`
        <div class="titem" data-name="${f.name}">
          <div class="titem-main">
            <div class="titem-title">${cleanName(f.name)}</div>
            <div class="titem-meta">${f.size ? (f.size/1024).toFixed(0)+' KB' : ''}</div>
          </div>
          <span class="titem-badge">${kindOf(f.name)}</span>
        </div>`).join('');
    }
    search.addEventListener('input', render);
    document.getElementById('filters').addEventListener('click', e=>{
      const b=e.target.closest('.fbtn'); if(!b) return;
      document.querySelectorAll('.fbtn').forEach(x=>x.classList.remove('on'));
      b.classList.add('on'); curFilter=b.dataset.k; render();
    });
    tbody.addEventListener('click', e=>{
      const el=e.target.closest('.titem'); if(!el) return; open(el.dataset.name);
    });
    document.getElementById('rBack').addEventListener('click', ()=>{
      readView.classList.remove('on'); listView.style.display=''; window.scrollTo({top:0});
    });
    function open(name){
      listView.style.display='none'; readView.classList.add('on');
      document.getElementById('rTitle').textContent=cleanName(name);
      document.getElementById('rBody').innerHTML='<div class="loading">加载中…</div>';
      window.scrollTo({top:0});
      fetch(REPO+encodeURIComponent(name))
        .then(r=>{ if(!r.ok) throw new Error(r.status); return r.text(); })
        .then(txt=>{
          const lines=txt.split('\n');
          document.getElementById('rMeta').textContent=lines.length+' 行';
          document.getElementById('rBody').innerHTML=lines.map(ln=>{
            ln=ln.trim(); if(!ln) return '';
            if(ln.startsWith('[')&&ln.includes(']')){
              const ts=ln.slice(1,ln.indexOf(']')), body=ln.slice(ln.indexOf(']')+1).trim();
              return `<p class="ts-line"><span class="ts">${ts}</span>${esc(body)}</p>`;
            }
            return `<p>${esc(ln)}</p>`;
          }).join('');
        })
        .catch(e=>{ document.getElementById('rBody').innerHTML='<div class="loading">读取失败：'+e.message+'</div>'; });
    }
    function esc(s){ return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  }
})();
