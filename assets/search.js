/* ============================================================
   站内搜索 · search.js
   ------------------------------------------------------------
   方案：自建索引 + 中文分词（按字/词匹配）+ 权重排序
   依赖：window.__SEARCH_INDEX__（由 build 生成）
   ============================================================ */
(function () {
  var IDX = window.__SEARCH_INDEX__ || [];
  var q = document.getElementById('q');
  var results = document.getElementById('results');
  var info = document.getElementById('result-info');
  var empty = document.getElementById('empty');
  var clearBtn = document.getElementById('clear');
  if (!q || !results) return;

  /* ---------- 中文切词：按 2-gram 切 ---------- */
  function tokenize(s) {
    s = (s || '').toLowerCase().replace(/[\s\p{P}]/gu, '');
    var out = [], i;
    for (i = 0; i < s.length - 1; i++) out.push(s.substr(i, 2));
    if (s.length === 1) out.push(s);
    return out;
  }

  /* ---------- 高亮命中片段 ---------- */
  function snippet(text, terms) {
    if (!text) return '';
    for (var i = 0; i < terms.length; i++) {
      var p = text.indexOf(terms[i]);
      if (p >= 0) {
        var start = Math.max(0, p - 18);
        var seg = text.substr(start, 64);
        return (start > 0 ? '…' : '') + hl(seg, terms);
      }
    }
    return hl(text.substr(0, 64), terms) + '…';
  }
  function hl(s, terms) {
    var esc = s.replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
    terms.forEach(function (t) {
      if (t.length < 2) return;
      esc = esc.split(t).join('<mark>' + t + '</mark>');
    });
    return esc;
  }

  /* ---------- 打分 ---------- */
  function score(page, terms, raw) {
    var s = 0, t = page.t.toLowerCase(), d = (page.d || '').toLowerCase(),
        h = (page.h || []).join(' ').toLowerCase(), b = (page.b || '').toLowerCase();
    var rh = raw.toLowerCase();
    // 标题命中权重最高
    if (t.indexOf(rh) >= 0) s += 60;
    terms.forEach(function (x) { if (t.indexOf(x) >= 0) s += 12; });
    // 描述
    terms.forEach(function (x) { if (d.indexOf(x) >= 0) s += 6; });
    // 小标题
    terms.forEach(function (x) { if (h.indexOf(x) >= 0) s += 8; });
    // 正文
    terms.forEach(function (x) {
      var c = b.split(x).length - 1;
      if (c) s += Math.min(c, 5) * 2;
    });
    return s;
  }

  function search(raw) {
    var rh = (raw || '').trim();
    if (rh.length < 1) { reset(); return; }
    var terms = tokenize(rh);
    var hits = [];
    IDX.forEach(function (p) {
      var sc = score(p, terms, rh);
      if (sc > 0) hits.push({ p: p, sc: sc });
    });
    hits.sort(function (a, b) { return b.sc - a.sc; });
    render(hits, terms, rh);
  }

  function render(hits, terms, raw) {
    empty.style.display = 'none';
    if (!hits.length) {
      results.innerHTML = '';
      info.innerHTML = '<div class="no-result">没找到「<b>' + esc(raw) + '</b>」' +
        '<div class="nr-hint">换个词试试，或者 <a href="index.html">回首页</a> 看看目录。</div></div>';
      return;
    }
    info.innerHTML = '找到 <b>' + hits.length + '</b> 个结果';
    results.innerHTML = hits.slice(0, 20).map(function (x) {
      var p = x.p;
      var heads = (p.h || []).filter(function (h) {
        return terms.some(function (t) { return h.toLowerCase().indexOf(t) >= 0; });
      }).slice(0, 2).join(' · ');
      return '<a class="sr-item" href="' + p.u + '">' +
        '<div class="sr-title">' + hl(p.t, terms) + '</div>' +
        (heads ? '<div class="sr-heads">' + hl(heads, terms) + '</div>' : '') +
        '<div class="sr-snip">' + snippet(p.b, terms) + '</div>' +
        '<span class="sr-go">打开 →</span></a>';
    }).join('');
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function reset() {
    results.innerHTML = '';
    info.innerHTML = '';
    empty.style.display = '';
  }

  /* ---------- 事件 ---------- */
  var timer = null;
  q.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { search(q.value); }, 140);
  });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      clearTimeout(timer); search(q.value);
      var first = results.querySelector('.sr-item');
      if (first) first.focus();
    } else if (e.key === 'Escape') { q.value = ''; reset(); }
  });
  clearBtn.addEventListener('click', function () { q.value = ''; q.focus(); reset(); });

  // 热门标签
  var hot = document.getElementById('hot');
  if (hot) hot.addEventListener('click', function (e) {
    var t = e.target.closest('.hot-tag');
    if (!t) return;
    q.value = t.dataset.q;
    search(q.value);
    q.focus();
  });

  // URL 参数 ?q=
  var m = location.search.match(/[?&]q=([^&]*)/);
  if (m) { q.value = decodeURIComponent(m[1]); search(q.value); }
})();
