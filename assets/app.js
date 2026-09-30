/* ============================================================
   ARK 学习指南 — 页面增强 + 阿奇助手 + 逐字稿读取
   ============================================================ */
(function(){
  const FORM = "https://wj.qq.com/s2/28049534/bw59/";
  const REPO = "https://raw.githubusercontent.com/ark-notes/ark-transcripts/main/";
  const inSub = location.pathname.includes('/transcripts/');
  const P = inSub ? '../' : '';
  const ARKIE_SM = P + 'assets/arkie-sm.png';

  /* ---------- 阅读进度条 ---------- */
  const bar = document.createElement('div');
  bar.className = 'read-bar';
  document.body.appendChild(bar);

  /* ---------- 右下角功能区 ---------- */
  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.innerHTML = `
    <div class="dock-menu" id="dockMenu">
      <div class="dm-title">去哪看看？</div>
      <a class="dm-item" href="${P}index.html">首页</a>
      <a class="dm-item" href="${P}path.html">学习路径</a>
      <a class="dm-item" href="${P}lecturer.html">讲师板块</a>
      <a class="dm-item" href="${P}howto.html">怎么讲</a>
      <a class="dm-item" href="${P}soul-five.html">灵魂五问</a>
      <a class="dm-item" href="${P}query-guide.html">链上查询</a>
      <a class="dm-item" href="${P}qa.html">疑难问答</a>
      <a class="dm-item" href="${P}transcripts.html">逐字稿库</a>
    </div>
    <div class="dock-stack">
      <a class="dock-pill dock-back" id="dockBack" href="${P}index.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        <span>返回</span>
      </a>
      <button class="dock-pill dock-top" id="dockTop" aria-label="返回顶部">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 18V7"/><path d="M6.5 12.5L12 7l5.5 5.5"/></svg>
        <span>顶部</span>
      </button>
      <a class="dock-pill dock-cta" href="${FORM}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>
        <span>提个建议</span>
        <span class="dp-dot"></span>
      </a>
    </div>
    <button class="dock-arkie" id="dockArkie" aria-label="阿奇助手">
      <img src="${ARKIE_SM}" alt="阿奇">
      <span class="tip" id="arkieTip">点我导航</span>
    </button>
  `;
  document.body.appendChild(dock);

  const arkieBtn = document.getElementById('dockArkie');
  const menu = document.getElementById('dockMenu');
  const topBtn = document.getElementById('dockTop');
  const backBtn = document.getElementById('dockBack');
  const tip = document.getElementById('arkieTip');
  let open = false;

  arkieBtn.addEventListener('click', e=>{
    e.stopPropagation();
    open = !open;
    menu.classList.toggle('show', open);
    tip.classList.remove('show');
  });
  document.addEventListener('click', e=>{
    if(open && !dock.contains(e.target)){ open=false; menu.classList.remove('show'); }
  });
  topBtn.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));

  // 返回按钮逻辑
  if(backBtn){
    const page = location.pathname.split('/').pop() || 'index.html';
    const backMap = {
      'lecturer-15.html':'lecturer.html','lecturer-30.html':'lecturer.html',
      'lecturer-60.html':'lecturer.html','lecturer-online.html':'lecturer.html',
    };
    if(page === 'index.html' || page === ''){ backBtn.style.display='none'; }
    else if(backMap[page]){ backBtn.href = backMap[page]; }
    else { backBtn.href = 'index.html'; }
  }

  // 首次提示
  try{
    if(!sessionStorage.getItem('arkieTip')){
      setTimeout(()=>tip.classList.add('show'), 2000);
      setTimeout(()=>tip.classList.remove('show'), 7000);
      sessionStorage.setItem('arkieTip','1');
    }
  }catch(e){}

  /* ---------- 兼容：确保导航吸顶 ---------- */
  (function fixSticky(){
    const h = document.querySelector('.site-header');
    if(!h) return;
    // 移动端 overflow 可能导致 sticky 失效，用 fixed 兜底
    function check(){
      const r = h.getBoundingClientRect();
      if(window.scrollY > 10 && r.top < -5){
        h.style.position = 'fixed';
        h.style.top = '0';
        h.style.left = '0';
        h.style.right = '0';
        document.body.style.paddingTop = h.offsetHeight + 'px';
      }
    }
    window.addEventListener('scroll', check, {passive:true});
  })();

  /* ---------- 滚动 ---------- */
  const header = document.querySelector('.site-header');
  let ticking = false;
  function onScroll(){
    const y = window.scrollY || document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h>0 ? (y/h*100) : 0) + '%';
    if(header) header.classList.toggle('scrolled', y > 20);
    topBtn.classList.toggle('show', y > 300);
    ticking = false;
  }
  window.addEventListener('scroll', ()=>{
    if(!ticking){ requestAnimationFrame(onScroll); ticking = true; }
  }, {passive:true});
  onScroll();

  /* ============================================================
     逐字稿库（从 ark-transcripts 仓库直接读取）
     ============================================================ */
  if(document.getElementById('transcriptApp')){
    initTranscripts();
  }

  function initTranscripts(){
    const listView = document.getElementById('listView');
    const readView = document.getElementById('readView');
    const tbody = document.getElementById('tbody');
    const tempty = document.getElementById('tempty');
    const search = document.getElementById('search');
    let files = [], curFilter = 'all';

    // 乱码名映射
    const MAP = {
      "鏅氶棿AMA":"晚间AMA","鏅ㄩ棿":"晨间","澶滆亰":"夜聊","鍗堣":"午课"
    };
    function cleanName(n){
      let s = n.replace(/\.txt$/,'');
      for(const [bad,good] of Object.entries(MAP)) s = s.split(bad).join(good);
      return s;
    }
    function kindOf(n){
      const s = cleanName(n);
      if(s.includes('晚间AMA')) return '晚间AMA';
      if(s.includes('晨间')) return '晨间';
      if(s.includes('夜聊')) return '夜聊';
      if(s.includes('午课')) return '午课';
      return '课程';
    }

    fetch('data/index.json')
      .then(r=>r.json())
      .then(d=>{ files=d; render(); })
      .catch(()=>{
        tbody.innerHTML='<div class="loading">索引加载失败，请检查 data/index.json</div>';
      });

    function render(){
      const q = (search.value||'').trim().toLowerCase();
      const rows = files.filter(f=>{
        if(curFilter!=='all' && kindOf(f.name)!==curFilter) return false;
        if(!q) return true;
        return (cleanName(f.name)+' '+f.name).toLowerCase().includes(q);
      });
      if(!rows.length){
        tbody.innerHTML=''; tempty.style.display='block'; return;
      }
      tempty.style.display='none';
      tbody.innerHTML = rows.map(f=>`
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
      const el=e.target.closest('.titem'); if(!el) return;
      open(el.dataset.name);
    });

    document.getElementById('rBack').addEventListener('click', ()=>{
      readView.classList.remove('on');
      listView.style.display='';
      window.scrollTo({top:0});
    });

    function open(name){
      listView.style.display='none';
      readView.classList.add('on');
      document.getElementById('rTitle').textContent = cleanName(name);
      document.getElementById('rBody').innerHTML = '<div class="loading">加载中…</div>';
      window.scrollTo({top:0});

      fetch(REPO + encodeURIComponent(name))
        .then(r=>{ if(!r.ok) throw new Error(r.status); return r.text(); })
        .then(txt=>{
          const lines = txt.split('\n');
          document.getElementById('rMeta').textContent = lines.length + ' 行';
          document.getElementById('rBody').innerHTML = lines.map(ln=>{
            ln = ln.trim(); if(!ln) return '';
            if(ln.startsWith('[') && ln.includes(']')){
              const ts = ln.slice(1, ln.indexOf(']'));
              const body = ln.slice(ln.indexOf(']')+1).trim();
              return `<p class="ts-line"><span class="ts">${ts}</span>${esc(body)}</p>`;
            }
            return `<p>${esc(ln)}</p>`;
          }).join('');
        })
        .catch(e=>{
          document.getElementById('rBody').innerHTML =
            '<div class="loading">读取失败：'+e.message+'<br><br>请确认文件已上传到 ark-transcripts 仓库。</div>';
        });
    }

    function esc(s){ return s.replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  }

  /* ---------- 卡片光点跟随 ---------- */
  document.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX-r.left)+'px');
      card.style.setProperty('--my', (e.clientY-r.top)+'px');
    });
  });
})();
