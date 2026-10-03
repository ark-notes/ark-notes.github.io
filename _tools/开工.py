#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
开工自检脚本（每次开工跑一遍）
================================
用户要求（2026-10-03）：
  「你在仓库里也要保存我们的对话，用于你的浏览。
   至于你怎么自动去查一遍，我觉得需要你写进规则里。
   当仓库抓取规则时就自动跑一遍。」

做三件事：
  ① 拉三个仓库
  ② 读对话记录（最近 3 天）
  ③ 比对台账 vs 实际 → 报告不一致
"""
import os, sys, subprocess, re, glob, json
from datetime import datetime, timedelta

WS = '/app/workspace/build'
REPOS = {
    'ark-transcripts':       'https://github.com/ark-notes/ark-transcripts.git',
    'ark-notes.github.io':   'https://github.com/ark-notes/ark-notes.github.io.git',
}

def sh(cmd, cwd=None, timeout=180):
    return subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True,
                          text=True, timeout=timeout)

def step(n, title):
    print(f"\n{'='*58}\n{n} · {title}\n{'='*58}")

def pull_repos():
    step(1, '拉仓库')
    os.makedirs('/tmp/_pull', exist_ok=True)
    out = {}
    for name, url in REPOS.items():
        d = f'/tmp/_pull/{name.split("/")[-1].split(".")[0]}'
        if os.path.exists(d):
            r = sh('git pull --depth 1', cwd=d)
            out[name] = '更新' if r.returncode == 0 else '拉取失败（用本地）'
        else:
            r = sh(f'git clone --depth 1 {url} {d}')
            out[name] = '克隆成功' if r.returncode == 0 else '失败'
        print(f"  {name:26} {out[name]}")
    return out

def sync_workspace():
    step(2, '同步到工作区')
    tr = '/tmp/_pull/ark-transcripts'
    if not os.path.isdir(tr):
        print("  ⚠️ 逐字稿仓库没拉到，跳过"); return
    mapping = [
        (f'{tr}/_tools/*.md',  f'{WS}/rules/'),
        (f'{tr}/_tools/*.py',  f'{WS}/'),
        (f'{tr}/_深挖/*.md',    f'{WS}/深挖/'),
        (f'{tr}/_对话记录/*.md', f'{WS}/对话记录/'),
        (f'{tr}/*.txt',        f'{WS}/transcripts/'),
    ]
    for src, dst in mapping:
        os.makedirs(dst, exist_ok=True)
        r = sh(f'cp -f {src} {dst} 2>/dev/null')
    # 需求总表
    sh(f'cp -f {tr}/_tools/需求总表.md {WS}/REQUIREMENTS.md 2>/dev/null')
    # 知识库
    sh(f'cp -rf {tr}/_knowledge/* {WS}/知识库/ 2>/dev/null')
    print("  ✓ 规则 / 深挖 / 对话记录 / 逐字稿 / 知识库 已同步")

def read_conversations(days=3):
    step(3, f'读对话记录（最近 {days} 天）')
    d = f'{WS}/对话记录'
    if not os.path.isdir(d):
        print("  ⚠️ 还没有对话记录目录"); return []
    files = sorted(glob.glob(f'{d}/*.md'), reverse=True)[:days]
    if not files:
        print("  ℹ️ 对话记录为空（正常，刚开始建立）"); return []
    for f in files:
        s = open(f, encoding='utf-8').read()
        name = os.path.basename(f)
        # 提取「未完成」部分
        m = re.search(r'##[^\n]*未完成[^\n]*\n(.*?)(?=\n##|\Z)', s, re.S)
        todo = m.group(1).strip()[:300] if m else '(无)'
        print(f"\n  📄 {name}")
        print(f"     未完成: {todo[:200]}")
    return files

def check_ledger():
    step(4, '比对台账 vs 实际')
    # 逐字稿场次
    tr_dir = f'{WS}/transcripts'
    dates = {}
    for f in glob.glob(f'{tr_dir}/2026-*.txt'):
        m = re.match(r'(2026-\d\d-\d\d)', os.path.basename(f))
        if m:
            dates.setdefault(m.group(1), 0)
            dates[m.group(1)] += 1
    total_sessions = sum(dates.values())
    print(f"  逐字稿日期类：{total_sessions} 场（{len(dates)} 天）")

    # 深挖成果
    mined = glob.glob(f'{WS}/深挖/[0-9]*.md')
    print(f"  深挖成果文件：{len(mined)} 份")

    # 台账
    ledger = f'{WS}/深挖/台账.md'
    if os.path.exists(ledger):
        s = open(ledger, encoding='utf-8').read()
        m = re.search(r'进度[:：]\s*(\d+)\s*/\s*(\d+)', s)
        if m:
            print(f"  台账记录：{m.group(1)} / {m.group(2)}")
            # 检查是否有写了文件但没进台账的
            for f in mined:
                name = os.path.basename(f)
                num = name.split('_')[0]
                if num.isdigit() and int(num) > int(m.group(2)):
                    print(f"  ⚠️ 发现未登记：{name}")
    else:
        print("  ⚠️ 台账不存在")

def check_missing():
    step(5, '检查未深挖的场次')
    # 从台账提取「待挖」标记
    ledger = f'{WS}/深挖/台账.md'
    if os.path.exists(ledger):
        s = open(ledger, encoding='utf-8').read()
        todo = re.findall(r'\|\s*\d+\s*\|\s*[\d,]+\s*\|\s*`([^`]+)`\s*\|\s*⬜', s)
        if todo:
            print(f"  未挖 {len(todo)} 支：")
            for t in todo[:12]: print(f"     · {t}")
        else:
            print("  ✅ 台账显示全部已挖")
    return

def main():
    print("=" * 58)
    print("开工自检 · MasterD")
    print(f"时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 58)
    pull_repos()
    sync_workspace()
    read_conversations()
    check_ledger()
    check_missing()
    step('✓', '完成')
    print("  下一步：读 rules/核心规则.md + 需求总表.md，然后开工")
    print("  铁律：每完成一件就发布，不攒批\n")

if __name__ == '__main__':
    main()
