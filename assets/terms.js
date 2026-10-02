/* ============================================================
   术语注释系统 · JS 引擎
   ------------------------------------------------------------
   用法：HTML 里写 <span class="term" data-t="底池"></span>
        脚本自动从 GLOSSARY 取解释并填充
   交互：电脑悬停 / 手机点击；点击空白或 ✕ 关闭
   依据：WCAG 1.4.13（可关闭 · 可悬停 · 持续显示）
   ============================================================ */
(function () {

  /* ---------- 术语词典 ----------
     每条：{ full: 全称, def: 大白话解释, eg: 打比方 } */
  var GLOSSARY = {
    '底池': {
      full: '底池（流动性池）',
      def: '大家把币和钱放进一个池子里，供所有人买卖。池子越大，价格越稳。',
      eg: '就像菜市场的货，货越多，价格越不容易被人操控。'
    },
    '权限丢弃': {
      full: '权限丢弃（放弃管理权）',
      def: '做币的人主动放弃"再印币"、"改规则"的权力，而且是永久放弃、拿不回来。',
      eg: '就像印钞机被砸了，谁都别想偷偷多印。'
    },
    '多签': {
      full: '多签（多重签名）',
      def: '管钱要好几把钥匙一起开，一个人动不了。',
      eg: '像保险箱要 5 个人同时插钥匙才能开。'
    },
    '质押': {
      full: '质押',
      def: '把自己的币存进去，换取收益。存的时间越长，通常收益越高。',
      eg: '像把钱存进定期，但这里是存币。'
    },
    '销毁': {
      full: '销毁（燃烧）',
      def: '把一部分币永久地送到一个谁都打不开的地址，等于让这些币消失。',
      eg: '就像把一部分钞票烧了，剩下的钞票更值钱。'
    },
    '流动性': {
      full: '流动性',
      def: '市场上"随时能买到、随时能卖出"的能力。流动性越好，买卖越方便、价格越稳。',
      eg: '像超市货架上的货，货越足越好买。'
    },
    '钱包地址': {
      full: '钱包地址',
      def: '你在链上的"账号"，一串 0x 开头的字符。可以给别人，别人能给你转币。',
      eg: '像银行卡号 —— 可以告诉别人，但不能给别人密码。'
    },
    '私钥': {
      full: '私钥',
      def: '控制你钱包的唯一凭证。谁拿到私钥，谁就能转走你所有的币。',
      eg: '像银行卡密码 + 身份证，给谁就等于把钱给谁。'
    },
    '助记词': {
      full: '助记词（种子词）',
      def: '一串 12 或 24 个英文单词，是恢复钱包的唯一凭证。比私钥更好记。',
      eg: '像一串备用钥匙，抄下来放好，丢了就再也找不回钱包。'
    },
    '国库': {
      full: '国库',
      def: '项目方管理的公共资金池，用来稳定价格、分红、做运营。',
      eg: '像一家公司的公款账户。'
    },
    '提案': {
      full: '治理提案',
      def: '社区成员提出、大家投票决定的规则变更。通过后才会执行。',
      eg: '像公司开会举手表决。'
    },
    '智能合约': {
      full: '智能合约',
      def: '写在区块链上的自动程序，条件满足就自动执行，没人能改。',
      eg: '像自动贩卖机：投币就出货，不需要人管。'
    },
    '链上': {
      full: '链上',
      def: '指记录在区块链上的数据。任何人都能查，改不了、删不掉。',
      eg: '像刻在石头上的账本。'
    },
    '滑点': {
      full: '滑点',
      def: '实际成交价和你看到的价格之间的差额。交易量越大、池子越小，滑点越大。',
      eg: '像买菜时价格已经变了。'
    },
    'LP': {
      full: 'LP（流动性提供者）',
      def: '把自己的币放进池子里供别人交易，赚手续费的人。',
      eg: '像在集市上摆摊供货的人。'
    },
    'RBS': {
      full: 'RBS（区间稳定模组）',
      def: '自动调节价格的机制：价格太低就买、太高就卖，让价格保持在合理区间。',
      eg: '像有个管理员，菜价太低就自己买，太高就自己卖。'
    }
  };

  /* ---------- 渲染一个术语 ---------- */
  function buildTip(key) {
    var g = GLOSSARY[key];
    if (!g) return null;
    var html = '<span class="tp-head"><b>' + g.full + '</b>'
             + '<button class="tp-x" type="button" aria-label="关闭">✕</button></span>'
             + '<p>' + g.def + '</p>';
    if (g.eg) html += '<div class="eg">' + g.eg + '</div>';
    var pop = document.createElement('span');
    pop.className = 'term-pop';
    pop.setAttribute('role', 'tooltip');
    pop.innerHTML = html;
    return pop;
  }

  /* ---------- 防溢出：靠右时向左弹 ---------- */
  function adjust(el) {
    el.classList.remove('flip');
    var r = el.getBoundingClientRect();
    var need = Math.min(360, window.innerWidth * 0.88);
    if (r.left + need > window.innerWidth - 12) el.classList.add('flip');
  }

  function closeAll(except) {
    document.querySelectorAll('.term.open').forEach(function (t) {
      if (t !== except) t.classList.remove('open');
    });
  }

  function init() {
    var terms = document.querySelectorAll('.term[data-t]');
    if (!terms.length) return;

    terms.forEach(function (el) {
      var key = el.getAttribute('data-t');
      if (el.querySelector('.term-pop')) return;   // 已渲染
      var pop = buildTip(key);
      if (!pop) { el.classList.remove('term'); return; }
      el.appendChild(pop);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', key + '：点击查看解释');

      // 关闭按钮
      var x = pop.querySelector('.tp-x');
      if (x) x.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        el.classList.remove('open');
      });

      // 点击切换（手机 / 电脑都能用）
      el.addEventListener('click', function (e) {
        if (e.target.closest('.tp-x')) return;
        if (e.target.closest('.term-pop')) return;   // 点弹层内部不关
        e.preventDefault(); e.stopPropagation();
        var willOpen = !el.classList.contains('open');
        closeAll(el);
        el.classList.toggle('open', willOpen);
        if (willOpen) adjust(el);
      });

      // 键盘可达（Tab + Enter）
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var willOpen = !el.classList.contains('open');
          closeAll(el);
          el.classList.toggle('open', willOpen);
          if (willOpen) adjust(el);
        } else if (e.key === 'Escape') {
          el.classList.remove('open');
        }
      });

      // 电脑悬停时也防溢出
      el.addEventListener('mouseenter', function () { adjust(el); });
    });

    // 点空白关闭
    document.addEventListener('click', function () { closeAll(null); });

    // 滚动时关闭（避免错位）
    var t = null;
    window.addEventListener('scroll', function () {
      if (t) return;
      t = setTimeout(function () { closeAll(null); t = null; }, 120);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
