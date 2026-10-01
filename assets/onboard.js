/* ============================================================
   新人引导层（Onboarding Tour）
   参考：苹果新机设置（全屏/单按钮/大字）+ 游戏新手教程（高亮+箭头）
   条件：无登录体系 → 用 localStorage 判定"是否来过"
   ============================================================ */
(function () {
  var KEY = 'ark_onboard_v1';          // 看过就记
  var KEY_VISIT = 'ark_first_visit';   // 首次访问时间

  // 只在首页显示
  var page = location.pathname.split('/').pop() || 'index.html';
  if (page !== 'index.html') return;

  try {
    // 已看过 → 不再自动显示（但可手动重看）
    if (localStorage.getItem(KEY)) {
      // 提供"重新观看"入口（挂到悬浮球菜单 or 页脚）
      addReplayEntry();
      return;
    }
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

    box.querySelector('.ob-skip').addEventListener('click', finish);
    box.querySelector('.ob-next').addEventListener('click', function () {
      if (cur === total - 1) {
        finish();
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

  function finish() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    if (box) box.remove();
    if (mask) mask.remove();
    addReplayEntry();
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
      try { localStorage.removeItem(KEY); } catch (e) {}
      cur = 0;
      build();
      render();
    });
    foot.appendChild(a);
  }

  function start() {
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
