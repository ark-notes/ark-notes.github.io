# 开工自检（每次干活前必读）

## 第 0 步：沙箱可能被清空
先跑：
```bash
cd /app/workspace/build && python3 restore.py
```
没有 .token / .token_site → 从对话记录里找（用户存过 5 次以上）。

## 第 1 步：读规则
- `rules/核心规则.md` ← 最高优先级
- `rules/项目档案.md` ← 进度

## 第 2 步：素材在哪
- 逐字稿：`transcripts/`（105 支）+ `vtranscripts/`（71 支）
- 真正的「空课」= `transcripts/2026-*`（28 支社课，20k-54k 字）+ 概念课 6 支
- AM/AV/VH 编号 = 空文件（无语音花絮），不用挖

## 第 3 步：网站
- `site/` ← 31 个 HTML
- 同步：`python3 sync_site.py`
- 本地预览：`python3 -m http.server 10340 --directory site`

## 铁律（不许再问用户）
1. 规则自己从仓库拉，**不要问用户**
2. 深挖不许浅尝
3. 落点 = 【可以直接讲】+【出处】
4. 客户版/讲师版分开
5. 引导优化放最后
6. 同一个错误不犯两次
