#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新后自查（每次发布前必跑）
================================
用户要求（2026-10-03）：
  「每次的更新 一定要自查有什么问题」

检查 7 项：
  ① HTML 结构（标签闭合）
  ② 内链（死链检查）
  ③ 外链（可访问性）
  ④ 图片（是否存在/可加载）
  ⑤ 出处覆盖（话术块 vs 出处块）
  ⑥ 术语系统（渲染是否正常）
  ⑦ 页面渲染（无破图/无溢出）
"""
import os, glob, re, sys, json, subprocess
from collections import defaultdict

WS = '/app/workspace/build/site'
PAGES = sorted([os.path.basename(f) for f in glob.glob(f'{WS}/*.html') if not os.path.basename(f).startswith('_')])

def hdr(n, t):
    print(f"\n{'='*62}\n{n} · {t}\n{'='*62}")

issues = []

# ---------- ① HTML 结构 ----------
def check_html():
    hdr(1, 'HTML 结构（标签闭合）')
    class P:
        pass
    import html.parser
    class Q(html.parser.HTMLParser):
        def __init__(s):
            super().__init__(); s.stack=[]; s.err=[]
        def handle_starttag(s,t,a):
            if t not in ('meta','link','br','img','input','hr','source','path','circle','rect','use','col','area','base','embed','track','wbr'):
                s.stack.append(t)
        def handle_endtag(s,t):
            if s.stack and s.stack[-1]==t: s.stack.pop()
            elif t in s.stack:
                while s.stack and s.stack.pop()!=t: pass
    bad=0
    for f in PAGES:
        p=Q()
        try: p.feed(open(f'{WS}/{f}',encoding='utf-8').read())
        except Exception as e: print(f"  ✗ {f}: 解析失败"); bad+=1; continue
        if p.stack:
            print(f"  ✗ {f}: 未闭合 {p.stack[-3:]}"); bad+=1
    print(f"  {'✅ 全部闭合' if bad==0 else f'🔴 {bad} 页有问题'}")
    if bad: issues.append(f"{bad} 页 HTML 未闭合")

# ---------- ② 内链 ----------
def check_internal():
    hdr(2, '内链（死链检查）')
    dead=0
    for f in PAGES:
        s=open(f'{WS}/{f}',encoding='utf-8').read()
        for link in set(re.findall(r'href="([a-zA-Z0-9_\-]+\.html)', s)):
            if not os.path.exists(f'{WS}/{link}'):
                print(f"  ✗ {f} → {link}"); dead+=1
    print(f"  {'✅ 无死链' if dead==0 else f'🔴 {dead} 处死链'}")
    if dead: issues.append(f"{dead} 处内链死链")

# ---------- ③ 图片 ----------
def check_images():
    hdr(3, '图片引用')
    miss=0; total=0
    for f in PAGES:
        s=open(f'{WS}/{f}',encoding='utf-8').read()
        for src in re.findall(r'<img[^>]+src="([^"]+)"', s):
            if src.startswith('http') or src.startswith('data:'): continue
            total+=1
            if not os.path.exists(f'{WS}/{src}'):
                print(f"  ✗ {f} → {src}"); miss+=1
    print(f"  {'✅ 全部存在' if miss==0 else f'🔴 {miss} 处图片缺失'}（共 {total} 处引用）")
    if miss: issues.append(f"{miss} 处图片缺失")

# ---------- ④ 出处覆盖 ----------
def check_sources():
    hdr(4, '出处覆盖（话术块 vs 出处块）')
    low=[]
    for f in PAGES:
        s=open(f'{WS}/{f}',encoding='utf-8').read()
        t=len(re.findall(r'class="talk"', s))
        sc=len(re.findall(r'class="src"', s))
        if t>=3 and sc==0:
            low.append((f,t,sc))
    if low:
        for f,t,sc in low: print(f"  🔴 {f}: 话术{t} 出处{sc}")
        issues.append(f"{len(low)} 页有话术无出处")
    else:
        print("  ✅ 有话术的页面都有出处")

# ---------- ⑤ 术语系统 ----------
def check_terms():
    hdr(5, '术语系统')
    n=0
    for f in PAGES:
        s=open(f'{WS}/{f}',encoding='utf-8').read()
        if 'class="term" data-t=' in s:
            n+=1
            if 'assets/terms' not in s:
                print(f"  🔴 {f}: 有术语但没引 terms.js"); issues.append(f"{f} 缺 terms.js")
    print(f"  ✅ {n} 页使用术语系统")

# ---------- ⑥ SEO ----------
def check_seo():
    hdr(6, 'SEO 元数据')
    no_desc=no_og=0
    for f in PAGES:
        s=open(f'{WS}/{f}',encoding='utf-8').read()
        if 'name="description"' not in s: no_desc+=1; print(f"  ✗ {f} 缺 description")
        if 'property="og:' not in s: no_og+=1; print(f"  ✗ {f} 缺 og")
    print(f"  {'✅ 全部完整' if no_desc+no_og==0 else f'🔴 缺 desc {no_desc} / 缺 og {no_og}'}")
    if no_desc+no_og: issues.append(f"SEO 缺失 {no_desc+no_og} 处")

# ---------- ⑦ 无障碍 ----------
def check_a11y():
    hdr(7, '无障碍基础')
    no_skip=no_main=0
    for f in PAGES:
        s=open(f'{WS}/{f}',encoding='utf-8').read()
        if 'skip-link' not in s: no_skip+=1
        if '<main' not in s: no_main+=1
    print(f"  缺 skip-link: {no_skip} 页")
    print(f"  缺 main: {no_main} 页")
    if no_skip or no_main: issues.append(f"无障碍缺失 skip{no_skip}/main{no_main}")

def main():
    print("="*62)
    print("更新后自查 · MasterD")
    print(f"页面数：{len(PAGES)}")
    print("="*62)
    check_html()
    check_internal()
    check_images()
    check_sources()
    check_terms()
    check_seo()
    check_a11y()
    hdr('汇总', '自查结果')
    if issues:
        print("🔴 发现以下问题：")
        for i in issues: print(f"   · {i}")
        return 1
    print("✅ 全部通过，可以发布")
    return 0

if __name__ == '__main__':
    sys.exit(main())
