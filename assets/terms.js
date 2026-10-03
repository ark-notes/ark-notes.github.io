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
    },

    /* ---------- 政策 / 法规类（学习用） ---------- */
    '94公告': {
      full: '94 公告（2017年9月4日）',
      def: '央行等七部委发布的《关于防范代币发行融资风险的公告》，叫停 ICO（代币发行融资）。这是国内对虚拟货币监管的起点文件。',
      eg: '像 2017 年突然关停了所有"发币融资"活动。'
    },
    '924通知': {
      full: '924 通知（银发〔2021〕237号）',
      def: '十部门发布的《关于进一步防范和处置虚拟货币交易炒作风险的通知》，明确虚拟货币相关业务属于非法金融活动。2026 年被 42 号文废止并升级。',
      eg: '像 2021 年那轮整治，把"交易炒作"也纳入禁止。'
    },
    '42号文': {
      full: '42 号文（银发〔2026〕42号）',
      def: '2026 年 2 月，央行等八部门发布的《关于进一步防范和处置虚拟货币等相关风险的通知》。**废止了 924 通知**，并**新增**了对稳定币、RWA 代币化的禁止。',
      eg: '像把旧规矩换成更严的新规矩。'
    },
    '金融产品网络营销管理办法': {
      full: '《金融产品网络营销管理办法》',
      def: '2026 年 4 月八部门发布，**2026 年 9 月 30 日起施行**。规范"金融产品"在网上的营销行为。第六条明确：不得为"虚拟货币发行交易"等非法金融活动提供网络营销服务或便利。',
      eg: '像给网上卖金融产品立规矩：谁能卖、怎么宣传、哪些词不能说。'
    },
    '非法金融活动': {
      full: '非法金融活动',
      def: '未经金融管理部门许可，或违反规定，实质从事货币、支付、存款、放贷、证券、基金、期货、外汇等业务。**含：非法集资、非法证券期货、虚拟货币发行交易等**。',
      eg: '像没有牌照就开门做银行、证券的生意。'
    },
    '稳定币': {
      full: '稳定币',
      def: '价格锚定某种法币（通常是美元）的加密货币，如 USDT。42 号文明确：**挂钩人民币的稳定币不得发行**（事关货币主权）。',
      eg: '像"数字版的美元代金券"。'
    },
    'RWA': {
      full: 'RWA（现实世界资产代币化）',
      def: '把现实资产（房产、票据、债券等）的所有权或收益权，用区块链变成代币来发行和交易。42 号文明确：**在境内开展 RWA 活动应予以禁止**（经批准的除外）。',
      eg: '像把一套房子"切"成很多份，每份变成可交易的凭证。'
    },
    'ICP': {
      full: 'ICO / IEO / STO',
      def: '几种"发币融资"的方式。ICO=首次代币发行，IEO=交易所首次发行，STO=证券型代币发行。**在国内均属被禁止的范围**。',
      eg: '像公司上市募资，但换成"发币"的形式。'
    },
    '双支柱': {
      full: '双支柱调控框架',
      def: '《中国人民银行法（修订草案）》提出的框架：**货币政策 + 宏观审慎政策**。前者管"钱多钱少"，后者管"金融稳不稳"。',
      eg: '像开车有两个仪表盘：一个看油量，一个看发动机温度。'
    },
    '数字人民币': {
      full: '数字人民币（e-CNY）',
      def: '中国人民银行发行的法定数字货币，**由央行发行、有国家信用背书**。与加密货币完全不同：它不是去中心化的，价格恒定为 1 元。',
      eg: '像"手机里的现金"，本质还是人民币。'
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
