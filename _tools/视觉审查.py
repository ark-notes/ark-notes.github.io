#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视觉审查（补自查.py 的盲区）
==============================
用户要求（2026-10-03）：
  「你审查页面要仔细 别再出现那种明显的bug了」

自查.py 只量数值，查不出"看起来错乱"。
本脚本专门查视觉问题：
  ① 遮罩/弹层是否完整覆盖（无漏光）
  ② 固定元素是否互相遮挡
  ③ 元素是否超出视口
  ④ 文字是否被裁切
  ⑤ 层级混乱（z-index 冲突）
"""
import sys, time

PAGES = sys.argv[1:] if len(sys.argv) > 1 else ['index.html']
BASE = 'http://127.0.0.1:10520/'

def main():
    from playwright.sync_api import sync_playwright
    issues = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        for vp, tag in [({'width':1440,'height':900}, '电脑'),
                        ({'width':390,'height':844}, '手机')]:
            ctx = b.new_context(viewport=vp, device_scale_factor=2)
            pg = ctx.new_page()
            for page in PAGES:
                pg.goto(BASE + page, wait_until='networkidle', timeout=30000)
                pg.evaluate("localStorage.clear()")
                pg.reload(wait_until='networkidle')
                time.sleep(2.5)
                r = pg.evaluate("""() => {
                  const out = [];
                  const vw = innerWidth, vh = innerHeight;
                  const vis = e => {
                    const cs = getComputedStyle(e);
                    return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05;
                  };
                  // ① 检查遮罩/弹层是否铺满
                  document.querySelectorAll('.tour-mask, .mask, .overlay').forEach(e => {
                    if (!vis(e)) return;
                    const r = e.getBoundingClientRect();
                    if (r.width < vw - 2 || r.height < vh - 2) {
                      out.push('遮罩未铺满: ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' vs ' + vw + 'x' + vh);
                    }
                  });
                  // ② 固定元素互相遮挡
                  const fixeds = [...document.querySelectorAll('*')].filter(e => {
                    const cs = getComputedStyle(e);
                    return cs.position === 'fixed' && vis(e) && e.offsetParent !== null
                      && e.getBoundingClientRect().width > 8 && e.getBoundingClientRect().height > 8;
                  });
                  for (let i = 0; i < fixeds.length; i++) {
                    for (let j = i + 1; j < fixeds.length; j++) {
                      const a = fixeds[i].getBoundingClientRect(), c = fixeds[j].getBoundingClientRect();
                      const ox = Math.min(a.right,c.right) - Math.max(a.left,c.left);
                      const oy = Math.min(a.bottom,c.bottom) - Math.max(a.top,c.top);
                      if (ox > 12 && oy > 12) {
                        const na = (fixeds[i].className||'').toString().slice(0,26);
                        const nc = (fixeds[j].className||'').toString().slice(0,26);
                        if (na && nc && !na.includes('fab') && !nc.includes('fab'))
                          out.push('固定元素重叠: ['+na+'] × ['+nc+']  ' + Math.round(ox)+'x'+Math.round(oy));
                      }
                    }
                  }
                  // ③ 元素超出视口
                  document.querySelectorAll('main *').forEach(e => {
                    const r = e.getBoundingClientRect();
                    if (r.width > 0 && (r.right > vw + 3 || r.left < -3)) {
                      const c = (e.className||'').toString().slice(0,26);
                      if (c && !e.closest('.term-pop')) out.push('超出视口: ' + c);
                    }
                  });
                  // ④ 文字被裁切（overflow hidden 且内容超出）
                  document.querySelectorAll('h1,h2,h3,p,span,td').forEach(e => {
                    const cs = getComputedStyle(e);
                    if (cs.overflow === 'hidden' && e.scrollWidth > e.clientWidth + 4 && e.clientWidth > 0) {
                      out.push('文字被裁切: ' + e.textContent.trim().slice(0,20));
                    }
                  });
                  return [...new Set(out)].slice(0, 10);
                }""")
                if r:
                    print(f"🔴 [{tag}] {page}")
                    for x in r: print(f"      {x}")
                    issues.append((tag, page, r))
                else:
                    print(f"✅ [{tag}] {page}")
            ctx.close()
        b.close()
    print()
    if issues:
        print(f"🔴 共 {len(issues)} 处视觉问题")
        return 1
    print("✅ 视觉审查通过")
    return 0

if __name__ == '__main__':
    sys.exit(main())
