/* ============================================================
   阿奇助手悬浮球 v2（重做）
   参考：微信/支付宝 悬浮球菜单
   原则：
   1. 菜单紧贴球（不脱节）
   2. 朝屏幕内侧展开
   3. 永不超出屏幕
   4. 可拖动，可复位
   ============================================================ */
(function(){
  var ITEMS = [
    {t:'提个建议', href:'https://wj.qq.com/s2/28049534/bw59/', ico:'✏️', ext:true},
    {t:'看逐字稿', href:'transcripts.html', ico:'📄'},
    {t:'资讯速览', href:'news.html', ico:'📰'},
    {t:'查询工具', href:'tools.html', ico:'🔍'},
    {t:'客户版',   href:'guest.html', ico:'👥'},
    {t:'更新日志', href:'whats-new.html', ico:'🆕'},
    {t:'新手指引', action:'tour', ico:'⭐'}
  ];

  var dock, ball, menu;
  var KEY = 'arkieBallPos_v2';
  var isOpen = false;

  function build(){
    dock = document.createElement('div');
    dock.className = 'fab-dock';
    dock.innerHTML =
      '<div class="fab-menu" id="fabMenu"></div>' +
      '<button class="fab-ball" id="fabBall" aria-label="阿奇助手">' +
        '<img src="assets/arkie-sm.png" alt="阿奇">' +
      '</button>';
    document.body.appendChild(dock);
    ball = document.getElementById('fabBall');
    menu = document.getElementById('fabMenu');

    // 构建菜单项
    menu.innerHTML = ITEMS.map(function(it){
      if(it.ext) return '<a class="fab-item" href="'+it.href+'" target="_blank" rel="noopener"><span class="fab-ico">'+it.ico+'</span>'+it.t+'</a>';
      if(it.action) return '<button class="fab-item" type="button" data-action="'+it.action+'"><span class="fab-ico">'+it.ico+'</span>'+it.t+'</button>';
      return '<a class="fab-item" href="'+it.href+'"><span class="fab-ico">'+it.ico+'</span>'+it.t+'</a>';
    }).join('');

    // 恢复位置
    try{
      var p = JSON.parse(localStorage.getItem(KEY)||'null');
      if(p && isFinite(p.r) && isFinite(p.t)){
        dock.style.right = 'auto'; dock.style.left = p.l+'px'; dock.style.top = p.t+'px';
      }
    }catch(e){}

    bind();
  }

  function place(){
    // 计算菜单应该往哪个方向弹
    var br = ball.getBoundingClientRect();
    var mh = menu.scrollHeight || 300;
    var above = br.top;
    var below = window.innerHeight - br.bottom;
    var goDown = (above < mh + 20) && (below > mh + 20);
    menu.classList.toggle('fab-down', goDown);

    // 左右：球在左半边 → 菜单往右展开；右半边 → 往左
    var leftSide = br.left < window.innerWidth/2;
    menu.classList.toggle('fab-right', leftSide);
  }

  function toggle(open){
    isOpen = open !== undefined ? open : !isOpen;
    if(isOpen) place();
    menu.classList.toggle('show', isOpen);
    ball.classList.toggle('active', isOpen);
  }

  function bind(){
    // 点击开合
    ball.addEventListener('click', function(e){ e.stopPropagation(); e.preventDefault(); toggle(); });

    // 菜单项：新手指引
    menu.addEventListener('click', function(e){
      var btn = e.target.closest('[data-action="tour"]');
      if(btn){
        toggle(false);
        try{ localStorage.removeItem('ark_tour_v5'); }catch(err){}
        if(window.startTour) window.startTour();
        else location.href='index.html';
        return;
      }
      var a = e.target.closest('.fab-item');
      if(a) toggle(false);
    });

    // 点其他地方关闭
    document.addEventListener('click', function(e){
      if(isOpen && !dock.contains(e.target)) toggle(false);
    });

    // 拖动
    var dragging=false, moved=false, sx=0, sy=0, ox=0, oy=0;
    function start(x,y){ dragging=true; moved=false; sx=x; sy=y;
      var r=dock.getBoundingClientRect(); ox=r.left; oy=r.top;
      dock.style.right='auto'; dock.style.left=ox+'px'; dock.style.top=oy+'px';
      dock.classList.add('dragging');
    }
    function move(x,y){
      if(!dragging) return;
      var dx=x-sx, dy=y-sy;
      if(Math.abs(dx)>8||Math.abs(dy)>8) moved=true;
      if(!moved) return;
      toggle(false);
      var nx=Math.max(6, Math.min(ox+dx, window.innerWidth-70));
      var ny=Math.max(6, Math.min(oy+dy, window.innerHeight-70));
      dock.style.left=nx+'px'; dock.style.top=ny+'px';
    }
    function end(){
      if(!dragging) return;
      dragging=false; dock.classList.remove('dragging');
      if(moved){
        try{ localStorage.setItem(KEY, JSON.stringify({l:dock.offsetLeft, t:dock.offsetTop})); }catch(e){}
      }
    }
    ball.addEventListener('mousedown', function(e){ if(e.button===0) start(e.clientX,e.clientY); });
    document.addEventListener('mousemove', function(e){ move(e.clientX,e.clientY); });
    document.addEventListener('mouseup', end);
    ball.addEventListener('touchstart', function(e){ var t=e.touches[0]; start(t.clientX,t.clientY); }, {passive:true});
    document.addEventListener('touchmove', function(e){ if(!dragging) return; var t=e.touches[0]; move(t.clientX,t.clientY); if(moved) e.preventDefault(); }, {passive:false});
    document.addEventListener('touchend', end);
    ball.addEventListener('click', function(e){ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } }, true);

    // 双击复位
    var lastTap=0;
    ball.addEventListener('click', function(){
      var now=Date.now();
      if(now-lastTap<300){
        dock.style.left=''; dock.style.top=''; dock.style.right='';
        try{ localStorage.removeItem(KEY); }catch(e){}
      }
      lastTap=now;
    });

    window.addEventListener('resize', function(){ if(isOpen) place(); });
    window.addEventListener('scroll', function(){ if(isOpen) place(); }, {passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
