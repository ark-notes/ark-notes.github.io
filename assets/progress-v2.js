/* ============================================================
   学习进度追踪（引导感核心）
   - 标记完成
   - 首页显示「继续上次」
   - 进度环
   ============================================================ */
(function(){
  const KEY = 'ark_learn_progress';
  const page = location.pathname.split('/').pop() || 'index.html';

  // 读取进度
  function getProgress(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || {done:[], last:null, days:[]}; }
    catch(e){ return {done:[], last:null, days:[]}; }
  }
  // 计算连续学习天数
  function calcStreak(days){
    if(!days || !days.length) return 0;
    const sorted = [...days].sort().reverse();
    let streak = 0;
    let cur = new Date();
    cur.setHours(0,0,0,0);
    for(let i=0;i<60;i++){
      const ds = cur.toISOString().slice(0,10);
      if(sorted.includes(ds)){ streak++; cur.setDate(cur.getDate()-1); }
      else if(i===0){ cur.setDate(cur.getDate()-1); }  // 今天没学，从昨天算
      else break;
    }
    return streak;
  }

  function saveProgress(p){
    try{ localStorage.setItem(KEY, JSON.stringify(p)); }catch(e){}
  }

  // 撒花动效
  function burstConfetti(){
    const colors = ['#22d3ee','#e0b96a','#3ecf8e','#7aa8ff','#f0b429'];
    for(let i=0;i<28;i++){
      const p = document.createElement('span');
      p.className = 'confetti';
      p.style.left = (50 + (Math.random()-0.5)*40) + '%';
      p.style.top = '60%';
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      p.style.setProperty('--dx', ((Math.random()-0.5)*400) + 'px');
      p.style.setProperty('--dy', (-(150 + Math.random()*300)) + 'px');
      p.style.setProperty('--rot', (Math.random()*720-360) + 'deg');
      p.style.animationDelay = (Math.random()*0.25) + 's';
      document.body.appendChild(p);
      setTimeout(()=>p.remove(), 2200);
    }
  }

  fetch('data/nav.json').then(r=>r.json()).then(d=>{
    const steps = d.steps.filter(s => (s.group||'').includes('学习路径') && s.file !== 'path.html');
    const prog = getProgress();
    const idx = steps.findIndex(s=>s.file===page);

    /* ---------- 1. 记录访问（用于「继续上次」） ---------- */
    if(idx >= 0){
      prog.last = page;
      // 记录学习日期
      const today = new Date().toISOString().slice(0,10);
      if(!prog.days.includes(today)) prog.days.push(today);
      saveProgress(prog);
    }

    /* ---------- 2. 内容页：顶部显示进度 + 标记完成按钮 ---------- */
    if(idx >= 0){
      const wrap = document.querySelector('main .wrap') || document.querySelector('main');
      const head = wrap.querySelector('.page-head');
      const done = prog.done.includes(page);
      const pct = Math.round((prog.done.length / steps.length) * 100);

      const badge = document.createElement('div');
      badge.className = 'progress-badge';
      const stk = calcStreak(prog.days);
      badge.innerHTML = `
        <span>第 ${idx+1} / ${steps.length} 步</span>
        <span class="pb-bar"><span class="pb-fill" style="width:${pct}%"></span></span>
        <span>已完成 ${prog.done.length} 步</span>
        ${stk>1 ? `<span class="pb-streak">🔥 ${stk} 天</span>` : ''}`;
      if(head) head.parentNode.insertBefore(badge, head);

      // 标记完成按钮（放在上/下一页之前）
      const mark = document.createElement('button');
      mark.className = 'mark-done' + (done ? ' done' : '');
      mark.innerHTML = done
        ? '✓ 已完成这一步'
        : '标记为已完成';
      mark.addEventListener('click', ()=>{
        const p = getProgress();
        if(p.done.includes(page)){
          p.done = p.done.filter(x=>x!==page);
        } else {
          p.done.push(page);
          // 完成反馈（更有成就感）
          const ACHIEVE = {
            'ark-what.html':'能用自己的三句话说清「ARK 是什么」',
            'ark-safety.html':'能应对「是不是资金盘」的质疑',
            'query-guide.html':'能当场掏出手机查给客户看',
            'ark-money.html':'能回答「钱从哪来」',
            'qa.html':'被问倒也能从容应对',
            'lecturer.html':'能完整讲完一场',
            'ark-real.html':'知道第一次上场该怎么做',
          };
          const nextStep = steps[idx+1];
          const toast = document.createElement('div');
          toast.className = 'done-toast rich';
          toast.innerHTML = `
            <div class="dt-title">🎉 完成第 ${idx+1} 步！</div>
            <div class="dt-ach">你现在：<b>${ACHIEVE[page]||'又前进了一步'}</b></div>
            ${nextStep ? `<div class="dt-next">下一目标：<b>${nextStep.title}</b></div>` : '<div class="dt-next">🎊 全部完成！</div>'}`;
          document.body.appendChild(toast);
          setTimeout(()=>toast.classList.add('show'), 50);
          setTimeout(()=>{ toast.classList.remove('show'); setTimeout(()=>toast.remove(),400); }, 4200);

          // 撒花动效
          burstConfetti();
        }
        saveProgress(p);
        // 延迟刷新，让动效播完
        setTimeout(()=>location.reload(), 1800);
      });

      const navEl = wrap.querySelector('.page-nav');
      if(navEl) navEl.parentNode.insertBefore(mark, navEl);
      else wrap.appendChild(mark);
    }

    /* ---------- 3. 首页：显示「继续上次」 ---------- */
    if(page === 'index.html'){
      const hero = document.querySelector('.hero .wrap');
      if(hero && prog.last && prog.last !== 'index.html'){
        const lastStep = steps.find(s=>s.file===prog.last);
        if(lastStep){
          const card = document.createElement('div');
          card.className = 'welcome-back';
          const pct = Math.round((prog.done.length / steps.length) * 100);
          const streak = calcStreak(prog.days);
          // 进度环
          const R = 26, C = 2 * Math.PI * R, off = C * (1 - pct/100);
          card.innerHTML = `
            <div class="wb-ring">
              <svg viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5"/>
                <circle cx="32" cy="32" r="${R}" fill="none" stroke="url(#wbGrad)" stroke-width="5"
                  stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"
                  transform="rotate(-90 32 32)"/>
                <defs><linearGradient id="wbGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#e0b96a"/>
                </linearGradient></defs>
              </svg>
              <span class="wb-ring-num">${pct}%</span>
            </div>
            <div class="wb-left">
              <div class="wb-hi">👋 欢迎回来${streak>1 ? ` <span class="wb-streak">🔥 连续学习 ${streak} 天</span>` : ''}</div>
              <div class="wb-info">你上次学到：<b>${lastStep.title}</b></div>
              <div class="wb-prog">
                <span class="wb-bar"><span class="wb-fill" style="width:${pct}%"></span></span>
                <span class="wb-pct">已完成 ${prog.done.length} / ${steps.length} 步${prog.done.length < steps.length ? `　还差 ${steps.length-prog.done.length} 步` : '　🎊 全部完成'}</span>
              </div>
            </div>
            <a class="wb-btn" href="${prog.last}">
              继续学习
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>`;
          hero.insertBefore(card, hero.querySelector('h1'));
        }
      }
    }
  }).catch(()=>{});
})();


  /* ---------- 新人引导卡（首次访问显示） ---------- */
  try{
    var page = location.pathname.split('/').pop() || 'index.html';
    if(page === 'index.html' && !localStorage.getItem('ark_firsttime_done')){
      var hero = document.querySelector('.hero .wrap') || document.querySelector('.hero');
      if(hero){
        var card = document.createElement('div');
        card.className = 'first-time-card';
        card.innerHTML = '<div class="ftc-t">第一次来？</div>'
          + '<p class="ftc-d">这个网站把 ARK 需要懂的东西都整理好了 —— <b>每一块都有能直接照念的话</b>。</p>'
          + '<div class="ftc-acts">'
          + '  <a href="path.html" class="ftc-btn">从第 1 步开始 →</a>'
          + '  <button class="ftc-skip" type="button">我先随便看看</button>'
          + '</div>';
        hero.appendChild(card);
        card.querySelector('.ftc-skip').addEventListener('click', function(){
          try{ localStorage.setItem('ark_firsttime_done','1'); }catch(e){}
          card.remove();
        });
        card.querySelector('.ftc-btn').addEventListener('click', function(){
          try{ localStorage.setItem('ark_firsttime_done','1'); }catch(e){}
        });
      }
    }
  }catch(e){}
