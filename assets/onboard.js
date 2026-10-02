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
      title:'欢迎！先点这里',
      desc:'点这个金色按钮，我带你走一遍。',
      action:'navigate' },

    { page:'path.html', sel:'.rstep', pos:'right',
      title:'这是七步学习路径',
      desc:'点第一个开始 —— 走完七步，你就能独立讲清楚。',
      action:'navigate' },

    { page:'ark-what.html', sel:'.talk', pos:'bottom',
      title:'这里的话可以直接照念',
      desc:'蓝色框里的话，照着念就行，不用自己组织语言。<br>看完了点底部的「下一步」。',
      action:'done',
      btn:'我知道了 →' }
  ];

  var idx = -1, currentStep = -1, manualStart = false;
  var touchedEls = [];   // 记录被改过样式的元素
  var mask, hole, card;
  var guard;   // 阻止非目标区域点击

  /* ---------- 顶栏入口 ---------- */
  function addEntry(){
    var wrap=document.querySelector('.site-header .wrap');
    if(!wrap||wrap.querySelector('.ob-entry')) return;
    var b=document.createElement('button');
    b.className='ob-entry'; b.type='button';
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.9 4.6 5 .4-3.8 3.3 1.1 4.9L12 13.7 7.8 16.2l1.1-4.9L5.1 8l5-.4z"/></svg><span>新手指引</span>';
    b.addEventListener('click',function(){
      // 手动点 = 强制从头开始（清掉进度）
      try{ localStorage.removeItem(K); }catch(e){}
      manualStart = true;
      startAt(0);
    });
    var g=wrap.querySelector('.nav-guest');
    if(g) wrap.insertBefore(b,g); else wrap.appendChild(b);
  }

  /* ---------- 构建 UI ---------- */
  function ensureUI(){
    if(mask) return;
    // 引导期间隐藏悬浮球（避免冲突）
    var dock=document.querySelector('.arkie-fab');
    if(dock){ dock.dataset.tourHidden='1'; dock.style.setProperty('display','none','important'); }
    var topBtn=document.querySelector('.af-top-btn');
    if(topBtn){ topBtn.dataset.tourHidden='1'; topBtn.style.setProperty('display','none','important'); }
    // 隐藏底部条（避免与引导卡重叠）
    var bb=document.querySelector('.bottom-bar');
    if(bb){ bb.dataset.tourHidden='1'; bb.style.setProperty('display','none','important'); }
    // 遮罩（用 4 个块围出洞 —— 更可靠，且不依赖 CSS 新特性）
    mask = document.createElement('div');
    mask.className='tour-mask';
    mask.innerHTML = '<div class="tm-top"></div><div class="tm-bottom"></div>'
                   + '<div class="tm-left"></div><div class="tm-right"></div>';
    document.body.appendChild(mask);

    hole = document.createElement('div');
    hole.className='tour-hole';
    document.body.appendChild(hole);


    card = document.createElement('div');
    card.className='tour-card';
    document.body.appendChild(card);
  }

  function destroy(){
    // ⓪ 恢复被改过样式的元素（关键！否则 z-index 残留会盖住其他元素）
    touchedEls.forEach(function(t){
      try{
        t.el.style.zIndex = t.z || '';
        t.el.style.position = t.pos || '';
        delete t.el.__tourBound;
      }catch(e){}
    });
    touchedEls = [];

    // ① 先禁用过渡，避免离场动画留残影
    [mask,hole,card].forEach(function(e){
      if(!e) return;
      e.style.transition='none';
      e.style.animation='none';
      // 释放可能产生合成层的属性
      e.style.backdropFilter='none';
      e.style.webkitBackdropFilter='none';
      e.style.transform='none';
      e.style.opacity='0';
      e.style.visibility='hidden';
    });

    // ② 下一帧再真正移除（避免同步移除导致合成层残留）
    var toRemove = [mask, hole, card];
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        toRemove.forEach(function(e){ if(e && e.parentNode) e.parentNode.removeChild(e); });
        // ③ 强制重排 / 重绘（关键：释放合成层）
        void document.body.offsetHeight;
        // ④ 触发一次无意义的滚动抖动，逼浏览器重绘
        var y = window.scrollY;
        window.scrollTo(0, y + 1);
        window.scrollTo(0, y);
      });
    });

    mask=hole=card=null;

    // ⑤ 恢复被隐藏的元素
    var dock=document.querySelector('.arkie-fab');
    if(dock && dock.dataset.tourHidden){ dock.style.removeProperty('display'); delete dock.dataset.tourHidden; }
    var topBtn=document.querySelector('.af-top-btn');
    if(topBtn && topBtn.dataset.tourHidden){ topBtn.style.removeProperty('display'); delete topBtn.dataset.tourHidden; }
    var bb=document.querySelector('.bottom-bar');
    if(bb && bb.dataset.tourHidden){ bb.style.removeProperty('display'); delete bb.dataset.tourHidden; }

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
    var pad = 6;
    mask.querySelector('.tm-top').style.cssText = 'top:0;left:0;right:0;height:'+Math.max(0,top-pad)+'px';
    mask.querySelector('.tm-bottom').style.cssText = 'top:'+(top+h+pad)+'px;left:0;right:0;bottom:0';
    mask.querySelector('.tm-left').style.cssText = 'top:'+Math.max(0,top-pad)+'px;left:0;width:'+Math.max(0,left-pad)+'px;height:'+(h+pad*2)+'px';
    mask.querySelector('.tm-right').style.cssText = 'top:'+Math.max(0,top-pad)+'px;left:'+(left+w+pad)+'px;right:0;height:'+(h+pad*2)+'px';
  }

  function place(el, s){
    if(!el || !mask || !hole || !card) return;
    var r = el.getBoundingClientRect();
    var pad = 6;
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


    // 卡片：改为底部固定面板（不覆盖高亮区）
    renderCard(s, false);
    var cw = Math.min(window.innerWidth - 24, 420);
    card.className='tour-card tour-bottom';
    card.style.display='';
    card.style.width = cw+'px';
    card.style.left = '50%';
    card.style.transform = 'translateX(-50%)';
    card.style.top = 'auto';
    document.body.style.overflow='hidden';
    bindTarget(el, s);
    return;

    var spaceR = window.innerWidth - (left+w) - 12;
    var spaceL = left - 12;
    var spaceB = window.innerHeight - (top+h) - 12;
    var ch = card.offsetHeight || 190;

  }

  function bindTarget(el, s){
    if(el.__tourBound) return;
    el.__tourBound = true;
    // 记录原值（结束后恢复，避免 z-index 残留盖住其他元素）
    touchedEls.push({el:el, z:el.style.zIndex||'', pos:el.style.position||''});
    el.style.position = el.style.position || 'relative';
    el.style.zIndex = '9968';    // 高于遮罩(9960)、低于卡片(9975)
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
      + (isCenter || s.btn
          ? '<div class="tour-acts"><button class="tour-btn tour-finish" type="button">'+(s.btn||'开始学习 →')+'</button></div>'
          : '<div class="tour-acts"><span class="tour-hint">↑ 点这里继续</span><button class="tour-skip" type="button">跳过</button></div>');

    card.querySelector('.tour-x').addEventListener('click', endAll);
    var sk = card.querySelector('.tour-skip');
    if(sk) sk.addEventListener('click', endAll);
    var fin = card.querySelector('.tour-finish');
    if(fin) fin.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      var isLast = (idx === FLOW.length - 1);
      endAll();
      if(isLast){
        // 最后一步：如果当前页有主按钮就滚过去
        var t=document.querySelector('.btn-main');
        if(t) t.scrollIntoView({behavior:'smooth',block:'center'});
      }
    });
  }

  function next(){
    if(idx+1 >= FLOW.length){ endAll(); return; }
    show(idx+1);
  }

  function endAll(){
    setS(FLOW.length-1, true);
    manualStart = false;
    destroy();
  }

  function startAt(i){
    destroy();
    show(i||0);
  }

  window.addEventListener('resize', function(){ if(idx>=0 && FLOW[idx] && FLOW[idx].sel){ var el=document.querySelector(FLOW[idx].sel.split(',')[0].trim()); if(el) place(el, FLOW[idx]); } });

  function init(){
    addEntry();
    if(manualStart) return;    // 手动点过 → 不自动恢复
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

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init,120); });
  else setTimeout(init,120);
})();
