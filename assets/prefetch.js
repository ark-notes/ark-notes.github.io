/* 链接预载（悬停/触摸时提前加载下一页，跳转更快） */
(function(){
  var done = {};
  function prefetch(href){
    if(!href || done[href]) return;
    if(!/^[a-z0-9-]+\.html$/i.test(href)) return;
    if(href === (location.pathname.split('/').pop() || 'index.html')) return;
    done[href] = 1;
    var l = document.createElement('link');
    l.rel = 'prefetch'; l.href = href; l.as = 'document';
    document.head.appendChild(l);
  }
  function bind(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var href = a.getAttribute('href');
      if(!href || a.target === '_blank') return;
      a.addEventListener('mouseenter', function(){ prefetch(href); }, {passive:true, once:true});
      a.addEventListener('touchstart', function(){ prefetch(href); }, {passive:true, once:true});
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
