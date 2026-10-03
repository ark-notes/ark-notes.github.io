#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一键恢复（沙箱重启后跑这个）
================================
用法：python3 恢复.py
"""
import os, subprocess, glob, sys

WS = '/app/workspace/build'

def sh(c, t=200):
    return subprocess.run(c, shell=True, capture_output=True, text=True, timeout=t)

def step(n, t): print(f"\n{'='*56}\n{n} · {t}\n{'='*56}")

def main():
    step(1, '拉仓库')
    for name, url in [('_st', 'https://github.com/ark-notes/ark-notes.github.io.git'),
                      ('_tr', 'https://github.com/ark-notes/ark-transcripts.git')]:
        d = f'/tmp/{name}'
        if not os.path.exists(d):
            sh(f'git clone --depth 1 -q {url} {d}')
        else:
            sh(f'cd {d} && git pull --depth 1 -q')
        print(f"  {'✓' if os.path.exists(d) else '✗'} {name}")

    step(2, '恢复工作区')
    for d in ['rules', 'site', 'transcripts', '深挖', '知识库', '对话记录', '域']:
        os.makedirs(f'{WS}/{d}', exist_ok=True)
    # 网站全量
    sh(f'cp -rf /tmp/_st/* {WS}/site/ 2>/dev/null')
    # 规则 + 脚本（两个来源）
    sh(f'cp -f /tmp/_st/_tools/*.md {WS}/rules/ 2>/dev/null')
    sh(f'cp -f /tmp/_st/_tools/*.py {WS}/ 2>/dev/null')
    sh(f'cp -f /tmp/_tr/_tools/*.md {WS}/rules/ 2>/dev/null')
    sh(f'cp -f /tmp/_tr/_tools/*.py {WS}/ 2>/dev/null')
    sh(f'cp -f /tmp/_tr/_tools/需求总表.md {WS}/REQUIREMENTS.md 2>/dev/null')
    # 深挖
    sh(f'cp -f /tmp/_tr/_knowledge/D1_网站/深挖/*.md {WS}/深挖/ 2>/dev/null')
    sh(f'cp -f /tmp/_tr/_深挖/*.md {WS}/深挖/ 2>/dev/null')
    # 逐字稿
    sh(f'cp -f /tmp/_tr/*.txt {WS}/transcripts/ 2>/dev/null')
    # 对话 / 域 / 能力档案
    sh(f'cp -rf /tmp/_st/_对话记录/* {WS}/对话记录/ 2>/dev/null')
    sh(f'cp -rf /tmp/_st/_域/* {WS}/域/ 2>/dev/null')
    sh(f'cp -f /tmp/_st/能力档案.md {WS}/ 2>/dev/null')
    sh(f'cp -f /tmp/_st/重启后第一件事.md {WS}/ 2>/dev/null')
    print("  ✓ 已同步")

    step(3, '环境对账')
    print(f"  HTML：{len(glob.glob(f'{WS}/site/*.html'))} 页")
    print(f"  assets：{len(glob.glob(f'{WS}/site/assets/*'))} 个")
    print(f"  深挖：{len(glob.glob(f'{WS}/深挖/*.md'))} 份")
    print(f"  逐字稿：{len(glob.glob(f'{WS}/transcripts/*.txt'))} 支")
    print(f"  对话记录：{len(glob.glob(f'{WS}/对话记录/*.md'))} 份")
    print(f"  域：{len(glob.glob(f'{WS}/域/**/*.md', recursive=True))} 个")
    tok = os.path.exists(f'{WS}/.token_site')
    print(f"  token：{'✓' if tok else '✗ 需从对话历史搜 github_pat_'}")

    step('✓', '恢复完成')
    print(f"""
  下一步：
    1. 读 能力档案.md（恢复"我是谁"）
    2. 读 rules/核心规则.md（第0条=自进化）
    3. 读 对话记录/（恢复"做到哪"）
    4. 读 深挖/台账.md（恢复"还差什么"）
    5. 跑 python3 开工.py
""")
    return 0

if __name__ == '__main__':
    sys.exit(main())
