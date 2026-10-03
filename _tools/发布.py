#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
发布（自查 → 通过才发）
=============================
用户要求（2026-10-03）：「每次的更新 一定要自查有什么问题」

流程：
  ① 跑自查.py
  ② 有问题 → 拒绝发布，报出问题
  ③ 没问题 → 发布指定文件
"""
import subprocess, sys, os, json, urllib.request, urllib.parse, base64, time, glob

WS = '/app/workspace/build'
TOKEN = f'{WS}/.token_site'
REPO = 'ark-notes/ark-notes.github.io'

def step(n, t):
    print(f"\n{'='*58}\n{n} · {t}\n{'='*58}")

def put(path):
    T = open(TOKEN).read().strip()
    url = f"https://api.github.com/repos/{REPO}/contents/" + urllib.parse.quote(path)
    sha = None
    try:
        r = urllib.request.Request(url, headers={'Authorization': f'token {T}', 'Accept': 'application/vnd.github+json'})
        sha = json.loads(urllib.request.urlopen(r, timeout=20).read())['sha']
    except Exception:
        pass
    data = open(f'{WS}/site/{path}', 'rb').read()
    body = {'message': f'update {os.path.basename(path)}', 'content': base64.b64encode(data).decode()}
    if sha:
        body['sha'] = sha
    for i in range(3):
        try:
            urllib.request.urlopen(urllib.request.Request(
                url, data=json.dumps(body).encode(), method='PUT',
                headers={'Authorization': f'token {T}', 'Accept': 'application/vnd.github+json',
                         'Content-Type': 'application/json'}), timeout=60)
            return True
        except Exception as e:
            if i == 2:
                raise
            time.sleep(4)

def main():
    files = sys.argv[1:]
    if not files:
        print("用法: python3 发布.py 文件1 文件2 ...")
        print("       python3 发布.py --all   （发布全部改动）")
        return 1

    step(1, '自查')
    r = subprocess.run(['python3', f'{WS}/自查.py'], capture_output=True, text=True, timeout=300)
    out = r.stdout
    print(out[-1200:])
    if r.returncode != 0:
        print("\n🔴 自查未通过，**拒绝发布**")
        print("   请先修掉上面的问题")
        return 1
    print("\n✅ 自查通过")

    step(2, '发布')
    if files == ['--all']:
        files = [os.path.basename(f) for f in glob.glob(f'{WS}/site/*.html')]
        files += [os.path.relpath(f, f'{WS}/site') for f in glob.glob(f'{WS}/site/**/*.min.*', recursive=True)]
    n = 0
    for f in files:
        try:
            put(f); print(f"  ✓ {f}"); n += 1
        except Exception as e:
            print(f"  ✗ {f}: {str(e)[:40]}")
        time.sleep(0.3)
    print(f"\n✅ 发布完成（{n} 个文件）")

    step(3, '提醒')
    print("  ⏳ CDN 更新需 2-3 分钟")
    print("  📌 验证：curl https://ark-notes.github.io/页面.html")
    return 0

if __name__ == '__main__':
    sys.exit(main())
