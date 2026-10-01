/* ============================================================
   新人引导 v4 · 游戏式（操作流）
   设计原则：
   1. 不遮罩 / 轻微遮罩 —— 内容可操作
   2. 提示浮在旁边（辅助），不挡视线
   3. 每一步「引导用户真的点」→ 真的跳转 → 引导继续
   4. 高亮目标 + 动态指向
   5. 可跳过、可重看（顶栏入口）
   ============================================================ */
(function () {
  var K = 'ark_tour_v4';
  var page = location.pathname.split('/').pop() || 'index.html';

  function getS(){ try{ return JSON.parse(localStorage.getItem(K)||'null')||{step:0,done:false}; }catch(e){ return {step:0,done:false}; } }
  function setS(step,done){ try{ localStorage.setItem(K,JSON.stringify({step:step,done:done})); }catch(e){} }

  /* ---------- 引导流程定义（跨页面） ---------- */
  var FLOW = [
    { page:'index.html', sel:'.btn-main', pos:'right',
      title:'第一步：点这个金色按钮',
      desc:'它会带你进第 1 课。<b>点一下试试</b> —— 我会跟着你走。',
      advance:'click' },                       // 用户点击后进入下一步
    { page:'path.html', sel:'.rstep', pos:'right',
      title:'这是你的学习路径',
      desc:'七步走完，你就能独立讲清楚。<b>点第一个「开始学习」。</b>',
      advance:'click' },
    { page:'ark-what.html', sel:'.talk', pos:'right',
      title:'看到这个蓝色框了吗',
      desc:'<b>里面的话可以直接照念</b>，不用自己组织语言。灰色的是出处。',
      advance:'next' },
    { page:'ark-what.html', sel:'.page-nav, .pn', pos:'top',
      title:'看完一页，点这里继续',
      desc:'「下一步」会带你到下一课。<b>一直点下去就能走完整条路。</b>',
      advance:'next' },
    { page:'', sel:'', pos:'center',
      title:'🎉 你学会了！',
      desc:'以后任何时候想重看，<b>点顶栏「新手指引」</b>就行。<br>现在开始你的学习吧！',
      advance:'end' }
  ];

  var idx = -1;

  /* ---------- 顶栏入口（全站） ---------- */
  function addEntry(){
    var wrap=document.querySelector('.site-header .wrap');
    if(!wrap||wrap.querySelector('.ob-entry')) return;
    var b=document.createElement('button');
    b.className='ob-entry'; b.type='button';
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg><span>新手指引</span>';
    b.addEventListener('click',function(){ startAt(0); });
    var g=wrap.querySelector('.nav-guest');
    if(g) wrap.insertBefore(b,g); else wrap.appendChild(b);
  }

  /* ---------- 渲染提示卡（浮动，不遮罩） ---------- */
  var card, ring, arrow;
  function ensureUI(){
    if(!card){
      card=document.createElement('div'); card.className='tour-card';
      document.body.appendChild(card);
    }
    if(!ring){
      ring=document.createElement('div'); ring.className='tour-ring';
      document.body.appendChild(ring);
    }
    if(!arrow){
      arrow=document.createElement('div'); arrow.className='tour-arrow';
      document.body.appendChild(arrow);
    }
  }

  function clearUI(){
    if(ring) ring.style.display='none';
    if(arrow) arrow.style.display='none';
    if(card) card.style.display='none';
  }

  function destroy(){
    clearUI();
    if(card) card.remove();
    if(ring) ring.remove();
    if(arrow) arrow.remove();
    card=ring=arrow=null;
  }

  function findStep(){
    // 找当前页面对应的步骤（跳过已过的页）
    for(var i=0;i<FLOW.length;i++){
      if(FLOW[i].page === page) return i;
    }
    // 跨页系列中：找"当前页是流程的一部分"
    return -1;
  }

  function show(i){
    var s = FLOW[i];
    if(!s) return;
    idx = i;
    ensureUI();
    setS(i,false);

    // 目标元素
    var el = s.sel ? document.querySelector(s.sel.split(',')[0].trim()) : null;

    // 滚动到目标
    if(el){
      var r0 = el.getBoundingClientRect();
      if(r0.top < 90 || r0.bottom > window.innerHeight - 120){
        el.scrollIntoView({behavior:'smooth',block:'center'});
      }
    }

    setTimeout(function(){ layout(el, s); }, el?420:60);
  }

  function layout(el, s){
    var isLast = (s.advance === 'end');
    // 卡片内容
    card.innerHTML =
      '<div class="tour-head"><span class="tour-step">'+(idx+1)+' / '+FLOW.length+'</span>'
      + '<button class="tour-x" type="button" aria-label="关闭">✕</button></div>'
      + '<div class="tour-title">'+s.title+'</div>'
      + '<div class="tour-desc">'+s.desc+'</div>'
      + '<div class="tour-acts">'
      + (isLast
          ? '<button class="tour-btn tour-finish" type="button">开始学习 →</button>'
          : '<button class="tour-btn tour-next" type="button">'
            + (s.advance==='click' ? '我点好了，下一步 →' : '下一步 →') + '</button>')
      + '<button class="tour-skip" type="button">跳过</button>'
      + '</div>';

    card.querySelector('.tour-x').addEventListener('click', function(){ endAll(); });
    card.querySelector('.tour-skip').addEventListener('click', function(){ endAll(); });
    var nb = card.querySelector('.tour-next');
    if(nb) nb.addEventListener('click', function(){ next(); });
    var fb = card.querySelector('.tour-finish');
    if(fb) fb.addEventListener('click', function(){
      endAll();
      var t=document.querySelector('.btn-main');
      if(t) t.scrollIntoView({behavior:'smooth',block:'center'});
    });

    // 定位
    card.style.display='';
    var cw = Math.min(330, window.innerWidth - 24);
    card.style.width = cw+'px';

    if(!el || s.pos === 'center'){
      ring.style.display='none'; arrow.style.display='none';
      card.style.left = '50%'; card.style.top = '50%';
      card.style.transform = 'translate(-50%,-50%)';
      return;
    }

    var r = el.getBoundingClientRect();
    var pad = 8;
    var rect = { top:r.top-pad, left:r.left-pad, w:r.width+pad*2, h:r.height+pad*2 };

    // 高亮框
    ring.style.display='';
    ring.style.left = rect.left+'px'; ring.style.top = rect.top+'px';
    ring.style.width = rect.w+'px'; ring.style.height = rect.h+'px';

    // 卡片位置（优先放目标旁；放不下换边）
    var gap = 14;
    var ch = card.offsetHeight || 200;
    var spaceRight = window.innerWidth - (rect.left + rect.w);
    var spaceLeft = rect.left;
    var spaceBelow = window.innerHeight - (rect.top + rect.h);
    var spaceAbove = rect.top;

    var place = '';
    if(spaceRight >= cw + gap) place='right';
    else if(spaceLeft >= cw + gap) place='left';
    else if(spaceBelow >= ch + gap) place='bottom';
    else if(spaceAbove >= ch + gap) place='top';
    else place='center';

    card.style.transform='none';
    if(place==='right'){
      card.style.left=(rect.left+rect.w+gap)+'px';
      card.style.top=Math.max(12, Math.min(rect.top, window.innerHeight-ch-12))+'px';
    } else if(place==='left'){
      card.style.left=(rect.left-cw-gap)+'px';
      card.style.top=Math.max(12, Math.min(rect.top, window.innerHeight-ch-12))+'px';
    } else if(place==='bottom'){
      card.style.left=Math.max(12, Math.min(rect.left, window.innerWidth-cw-12))+'px';
      card.style.top=(rect.top+rect.h+gap)+'px';
    } else if(place==='top'){
      card.style.left=Math.max(12, Math.min(rect.left, window.innerWidth-cw-12))+'px';
      card.style.top=Math.max(12, rect.top-ch-gap)+'px';
    } else {
      card.style.left='50%'; card.style.top='50%'; card.style.transform='translate(-50%,-50%)';
    }

    // 箭头指向目标
    if(place!=='center'){
      arrow.style.display='';
      var acx = rect.left + rect.w/2, acy = rect.top + rect.h/2;
      if(place==='right'){ arrow.style.left=(rect.left+rect.w+2)+'px'; arrow.style.top=acy+'px'; arrow.className='tour-arrow tour-arrow-r'; }
      else if(place==='left'){ arrow.style.left=(rect.left-16)+'px'; arrow.style.top=acy+'px'; arrow.className='tour-arrow tour-arrow-l'; }
      else if(place==='bottom'){ arrow.style.left=acx+'px'; arrow.style.top=(rect.top+rect.h+2)+'px'; arrow.className='tour-arrow tour-arrow-d'; }
      else if(place==='top'){ arrow.style.left=acx+'px'; arrow.style.top=(rect.top-16)+'px'; arrow.className='tour-arrow tour-arrow-u'; }
    } else {
      arrow.style.display='none';
    }
  }

  function next(){
    var cur = FLOW[idx];
    // 如果是"点击进入下一步"类型，跳转到对应页
    if(cur && cur.advance==='click' && idx+1 < FLOW.length){
      var nxt = FLOW[idx+1];
      setS(idx+1,false);
      if(nxt.page && nxt.page !== page){ location.href = nxt.page; return; }
    }
    if(idx+1 >= FLOW.length){ endAll(); return; }
    show(idx+1);
  }

  function endAll(){
    setS(FLOW.length-1, true);
    destroy();
  }

  function startAt(i){
    if(!card) ensureUI();
    show(i||0);
  }

  window.addEventListener('resize', function(){ if(idx>=0 && FLOW[idx]) layout(document.querySelector(FLOW[idx].sel?FLOW[idx].sel.split(',')[0].trim():''), FLOW[idx]); });
  window.addEventListener('scroll', function(){ if(idx>=0 && FLOW[idx]) layout(document.querySelector(FLOW[idx].sel?FLOW[idx].sel.split(',')[0].trim():''), FLOW[idx]); }, {passive:true});

  function init(){
    addEntry();
    var st = getS();
    if(st.done) return;

    // 跨页续接：如果"当前页"是流程的一步，接着显示
    var here = -1;
    for(var i=0;i<FLOW.length;i++){ if(FLOW[i].page === page){ here = i; break; } }

    if(here >= 0){
      // 首页：首次自动开始；其他页：只在"正在引导中"才续接
      if(page === 'index.html' && st.step === 0){ startAt(0); return; }
      if(st.step >= 0 && st.step <= here + 1 && !st.done){
        // 只有当存档步骤对应这一步（或前一步）时才续
        if(st.step === here || st.step === here - 1 || (page==='path.html' && st.step===1) || (page==='ark-what.html' && st.step>=2)){
          startAt(here);
        }
      }
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init,700); });
  else setTimeout(init,700);
})();
