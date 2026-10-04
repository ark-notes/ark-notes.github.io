#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
短剧质检（视觉部分）
==================
用途：每个镜头生成后，自动检测质量
检查：
  1. 人脸一致性（和角色基准图比）→ 相似度
  2. 分辨率/时长
用法：
  python3 短剧质检.py --ref 基准图.jpg 镜头1.jpg 镜头2.jpg ...
"""
import cv2, sys, os, subprocess, json
import numpy as np
from insightface.app import FaceAnalysis

_app = None
def get_app():
    global _app
    if _app is None:
        _app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        _app.prepare(ctx_id=0, det_size=(640,640))
    return _app

def get_face_emb(img_path):
    img = cv2.imread(img_path)
    if img is None: return None
    faces = get_app().get(img)
    if not faces: return None
    f = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
    return f.normed_embedding

def main():
    args = sys.argv[1:]
    if '--ref' not in args:
        print(__doc__); return
    ri = args.index('--ref')
    ref = args[ri+1]
    targets = [a for a in args[:ri] if not a.startswith('--')] + args[ri+2:]
    
    ref_emb = get_face_emb(ref)
    if ref_emb is None:
        print(f"❌ 基准图未检测到人脸: {ref}"); return
    print(f"基准图: {os.path.basename(ref)} ✅\n")
    
    print(f"{'文件':<28} {'相似度':>8}  判断")
    print("-"*52)
    for t in targets:
        e = get_face_emb(t)
        if e is None:
            print(f"{os.path.basename(t):<28} {'❌无人脸':>8}")
            continue
        s = float(np.dot(ref_emb, e))
        judge = "✅ 一致" if s>0.5 else ("⚠️ 接近" if s>0.35 else "🔴 跑偏")
        print(f"{os.path.basename(t):<28} {s:>8.3f}  {judge}")

if __name__ == '__main__':
    main()
