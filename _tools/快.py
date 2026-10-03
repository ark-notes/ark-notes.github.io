#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速模式（日常用，不恢复环境）
================================
区别于 开工.py（全量恢复+对账）：
  快.py 只做最小必要的事 —— 不拉仓库、不逐项对账。
  只在「沙箱重启后第一次」用 开工.py。
"""
import sys, os, glob, subprocess

WS = '/app/workspace/build'

def main():
    # 只检查三件事：token / site / 关键文件
    tok = os.path.exists(f'{WS}/.token_site')
    pages = len(glob.glob(f'{WS}/site/*.html'))
    rules = os.path.exists(f'{WS}/rules/核心规则.md')
    tbl = os.path.exists(f'{WS}/问题总台账.md')

    if not (tok and pages > 30 and rules and tbl):
        print("🔴 环境不完整 → 请跑 开工.py")
        return 1
    print(f"✅ 环境正常（{pages} 页 / token ✓ / 规则 ✓ / 台账 ✓）")
    print("   → 直接干活，不用恢复")
    return 0

if __name__ == '__main__':
    sys.exit(main())
