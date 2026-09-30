/* ============================================================
   链接工具：复制按钮 + 国内可访问性提示
   ============================================================ */
(function(){
  // 需要梯子的域名（国外/可能被墙）
  const FOREIGN = ['certik.com','bscscan.com','safe.global','tally.xyz','gopluslabs.io',
                   'coinmarketcap.com','coingecko.com','rootdata.com','dexscreener.com',
                   'ave.ai','dextools.io','yahoo.com','cointelegraph.com','tencentcloud.com',
                   'arkieai.io','stocks.apple.com','github.com','raw.githubusercontent.com'];

  function isForeign(url){
    try{ return FOREIGN.some(d => url.includes(d)); }catch(e){ return false; }
  }

  // 处理所有外部链接
  document.querySelectorAll('a[target="_blank"]').forEach(a => {
    const url = a.getAttribute('href') || '';
    if(!url.startsWith('http')) return;
    if(a.dataset.tooled) return;
    a.dataset.tooled = '1';

    // 在链接旁边加「复制」小按钮
    const wrap = document.createElement('span');
    wrap.className = 'link-wrap';
    a.parentNode.insertBefore(wrap, a);
    wrap.appendChild(a);

    const btn = document.createElement('button');
    btn.className = 'copy-link-btn';
    btn.type = 'button';
    btn.title = '复制链接';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>';
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      copyText(url, btn);
    });
    wrap.appendChild(btn);

    // 国外站加「可能需梯子」标记
    if(isForeign(url) && !wrap.querySelector('.need-vpn')){
      const tag = document.createElement('span');
      tag.className = 'need-vpn';
      tag.textContent = '可能需梯子';
      tag.title = '这个网址是国外的，国内可能打不开';
      tag.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); copyText(url, tag); });
      wrap.appendChild(tag);
    }
  });

  function copyText(text, el){
    const done = () => {
      const old = el.innerHTML;
      el.innerHTML = '✓ 已复制';
      el.classList.add('copied');
      setTimeout(()=>{ el.innerHTML = old; el.classList.remove('copied'); }, 1500);
    };
    if(navigator.clipboard && location.protocol==='https:'){
      navigator.clipboard.writeText(text).then(done).catch(()=>fallback(text,done));
    } else {
      fallback(text, done);
    }
  }
  function fallback(text, cb){
    const ta=document.createElement('textarea');
    ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); cb(); }catch(e){ alert('复制失败，请长按链接手动复制'); }
    ta.remove();
  }
})();
