/* ============================================================
   游戏式新手引导 v5（强制聚焦版）
   ============================================================
   游戏引导的核心逻辑：
   1. 全屏深色遮罩 —— 挡住一切
   2. 只有「目标区域」挖洞露出来（可点）
   3. 用户点了目标 → 自动进入下一步（不用再点"下一步"）
   4. 箭头指向目标 + 提示卡在旁边
   5. 其他区域全部不可点（被遮罩挡住）
   ============================================================ */
(function () {
  var K = 'ark_tour_v5';
  var page = location.pathname.split('/').pop() || 'index.html';

  function getS(){ try{ return JSON.parse(localStorage.getItem(K)||'null')||{step:0,done:false}; }catch(e){ return {step:0,done:false}; } }
  function setS(step,done){ try{ localStorage.setItem(K,JSON.stringify({step:step,done:done})); }catch(e){} }

  /* ---------- 流程 ---------- */
  var FLOW = [
    { page:'index.html', sel:'.btn-main', pos:'right',
      title:'点这里，开始第 1 课',
      desc:'<b>点一下这个按钮</b>，就进入第 1 课 —— 我跟着你走。',
      action:'navigate', next:'path.html' },

    { page:'path.html', sel:'.rstep', pos:'right',
      title:'点第一课，开始学习',
      desc:'七步走完，你就能独立讲清楚。<b>点第一个「开始学习」。</b>',
      action:'navigate', next:'ark-what.html' },

    { page:'ark-what.html', sel:'.talk', pos:'right',
      title:'看到这个蓝色框了吗',
      desc:'<b>里面的话可以直接照念</b>，不用自己组织语言。<br>灰色的是出处，核实的时候看。',
      action:'next' },

    { page:'ark-what.html', sel:'.page-nav, .pn', pos:'top',
      title:'看完一页，点这里继续',
      desc:'「下一步」带你到下一课。<b>一直点下去就走完整条路。</b>',
      action:'next' },

    { page:'', sel:'', pos:'center',
      title:'🎉 你学会了！',
      desc:'以后想重看，<b>点顶栏「新手指引」</b>就行。<br>现在开始你的学习吧！',
      action:'end' }
  ];

  var idx = -1, currentStep = -1;
  var mask, hole, card, arrow;
  var guard;   // 阻止非目标区域点击

  /* ---------- 顶栏入口 ---------- */
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

  /* ---------- 构建 UI ---------- */
  function ensureUI(){
    if(mask) return;
    // 遮罩（用 4 个块围出洞 —— 更可靠，且不依赖 CSS 新特性）
    mask = document.createElement('div');
    mask.className='tour-mask';
    mask.innerHTML = '<div class="tm-top"></div><div class="tm-bottom"></div>'
                   + '<div class="tm-left"></div><div class="tm-right"></div>';
    document.body.appendChild(mask);

    hole = document.createElement('div');
    hole.className='tour-hole';
    document.body.appendChild(hole);

    arrow = document.createElement('div');
    arrow.className='tour-arrow';
    document.body.appendChild(arrow);

    card = document.createElement('div');
    card.className='tour-card';
    document.body.appendChild(card);
  }

  function destroy(){
    [mask,hole,arrow,card].forEach(function(e){ if(e) e.remove(); });
    mask=hole=arrow=card=null;
    if(guard){ document.removeEventListener('click', guard, true); guard=null; }
    document.body.style.overflow='';
  }

  /* ---------- 显示某一步 ---------- */
  function show(i){
    var s = FLOW[i];
    if(!s){ endAll(); return; }
    idx = i;
    currentStep = i;
    setS(i,false);
    ensureUI();

    // 目标是空（最后一屏）
    if(!s.sel){
      mask.style.display='block';
      setBox(0,0,window.innerWidth,window.innerHeight);
      hole.style.display='none';
      arrow.style.display='none';
      renderCard(s, true);
      card.className='tour-card tour-center';
      card.style.left='50%'; card.style.top='50%';
      card.style.width = Math.min(340, window.innerWidth-28)+'px';
      return;
    }

    var el = document.querySelector(s.sel.split(',')[0].trim());
    if(!el){ next(); return; }

    // 先清掉旧位置
    if(hole) hole.style.display='none';
    if(card) card.style.display='none';
    if(arrow) arrow.style.display='none';

    // 用「绝对滚动」直达目标（避免 scroll-behavior:smooth 干扰）
    var targetY = window.scrollY + el.getBoundingClientRect().top
                  - (window.innerHeight / 2) + (el.getBoundingClientRect().height / 2);
    targetY = Math.max(0, Math.min(targetY, document.body.scrollHeight - window.innerHeight));

    var prevBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';   // 临时禁用平滑
    window.scrollTo(0, targetY);
    document.documentElement.style.scrollBehavior = prevBehavior;

    // 等一帧，确保滚动与布局完成
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        // 再校正一次（元素可能因图片加载位移）
        var r2 = el.getBoundingClientRect();
        if(r2.top < 70 || r2.bottom > window.innerHeight - 90){
          var abs2 = window.scrollY + r2.top - (window.innerHeight/2) + (r2.height/2);
          window.scrollTo(0, Math.max(0, Math.min(abs2, document.body.scrollHeight - window.innerHeight)));
        }
        setTimeout(function(){ 
          if(idx === i) place(el, s);   // 防竞态
        }, 60);
      });
    });
  }

  /* ---------- 定位（挖洞 + 箭头 + 卡片） ---------- */
  function setBox(top, left, w, h){
    var pad = 8;
    mask.querySelector('.tm-top').style.cssText = 'top:0;left:0;right:0;height:'+Math.max(0,top-pad)+'px';
    mask.querySelector('.tm-bottom').style.cssText = 'top:'+(top+h+pad)+'px;left:0;right:0;bottom:0';
    mask.querySelector('.tm-left').style.cssText = 'top:'+Math.max(0,top-pad)+'px;left:0;width:'+Math.max(0,left-pad)+'px;height:'+(h+pad*2)+'px';
    mask.querySelector('.tm-right').style.cssText = 'top:'+Math.max(0,top-pad)+'px;left:'+(left+w+pad)+'px;right:0;height:'+(h+pad*2)+'px';
  }

  function place(el, s){
    if(!el || !mask || !hole || !card) return;
    var r = el.getBoundingClientRect();
    var pad = 8;
    var top = Math.max(0, r.top - pad);
    var left = r.left - pad;
    var w = r.width + pad*2;
    var h = r.height + pad*2;

    // 挖洞
    mask.style.display='block';
    setBox(top, left, w, h);
    hole.style.display='';
    hole.style.left = left+'px'; hole.style.top = top+'px';
    hole.style.width = w+'px'; hole.style.height = h+'px';

    // 箭头
    if(arrow){
      arrow.style.display='';
      var acx = left + w/2, acy = top + h/2;
      if(s.pos==='right'){ arrow.className='tour-arrow tour-arrow-r'; arrow.style.left=(left+w+4)+'px'; arrow.style.top=acy+'px'; }
      else if(s.pos==='left'){ arrow.className='tour-arrow tour-arrow-l'; arrow.style.left=(left-18)+'px'; arrow.style.top=acy+'px'; }
      else if(s.pos==='top'){ arrow.className='tour-arrow tour-arrow-u'; arrow.style.left=acx+'px'; arrow.style.top=(top-18)+'px'; }
      else { arrow.className='tour-arrow tour-arrow-d'; arrow.style.left=acx+'px'; arrow.style.top=(top+h+4)+'px'; }
    }

    // 卡片
    renderCard(s, false);
    var cw = Math.min(320, window.innerWidth - 24);
    card.className='tour-card';
    card.style.display='';
    card.style.width = cw+'px';
    card.style.transform='none';

    var spaceR = window.innerWidth - (left+w) - 12;
    var spaceL = left - 12;
    var spaceB = window.innerHeight - (top+h) - 12;
    var ch = card.offsetHeight || 190;

    if(spaceR >= cw){
      card.style.left=(left+w+14)+'px';
      card.style.top=Math.max(12, Math.min(top, window.innerHeight-ch-12))+'px';
    } else if(spaceL >= cw){
      card.style.left=(left-cw-14)+'px';
      card.style.top=Math.max(12, Math.min(top, window.innerHeight-ch-12))+'px';
    } else if(spaceB >= ch){
      card.style.left=Math.max(12, Math.min(left, window.innerWidth-cw-12))+'px';
      card.style.top=(top+h+14)+'px';
    } else {
      card.style.left=Math.max(12, Math.min(left, window.innerWidth-cw-12))+'px';
      card.style.top=Math.max(12, top-ch-14)+'px';
    }

    // 兜底：卡片不出屏
    var cRect = card.getBoundingClientRect();
    if(cRect.bottom > window.innerHeight - 8){ card.style.top = Math.max(8, window.innerHeight - ch - 10)+'px'; }
    if(cRect.top < 8){ card.style.top = '10px'; }

    document.body.style.overflow='hidden';
    bindTarget(el, s);
  }

  function bindTarget(el, s){
    if(el.__tourBound) return;
    el.__tourBound = true;
    el.style.position = el.style.position || 'relative';
    el.style.zIndex = '9980';    // 高于遮罩，可点
    el.addEventListener('click', function(ev){
      ev.preventDefault(); ev.stopPropagation();
      if(s.action === 'navigate'){
        setS(idx+1, false);
        // 允许真实跳转
        var href = el.getAttribute('href');
        if(href && href.indexOf('.html') > -1){ location.href = href; }
        else if(s.next){ location.href = s.next; }
        else { next(); }
      } else if(s.action === 'next'){
        next();
      }
    }, {capture:true});
  }

  function renderCard(s, isCenter){
    card.innerHTML =
      '<div class="tour-head"><span class="tour-step">'+(idx+1)+' / '+FLOW.length+'</span>'
      + '<button class="tour-x" type="button">✕</button></div>'
      + '<div class="tour-title">'+s.title+'</div>'
      + '<div class="tour-desc">'+s.desc+'</div>'
      + (isCenter
          ? '<div class="tour-acts"><button class="tour-btn tour-finish" type="button">开始学习 →</button></div>'
          : '<div class="tour-acts"><span class="tour-hint">↑ 点这里继续</span><button class="tour-skip" type="button">跳过</button></div>');

    card.querySelector('.tour-x').addEventListener('click', endAll);
    var sk = card.querySelector('.tour-skip');
    if(sk) sk.addEventListener('click', endAll);
    var fin = card.querySelector('.tour-finish');
    if(fin) fin.addEventListener('click', function(){ endAll(); var t=document.querySelector('.btn-main'); if(t) t.scrollIntoView({behavior:'smooth',block:'center'}); });
  }

  function next(){
    if(idx+1 >= FLOW.length){ endAll(); return; }
    show(idx+1);
  }

  function endAll(){
    setS(FLOW.length-1, true);
    destroy();
  }

  function startAt(i){
    destroy();
    show(i||0);
  }

  window.addEventListener('resize', function(){ if(idx>=0 && FLOW[idx] && FLOW[idx].sel){ var el=document.querySelector(FLOW[idx].sel.split(',')[0].trim()); if(el) place(el, FLOW[idx]); } });

  function init(){
    addEntry();
    var st = getS();
    if(st.done) return;

    // 找出「当前页面」在流程中对应的所有步骤
    var stepsHere = [];
    for(var i=0;i<FLOW.length;i++){ if(FLOW[i].page === page) stepsHere.push(i); }
    if(!stepsHere.length) return;      // 当前页不在流程中 → 不启动

    // 首页首次 → 从第 1 步开始
    if(page === 'index.html' && st.step === 0){ startAt(0); return; }

    // 存档步骤是否落在当前页的步骤里 → 从这里继续
    if(stepsHere.indexOf(st.step) > -1){ startAt(st.step); return; }

    // 存档步骤正好是"上一页的最后一步"（刚跳过来）→ 从当前页第一步继续
    if(st.step > 0 && stepsHere[0] === st.step + 1){ startAt(stepsHere[0]); return; }
    if(stepsHere[0] === st.step){ startAt(stepsHere[0]); }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init,700); });
  else setTimeout(init,700);
})();
