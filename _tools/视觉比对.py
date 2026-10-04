#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视觉比对工具（补我的视觉短板）
============================
用法：
  python3 视觉比对.py 图1 图2 [图3...]
功能：
  · 人脸相似度（insightface）→ 判断是否同一人
  · 阈值：
      >0.5  → 同一人 ✅
      0.35-0.5 → 接近 ⚠️
      <0.35 → 不同人 ❌
"""
import cv2, numpy as np, sys, os
from insightface.app import FaceAnalysis

_app = None
def get_app():
    global _app
    if _app is None:
        _app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        _app.prepare(ctx_id=0, det_size=(640,640))
    return _app

def get_emb(path):
    img = cv2.imread(path)
    if img is None: return None
    faces = get_app().get(img)
    if not faces: return None
    f = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
    return f.normed_embedding

def main():
    files = sys.argv[1:]
    if len(files) < 2:
        print(__doc__); return
    embs = {}
    print("=== 人脸检测 ===")
    for f in files:
        e = get_emb(f)
        embs[f] = e
        print(f"  {os.path.basename(f)}: {'✅ 检测到' if e is not None else '❌ 未检测到'}")
    print("\n=== 相似度比对 ===")
    ks = [f for f in files if embs[f] is not None]
    for i in range(len(ks)):
        for j in range(i+1, len(ks)):
            s = float(np.dot(embs[ks[i]], embs[ks[j]]))
            judge = "✅ 同一人" if s>0.5 else ("⚠️ 接近" if s>0.35 else "❌ 不同人")
            print(f"  {os.path.basename(ks[i])} vs {os.path.basename(ks[j])}: {s:.3f}  {judge}")

if __name__ == '__main__':
    main()
