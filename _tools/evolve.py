#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自进化引擎 · evolve.py
================================
用户要求（2026-10-03）：
  「怎么变得更强大？肯定得需要你自进化。」

三个动作：
  ① 学（learn）   —— 扫描外部新资源，找可吸收的
  ② 查（audit）   —— 对比「说的」和「做的」，找不一致
  ③ 报（report）  —— 输出进化建议
"""
import os, re, json, glob, subprocess, urllib.request, urllib.parse, sys
from datetime import datetime, timedelta

WS = '/app/workspace/build'

def step(n, t):
    print(f"\n{'='*60}\n{n} · {t}\n{'='*60}")

# ---------------------------------------------------------------
# ① 学：扫描外部新资源
# ---------------------------------------------------------------
GH_QUERIES = [
    "agent skill distill",
    "claude skill collection",
    "skill knowledge extraction",
]

def learn():
    step(1, '学 · 扫描外部新资源（GitHub Agent Skill）')
    try:
        # 先看上次扫描时间
        state_f = f'{WS}/.evolve_state.json'
        state = json.load(open(state_f)) if os.path.exists(state_f) else {}
        last = state.get('lastScan')
        if last:
            days = (datetime.now() - datetime.fromisoformat(last)).days
            if days < 7:
                print(f"  ⏭ 距上次扫描 {days} 天（< 7 天），跳过。下次：{(datetime.fromisoformat(last)+timedelta(days=7)).strftime('%m-%d')}")
                return []
        found = {}
        for q in GH_QUERIES:
            u = f"https://api.github.com/search/repositories?q={urllib.parse.quote(q)}&sort=stars&per_page=5"
            try:
                r = urllib.request.Request(u, headers={'User-Agent':'Mozilla/5.0','Accept':'application/vnd.github+json'})
                d = json.loads(urllib.request.urlopen(r, timeout=20).read())
                for x in d.get('items', []):
                    found[x['full_name']] = x['stargazers_count']
            except Exception as e:
                print(f"  ⚠️ {q}: {str(e)[:40]}")
        # 比对已知的
        known = state.get('knownRepos', {})
        new = {k:v for k,v in found.items() if k not in known and v > 500}
        if new:
            print(f"  🔍 发现 {len(new)} 个新的大项目：")
            for k,v in sorted(new.items(), key=lambda x:-x[1])[:8]:
                print(f"     {v:>6}⭐ {k}")
        else:
            print("  ✓ 没有新的值得关注的项目")
        state['lastScan'] = datetime.now().isoformat()
        state['knownRepos'] = {**known, **found}
        json.dump(state, open(state_f, 'w'), ensure_ascii=False, indent=1)
        return list(new.items())
    except Exception as e:
        print(f"  ✗ 扫描失败：{str(e)[:60]}")
        return []

# ---------------------------------------------------------------
# ② 查：对比「说的」和「做的」
# ---------------------------------------------------------------
def audit():
    step(2, '查 · 对比规则 vs 实际执行')
    issues = []
    # 检查1：规则里要求的文件是否存在
    required = {
        'rules/核心规则.md': '核心行为准则',
        'rules/需求总表.md': '需求清单',
        'rules/开工自检.md': '开工流程',
        'rules/AI工作准则.md': '防幻觉8条',
        'rules/Skill蒸馏方法论.md': '方法论',
        'rules/自进化机制.md': '自进化',
        '知识库/D1_网站/踩坑记录.md': '踩坑记录',
        '对话记录/': '对话记录目录',
    }
    for path, label in required.items():
        full = f'{WS}/{path}'
        ok = os.path.isdir(full) if path.endswith('/') else os.path.exists(full)
        if not ok:
            issues.append(f"缺文件：{path}（{label}）")
            print(f"  🔴 缺失：{path}（{label}）")
        else:
            print(f"  ✓ {label}")

    # 检查2：台账 vs 实际
    mined = len(glob.glob(f'{WS}/深挖/[0-9]*.md'))
    ledger = f'{WS}/深挖/台账.md'
    if os.path.exists(ledger):
        s = open(ledger, encoding='utf-8').read()
        m = re.search(r'进度[:：]\s*(\d+)\s*/\s*(\d+)', s)
        if m:
            said = int(m.group(1))
            if abs(said - mined) > 2:
                issues.append(f"台账不准：写 {said}，实际文件 {mined}")
                print(f"  🔴 台账不准：写 {said} / 实际 {mined}")
            else:
                print(f"  ✓ 台账一致（{said} vs {mined}）")

    # 检查3：对话记录是否连续
    convs = sorted(glob.glob(f'{WS}/对话记录/*.md'))
    if convs:
        print(f"  ✓ 对话记录 {len(convs)} 份（最新：{os.path.basename(convs[-1])}）")
    else:
        issues.append("还没有对话记录")
        print("  🔴 还没有对话记录")

    return issues

# ---------------------------------------------------------------
# ③ 报：输出进化建议
# ---------------------------------------------------------------
def report(new_repos, issues):
    step(3, '报 · 进化建议')
    if new_repos:
        print("  📚 建议吸收的新资源：")
        for name, stars in sorted(new_repos, key=lambda x:-x[1])[:3]:
            print(f"     · {name}（{stars}⭐）")
    if issues:
        print("  ⚠️ 需要处理的问题：")
        for i in issues: print(f"     · {i}")
    else:
        print("  ✓ 机制运转正常")
    print("\n  💡 提醒：自进化不是自动的 —— 上面的建议需要我实际去做。")

def main():
    print("=" * 60)
    print("自进化引擎 · MasterD")
    print(f"时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    new_repos = learn()
    issues = audit()
    report(new_repos, issues)
    print()

if __name__ == '__main__':
    main()
