/* ============================================================
   新人引导层（Onboarding Tour）
   参考：苹果新机设置（全屏/单按钮/大字）+ 游戏新手教程（高亮+箭头）
   条件：无登录体系 → 用 localStorage 判定"是否来过"
   ============================================================ */
(function () {
  var KEY = 'ark_onboard_v2';          // 存"看到第几步"
  var KEY_VISIT = 'ark_first_visit';   // 首次访问时间
  var KEY_DONE_AT = 'ark_onboard_done'; // 看完的时间戳

  // 读取状态
  function getState(){
    try {
      var raw = localStorage.getItem(KEY);
      if(!raw) return {seen:0, done:false};
      var o = JSON.parse(raw);
      return {seen: o.seen || 0, done: !!o.done};
    } catch(e){ return {seen:0, done:false}; }
  }
  function setState(seen, done){
    try { localStorage.setItem(KEY, JSON.stringify({seen:seen, done:done})); } catch(e){}
    if(done){ try{ localStorage.setItem(KEY_DONE_AT, String(Date.now())); }catch(e){} }
  }
  // 看完多久了（天）
  function daysSinceDone(){
    try {
      var t = parseInt(localStorage.getItem(KEY_DONE_AT) || '0', 10);
      if(!t) return 999;
      return (Date.now() - t) / 86400000;
    } catch(e){ return 999; }
  }

  // 只在首页显示
  var page = location.pathname.split('/').pop() || 'index.html';
  if (page !== 'index.html') return;

  var st = getState();
  // ① 完整看完过 → 不自动弹；但 >7 天给"下一步"提示
  if (st.done) {
    addReplayEntry();
    if (daysSinceDone() > 7) { setTimeout(showNextHint, 1200); }
    return;
  }
  // ② 看到一半 → 记录断点，稍后 start 时用
  var RESUME_AT = st.seen > 0 ? st.seen : 0;
  try {
    if (!localStorage.getItem(KEY_VISIT)) {
      localStorage.setItem(KEY_VISIT, String(Date.now()));
    }
  } catch (e) {}

  // ---------- 引导步骤定义 ----------
  var steps = [
    {
      title: '欢迎来到 ARK 学习指南',
      desc: '这里把 ARK 需要懂的东西都整理好了 —— <b>每一块都有可以直接照念的话</b>。\n花 3 分钟，我带你走一遍。',
      target: null,
      pos: 'center'
    },
    {
      title: '第一步：点这里开始',
      desc: '看到这个金色按钮了吗？<b>点它，就进入第 1 课</b>。\n不用担心，随时可以退回来。',
      target: '.btn-main',
      pos: 'bottom'
    },
    {
      title: '下面有七步学习路径',
      desc: '按顺序走就行 —— <b>每一步都有「开始学习」</b>。\n走完七步，你就能独立讲清楚了。',
      target: '.roadmap',
      pos: 'top'
    },
    {
      title: '每一页底部都能翻页',
      desc: '看完一页，<b>点「下一步」继续</b>。\n不用记路，一直点下去就能走完。',
      target: '.page-nav, .site-footer',
      pos: 'top'
    },
    {
      title: '随时想查东西？',
      desc: '右下角有个 <b>阿奇助手</b>，可以随时问我。\n现在，开始你的第一步吧。',
      target: '.af-ball',
      pos: 'left',
      optional: true
    }
  ];

  var cur = 0;
  var box, mask, spot;

  function build() {
    mask = document.createElement('div');
    mask.className = 'ob-mask';
    mask.innerHTML = '<div class="ob-spot"></div>';
    box = document.createElement('div');
    box.className = 'ob-box';
    document.body.appendChild(mask);
    document.body.appendChild(box);
    spot = mask.querySelector('.ob-spot');
  }

  function render() {
    var s = steps[cur];
    var total = steps.length;
    setState(cur, false);   // 记录"看到第几步"（未完成）

    box.className = 'ob-box ob-' + (s.pos || 'center');
    box.innerHTML = [
      '<div class="ob-step">' + (cur + 1) + ' / ' + total + '</div>',
      '<div class="ob-title">' + s.title + '</div>',
      '<div class="ob-desc">' + s.desc.replace(/\n/g, '<br>') + '</div>',
      '<div class="ob-acts">',
      '  <button class="ob-skip" type="button">跳过</button>',
      '  <button class="ob-next" type="button">' + (cur === total - 1 ? '开始学习 →' : '下一步 →') + '</button>',
      '</div>'
    ].join('');

    box.querySelector('.ob-skip').addEventListener('click', function(){ finish(false); });
    box.querySelector('.ob-next').addEventListener('click', function () {
      if (cur === total - 1) {
        finish(true);
        // 结束后自动滚到主按钮
        var t = document.querySelector('.btn-main');
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        cur++; render();
      }
    });

    // 高亮目标
    highlight(s.target);
  }

  function highlight(sel) {
    if (!sel) {
      spot.style.display = 'none';
      return;
    }
    var el = document.querySelector(sel);
    if (!el) {
      spot.style.display = 'none';
      return;
    }
    spot.style.display = '';
    // 滚动到目标
    var r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 80) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () { place(el); }, 420);
    } else {
      place(el);
    }
  }

  function place(el) {
    var r = el.getBoundingClientRect();
    var pad = 8;
    spot.style.left = (r.left - pad) + 'px';
    spot.style.top = (r.top - pad) + 'px';
    spot.style.width = (r.width + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';
  }

  function finish(completed) {
    // completed 明确传 true 才算"看完"
    if (completed === true) setState(steps.length - 1, true);
    else setState(cur, false);   // 跳过 = 没看完，下次还弹
    if (box) box.remove();
    if (mask) mask.remove();
    addReplayEntry();
  }

  // 7 天后回来：温和提示"你的下一步"
  function showNextHint(){
    var main = document.querySelector('.btn-main');
    if(!main) return;
    if(document.querySelector('.next-hint')) return;
    var d = document.createElement('div');
    d.className = 'next-hint';
    d.innerHTML = '<span>👋 欢迎回来 —— <b>接着上次继续？</b></span>'
                + '<a href="path.html" class="nh-btn">看学习路径 →</a>';
    main.parentNode.insertBefore(d, main);
  }

  function addReplayEntry() {
    // 在页脚加"重看新手指引"
    var foot = document.querySelector('.site-footer .wrap');
    if (!foot || foot.querySelector('.ob-replay')) return;
    var a = document.createElement('button');
    a.className = 'ob-replay';
    a.type = 'button';
    a.textContent = '重看新手指引';
    a.addEventListener('click', function () {
      try { localStorage.removeItem(KEY); localStorage.removeItem(KEY_DONE_AT); } catch (e) {}
      cur = 0;
      build();
      render();
    });
    foot.appendChild(a);
  }

  function start() {
    cur = RESUME_AT;     // 从断点开始
    build();
    render();
    window.addEventListener('resize', function () {
      var sel = steps[cur] && steps[cur].target;
      if (sel) highlight(sel);
      else if (box) box.className = 'ob-box ob-' + (steps[cur].pos || 'center');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 700); });
  } else {
    setTimeout(start, 700);
  }
})();
