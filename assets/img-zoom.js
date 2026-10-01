/* ============================================================
   图片预览 + 下载（灯箱）
   - 点击任意内容图片 → 全屏预览
   - 支持缩放、左右切换（多图时）
   - 提供「下载」按钮
   - 中文本地化、符合国内用户习惯（点击遮罩关闭、顶部大按钮）
   ============================================================ */
(function(){
  // 收集所有内容图片（排除图标、logo）
  function collectImages(){
    const imgs = [];
    document.querySelectorAll('main img, .img-block img, article img, .screen img, .g-shot img, .g-shot-inline img, body img').forEach(im => {
      const src = im.getAttribute('src') || '';
      if(!src) return;
      if(/logo|icon|favicon|avatar|mascot/i.test(src)) return;
      if(im.closest('.no-zoom')) return;
      if(im.dataset.zoomReady) return;
      im.dataset.zoomReady = '1';
      im.classList.add('zoomable');
      im.addEventListener('click', e => { e.preventDefault(); open(idxOf(imgList, im)); });
      imgs.push({el: im, src: src, alt: im.getAttribute('alt') || ''});
    });
    return imgs;
  }
  let imgList = [];
  let cur = 0;
  let box = null;

  function idxOf(list, el){
    const t = list.findIndex(x => x.el === el);
    return t < 0 ? 0 : t;
  }

  function build(){
    if(box) return box;
    box = document.createElement('div');
    box.className = 'lbox';
    box.innerHTML = `
      <div class="lbox-top">
        <span class="lbox-count"></span>
        <div class="lbox-acts">
          <a class="lbox-btn lbox-dl" download>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"/></svg>
            下载原图
          </a>
          <button class="lbox-btn lbox-x" type="button" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>
            关闭
          </button>
        </div>
      </div>
      <div class="lbox-stage">
        <button class="lbox-nav lbox-prev" type="button" aria-label="上一张">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <img class="lbox-img" alt="">
        <button class="lbox-nav lbox-next" type="button" aria-label="下一张">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div class="lbox-cap"></div>
      <div class="lbox-hint">点击空白处关闭 · 支持 ← → 切换</div>`;
    document.body.appendChild(box);

    box.querySelector('.lbox-x').addEventListener('click', close);
    box.addEventListener('click', e => { if(e.target === box || e.target.classList.contains('lbox-stage')) close(); });
    box.querySelector('.lbox-prev').addEventListener('click', e => { e.stopPropagation(); go(-1); });
    box.querySelector('.lbox-next').addEventListener('click', e => { e.stopPropagation(); go(1); });

    document.addEventListener('keydown', e => {
      if(!box.classList.contains('on')) return;
      if(e.key === 'Escape') close();
      if(e.key === 'ArrowLeft') go(-1);
      if(e.key === 'ArrowRight') go(1);
    });
    return box;
  }

  function show(i){
    cur = (i + imgList.length) % imgList.length;
    const it = imgList[cur];
    const img = box.querySelector('.lbox-img');
    img.src = it.src;
    img.alt = it.alt;
    box.querySelector('.lbox-cap').textContent = it.alt || '点击下载可保存原图';
    const dl = box.querySelector('.lbox-dl');
    const name = (it.src.split('/').pop() || 'image.png').split('?')[0];
    dl.href = it.src;
    dl.setAttribute('download', decodeURIComponent(name));
    const multi = imgList.length > 1;
    box.querySelector('.lbox-prev').style.display = multi ? '' : 'none';
    box.querySelector('.lbox-next').style.display = multi ? '' : 'none';
    box.querySelector('.lbox-count').textContent = multi ? `${cur+1} / ${imgList.length}` : '';
  }

  function go(d){ show(cur + d); }
  function open(i){ build(); show(i); box.classList.add('on'); document.body.style.overflow = 'hidden'; }
  function close(){ if(box){ box.classList.remove('on'); } document.body.style.overflow = ''; }

  function init(){
    imgList = collectImages();
    if(imgList.length) build();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
