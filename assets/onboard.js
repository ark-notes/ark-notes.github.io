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
      action:'navigate', goto:'path.html' },

    { page:'path.html', sel:'.rstep', pos:'right',
      title:'这是七步学习路径',
      desc:'点第一个开始 —— 走完七步，你就能独立讲清楚。',
      action:'navigate', goto:'ark-what.html' },

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
    mask.className = 'tour-mask';
    /* 单块遮罩 + 用 clip-path 挖洞（不会出现拼接处的深浅不一） */
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

    /* 只在目标真的不在视口里才滚动。
       目标本来就在首屏可见时不动 —— 避免把页面推走导致错位。 */
    var r0 = el.getBoundingClientRect();
    var SAFE_TOP = 80, SAFE_BOTTOM = window.innerHeight - 120;
    var needScroll = (r0.top < SAFE_TOP) || (r0.bottom > SAFE_BOTTOM);

    if(needScroll){
      var targetY = window.scrollY + r0.top
                    - (window.innerHeight / 2) + (r0.height / 2);
      targetY = Math.max(0, Math.min(targetY, document.body.scrollHeight - window.innerHeight));
      var prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';   // 临时禁用平滑
      window.scrollTo(0, targetY);
      document.documentElement.style.scrollBehavior = prevBehavior;
    }

    // 等一帧，确保滚动与布局完成
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        // 再校正一次（元素可能因图片加载位移）
        var r2 = el.getBoundingClientRect();
        if(r2.top < SAFE_TOP || r2.bottom > SAFE_BOTTOM){
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
  /* 四块围出矩形洞：
     top / bottom 负责上下（满宽）
     left / right 只负责「洞那一行」的左右，因此高度必须等于洞高，
     且上下边界要与 top 的底、bottom 的顶严丝合缝（否则出现漏光横带）。 */
  /* ---------- 定位（用 clip-path 挖洞，单块遮罩） ---------- */
  function setBox(top, left, w, h){
    if(!mask) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var bt = Math.max(0, Math.min(Math.round(top), vh));
    var bl = Math.max(0, Math.min(Math.round(left), vw));
    var bb = Math.max(bt, Math.min(Math.round(top + h), vh));
    var br = Math.max(bl, Math.min(Math.round(left + w), vw));
    /* 用 evenodd 在遮罩里"挖"出一个矩形 */
    mask.style.clipPath =
      'polygon(evenodd,' +
        '0 0,' + vw + 'px 0,' + vw + 'px ' + vh + 'px,0 ' + vh + 'px,0 0,' +
        bl + 'px ' + bt + 'px,' +
        bl + 'px ' + bb + 'px,' +
        br + 'px ' + bb + 'px,' +
        br + 'px ' + bt + 'px,' +
        bl + 'px ' + bt + 'px)';
    mask.style.webkitClipPath = mask.style.clipPath;
  }

  function place(el, s){
    if(!el || !mask || !hole || !card) return;

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var GAP = 12;                                  // 高亮区与卡片之间的间距
    var PAD = 4;                                   // 高亮区外扩

    /* 顶栏底部：卡片不能盖住顶栏 */
    var hdrEl = document.querySelector('.site-header');
    var HDR = hdrEl ? Math.round(hdrEl.getBoundingClientRect().bottom) + 8 : 72;

    /* ---------- 第一步：先把卡片渲染出来，量它的真实高度 ---------- */
    renderCard(s, false);
    var cw = Math.min(vw - 24, 420);
    card.style.display = '';
    card.style.width = cw + 'px';
    card.style.left = '50%';
    card.style.transform = 'translateX(-50%)';
    card.style.top = '0px';
    card.style.bottom = 'auto';
    card.style.maxHeight = 'none';
    card.style.height = 'auto';
    var bodyEl = card.querySelector('.tour-body');
    if(bodyEl) bodyEl.style.maxHeight = 'none';    // 先放开，量完整高度

    /* 卡片最多能占多高：屏幕 - 顶栏 - 上间距 - 下间距 */
    var cardMax = Math.max(140, vh - HDR - GAP - 16);
    var cardH  = card.offsetHeight;
    var cardClipped = false;
    if(cardH > cardMax){
      cardH = cardMax;
      card.style.maxHeight = cardMax + 'px';
      card.style.height = cardMax + 'px';
      card.style.overflowY = 'hidden';
      /* 正文区滚动，操作按钮固定可见 */
      if(bodyEl) bodyEl.style.maxHeight = Math.max(48, cardMax - 104) + 'px';
      cardClipped = true;
    }
    document.body.style.overflow = 'hidden';

    /* ---------- 第二步：算出高亮区能占多高 ---------- */
    var r = el.getBoundingClientRect();
    var top  = Math.max(0, Math.round(r.top  - PAD));
    var left = Math.round(r.left - PAD);
    var w    = Math.round(r.width  + PAD*2);
    var h    = Math.round(r.height + PAD*2);
    if(left < 0){ w += left; left = 0; }
    if(left + w > vw){ w = vw - left; }

    /* 高亮区 + 卡片（+ 间距）必须放得进屏幕。
       关键：这里要按「自然位置」算，并保证 top + h + GAP + cardH <= vh。
       若放不下，优先压缩高亮区。 */
    var maxHole = vh - top - GAP - cardH - 8;     // 以当前 top 为基准算可用高度
    maxHole = Math.max(72, maxHole);
    if(h > maxHole) h = maxHole;
    /* 若仍越界（top 太靠下），把 top 往上提 */
    while(top + h + GAP + cardH > vh - 8 && top > HDR){
      top = Math.max(HDR, top - 8);
    }
    /* 提到顶还是放不下 → 继续压高亮区 */
    if(top + h + GAP + cardH > vh - 8){
      h = Math.max(64, vh - 8 - GAP - cardH - top);
    }

    /* 高亮区不能越出屏幕底部 */
    if(top + h > vh - 4) top = Math.max(HDR, vh - 4 - h);

    // 挖洞
    mask.style.display = 'block';
    setBox(top, left, w, h);
    hole.style.display = '';
    hole.style.left = left + 'px'; hole.style.top = top + 'px';
    hole.style.width = w + 'px'; hole.style.height = h + 'px';

    /* ---------- 第三步：决定卡片放上还是放下 ---------- */
    var holeBottom = top + h;
    var spaceBelow = vh - holeBottom - GAP - 8;    // 洞下方可用
    var spaceAbove = top - GAP - HDR;              // 洞上方可用（扣掉顶栏）

    if(spaceBelow >= cardH){
      /* ① 下方放得下 */
      card.className = 'tour-card tour-bottom';
      card.style.top = (holeBottom + GAP) + 'px';
      card.style.bottom = 'auto';
    } else if(spaceAbove >= cardH){
      /* ② 上方放得下 */
      card.className = 'tour-card tour-bottom';
      card.style.top = Math.max(HDR, top - cardH - GAP) + 'px';
      card.style.bottom = 'auto';
    } else {
      /* ③ 上下都勉强 → 选空间大的一侧，卡片已限高，必定放得下 */
      var useAbove = spaceAbove > spaceBelow;
      card.className = 'tour-card tour-bottom';
      if(useAbove){
        card.style.top = Math.max(HDR, holeBottom - h - GAP - cardH) + 'px';
        /* 用「洞上方」作为卡片区：上边缘对齐 */
        card.style.top = Math.max(HDR, top - GAP - cardH) + 'px';
      } else {
        card.style.top = (holeBottom + GAP) + 'px';
      }
      card.style.bottom = 'auto';
    }

    /* ---------- 第四步：最终校验，卡片绝不越界 ---------- */
    var fr = card.getBoundingClientRect();
    if(fr.bottom > vh - 6){
      card.style.top = Math.max(HDR, Math.round(parseFloat(card.style.top) - (fr.bottom - (vh - 6)))) + 'px';
    }
    fr = card.getBoundingClientRect();
    if(fr.top < HDR){
      var fixH = Math.max(120, Math.round(fr.height - (HDR - fr.top)));
      card.style.maxHeight = fixH + 'px';
      card.style.height = fixH + 'px';
      card.style.top = HDR + 'px';
      if(bodyEl) bodyEl.style.maxHeight = Math.max(40, fixH - 104) + 'px';
    }

    bindTarget(el, s);
    return;
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
        // 跳转优先级：本步明确指定的 goto > 元素自身的 .html 链接
        var dest = s.goto || '';
        var href = el.getAttribute('href') || '';
        if(!dest && href.indexOf('.html') > -1) dest = href;
        if(dest){
          location.href = dest;
        } else {
          /* 目标不是页面链接（例如页内锚点）：
             不跳页，就地推进到下一步；若已是最后一步则结束。 */
          if(idx + 1 <= FLOW.length - 1){
            show(idx + 1);
          } else {
            endAll();
          }
        }
      } else if(s.action === 'next'){
        next();
      }
    }, {capture:true});
  }

  function renderCard(s, isCenter){
    /* 结构：head / body(可滚动) / acts(固定在底部，永远可见) */
    card.innerHTML =
      '<div class="tour-head"><span class="tour-step">'+(idx+1)+' / '+FLOW.length+'</span>'
      + '<button class="tour-x" type="button">✕</button></div>'
      + '<div class="tour-body">'
        + '<div class="tour-title">'+s.title+'</div>'
        + '<div class="tour-desc">'+s.desc+'</div>'
      + '</div>'
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

  /* 窗口变化 / 图片加载导致位移时，让洞与卡片跟着走（防错位） */
  function refresh(){
    if(idx < 0 || !FLOW[idx]) return;
    var sel = FLOW[idx].sel;
    if(!sel) return;
    var el = document.querySelector(sel.split(',')[0].trim());
    if(el) place(el, FLOW[idx]);
  }
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', function(){ setTimeout(refresh, 260); });
  window.addEventListener('load', function(){ setTimeout(refresh, 220); });

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
