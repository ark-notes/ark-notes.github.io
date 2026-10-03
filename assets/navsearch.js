/* 手机端：搜索图标点击后跳搜索页 */
(function(){
  var box=document.querySelector('.nav-searchbox');
  if(!box) return;
  box.addEventListener('click', function(e){
    if(window.innerWidth<=640 && e.target.tagName!=='INPUT'){
      location.href='search.html';
    }
  });
})();
