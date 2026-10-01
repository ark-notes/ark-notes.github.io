/* ============================================================
   新人引导（v3 · 重做）
   设计原则（站在顶尖产品经理角度）：
   1. 「重看引导」放【顶栏】—— 醒目、随时可见，不藏在页脚
   2. 引导遮罩浅色（0.42），能看清下面
   3. 高亮框用金色亮边 + 发光，明确指向
   4. 大按钮（≥48px 触摸区），移动端友好
   5. 支持触摸滑动切换
   6. 记住进度（看到第几步），断点续看
   ============================================================ */
(function () {
  var KEY = 'ark_onboard_v3';
  var KEY_DONE = 'ark_onboard_done_at';
  var page = location.pathname.split('/').pop() || 'index.html';

  function getState(){
    try{ var o=JSON.parse(localStorage.getItem(KEY)||'null'); return o||{seen:0,done:false}; }
    catch(e){ return {seen:0,done:false}; }
  }
  function setState(seen,done){
    try{ localStorage.setItem(KEY,JSON.stringify({seen:seen,done:done})); }catch(e){}
    if(done){ try{ localStorage.setItem(KEY_DONE,String(Date.now())); }catch(e){} }
  }

  /* ---------- 顶部「新手指引」入口按钮（每个页面都有） ---------- */
  function addHeaderEntry(){
    var wrap = document.querySelector('.site-header .wrap');
    if(!wrap || wrap.querySelector('.ob-entry')) return;
    var btn = document.createElement('button');
    btn.className = 'ob-entry';
    btn.type = 'button';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg><span>新手指引</span>';
    btn.addEventListener('click', function(){ startTour(0, true); });
    // 插到导航后面（客户版按钮之前）
    var guest = wrap.querySelector('.nav-guest');
    if(guest) wrap.insertBefore(btn, guest);
    else wrap.appendChild(btn);
  }

  /* ---------- 引导步骤 ---------- */
  var steps = [
    {
      title: '欢迎来到 ARK 学习指南',
      desc: '这里把 ARK 需要懂的东西都整理好了 —— <b>每一块都有能直接照念的话</b>。<br>花 1 分钟，我带你走一遍。',
      target: null, pos: 'center'
    },
    {
      title: '第一步：点这个金色按钮',
      desc: '这是最快开始的方式 —— <b>点它，直接进第 1 课</b>。',
      target: '.btn-main', pos: 'bottom'
    },
    {
      title: '五个板块，一眼看清',
      desc: '开始学习 / 搞懂 ARK / 出门能用 / 给别人讲 / 给客户看。<br><b>想做什么，点哪个。</b>',
      target: '.block-grid', pos: 'top'
    },
    {
      title: '或者走七步路径',
      desc: '按顺序走 —— <b>每一步都有「开始学习」</b>。<br>走完七步，你就能独立讲清楚了。',
      target: '.roadmap', pos: 'top'
    },
    {
      title: '每一页都能翻页',
      desc: '看完一页，<b>点底部「下一步」</b>继续。<br>不用记路，一直点下去就走完了。',
      target: '.page-nav, .site-footer', pos: 'top'
    },
    {
      title: '想再看一次？',
      desc: '以后随时点<b>顶部「新手指引」</b>就能重看。<br>现在，开始你的第一步吧。',
      target: '.ob-entry', pos: 'bottom'
    }
  ];

  var cur = 0, box, mask, spot, resumeAt = 0, resumeOn = false;

  function build(){
    mask = document.createElement('div');
    mask.className = 'ob-mask';
    mask.innerHTML = '<div class="ob-spot"></div>';
    box = document.createElement('div');
    box.className = 'ob-box';
    document.body.appendChild(mask);
    document.body.appendChild(box);
    spot = mask.querySelector('.ob-spot');
    document.body.style.overflow = 'hidden';
  }

  function render(){
    var s = steps[cur], total = steps.length;
    if (resumeOn) setState(cur, false);

    box.className = 'ob-box ob-' + (s.pos || 'center');
    box.innerHTML =
      '<div class="ob-step">' + (cur+1) + ' / ' + total + '</div>' +
      '<div class="ob-title">' + s.title + '</div>' +
      '<div class="ob-desc">' + s.desc + '</div>' +
      '<div class="ob-acts">' +
      '  <button class="ob-skip" type="button">跳过</button>' +
      '  <button class="ob-next" type="button">' + (cur===total-1?'开始学习 →':'下一步 →') + '</button>' +
      '</div>';

    box.querySelector('.ob-skip').addEventListener('click', function(e){ e.stopPropagation(); finish(false); });
    box.querySelector('.ob-next').addEventListener('click', function(e){
      e.stopPropagation();
      if(cur === total-1){ finish(true); var t=document.querySelector('.btn-main'); if(t) t.scrollIntoView({behavior:'smooth',block:'center'}); }
      else { cur++; render(); }
    });

    highlight(s.target, s.pos);
  }

  function highlight(sel, pos){
    if(!sel){ spot.style.display='none'; return; }
    var el = document.querySelector(sel.split(',')[0].trim());
    if(!el){ spot.style.display='none'; return; }
    var r = el.getBoundingClientRect();
    var needScroll = r.top < 100 || r.bottom > window.innerHeight-140;
    if(needScroll){
      el.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(function(){ place(el); }, 420);
    } else place(el);
  }

  function place(el){
    var r = el.getBoundingClientRect(), pad = 9;
    var top = r.top - pad, h = r.height + pad*2, left = r.left - pad, w = r.width + pad*2;
    // 确保不出屏
    if(top < 6){ top = 6; }
    if(top + h > window.innerHeight - 6){ h = window.innerHeight - 6 - top; }
    if(left < 6){ left = 6; w = r.right + pad - 6; }
    spot.style.display = '';
    spot.style.left = left+'px';
    spot.style.top = top+'px';
    spot.style.width = w+'px';
    spot.style.height = h+'px';
  }

  function finish(completed){
    if(completed) setState(steps.length-1, true);
    else setState(cur, false);
    if(box) box.remove();
    if(mask) mask.remove();
    document.body.style.overflow = '';
    resumeOn = false;
  }

  function startTour(from, manual){
    cur = from || 0;
    resumeOn = !manual;
    if(box) box.remove();
    if(mask) mask.remove();
    build();
    render();
  }

  window.addEventListener('resize', function(){
    if(!box || !spot) return;
    var sel = steps[cur] && steps[cur].target;
    if(sel){ var el=document.querySelector(sel.split(',')[0].trim()); if(el) place(el); }
  });

  function init(){
    addHeaderEntry();       // 顶栏入口：所有页面都有

    // 自动弹引导只在首页（避免打断内容页阅读）
    var isHome = (location.pathname.split('/').pop() || 'index.html') === 'index.html';
    if(!isHome) return;

    var st = getState();
    if(st.done) return;
    if(st.seen > 0) startTour(st.seen, false);
    else startTour(0, false);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 700); });
  else setTimeout(init, 700);
})();
