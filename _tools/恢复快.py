#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速恢复（分层，不全量读）
=================================
用户要求：「沙箱清掉就没了，需要抓仓库，但全部读取很慢」

核心：不是"全量恢复"，而是"按需恢复"
  第1层：核心（rules + 能力档案）← 必恢复，几KB
  第2层：当前任务域（如 D5）  ← 按需
  第3层：归档（深挖/逐字稿）  ← 用到才恢复
"""
import os, subprocess, sys

WS = '/app/workspace/build'
REPO = 'https://github.com/ark-notes/ark-notes.github.io.git'

def sh(c, t=180):
    return subprocess.run(c, shell=True, capture_output=True, text=True, timeout=t)

def main():
    layer = sys.argv[1] if len(sys.argv) > 1 else 'core'
    os.makedirs(WS, exist_ok=True)

    print(f"=== 快速恢复（层：{layer}）===")

    # 稀疏 clone（只拉需要目录）
    repo_dir = f'{WS}/_repo'
    if not os.path.exists(repo_dir):
        print("  [1/2] 稀疏克隆...")
        sh(f'git clone --depth 1 --filter=blob:none --sparse {REPO} {repo_dir}')
        # 按层设置 sparse-checkout
        if layer == 'core':
            paths = '_tools 能力档案.md'
        elif layer == 'd5':
            paths = '_tools 能力档案.md _域/D5_内容变现'
        else:  # all
            paths = ''
        if paths:
            sh(f'cd {repo_dir} && git sparse-checkout set {paths}')
        else:
            sh(f'cd {repo_dir} && git sparse-checkout disable')
    else:
        sh(f'cd {repo_dir} && git pull --depth 1')
        print("  [1/2] 已存在，pull")

    # 恢复核心
    sh(f'mkdir -p {WS}/rules')
    sh(f'cp -f {repo_dir}/_tools/*.md {WS}/rules/ 2>/dev/null')
    sh(f'cp -f {repo_dir}/_tools/*.py {WS}/ 2>/dev/null')
    sh(f'cp -f {repo_dir}/能力档案.md {WS}/ 2>/dev/null')

    # 恢复域（按层）
    if layer in ('d5', 'all'):
        sh(f'mkdir -p {WS}/域')
        sh(f'cp -rf {repo_dir}/_域/* {WS}/域/ 2>/dev/null')

    # 恢复网站（all 才做）
    if layer == 'all':
        sh(f'mkdir -p {WS}/site')
        sh(f'cp -rf {repo_dir}/*.html {WS}/site/ 2>/dev/null')
        sh(f'cp -rf {repo_dir}/assets {WS}/site/ 2>/dev/null')
        sh(f'cp -rf {repo_dir}/data {WS}/site/ 2>/dev/null')

    print("  [2/2] 完成")
    print(f"\n✅ 恢复（{layer}）：")
    print(f"   rules: {len(os.listdir(f'{WS}/rules')) if os.path.exists(f'{WS}/rules') else 0} 份")
    if os.path.exists(f'{WS}/域'):
        n=sum(len(f) for _,_,f in os.walk(f'{WS}/域'))
        print(f"   域文件: {n} 个")

if __name__ == '__main__':
    main()
