#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
红果榜单抓取（自用）
====================
能力：
  1. 关键词搜索 → 剧名/热度/集数/标签/简介
  2. 按热度排序
  3. 多关键词合并
用法：
  python3 抓榜.py 末世              # 搜关键词
  python3 抓榜.py 末世 重生 空间     # 多关键词
  python3 抓榜.py --name 古今小货郎  # 精确查某剧
"""
import urllib.request, urllib.parse, json, sys, time

def search(kw):
    url = f"https://hongguoduanju.com/search/{urllib.parse.quote(kw)}"
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0","accept":"text/html"})
    html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8','ignore')
    i = html.find('"searchList":')
    if i < 0: return []
    j = html.find('[', i)
    arr, _ = json.JSONDecoder().raw_decode(html[j:])
    out = []
    for it in arr:
        vd = it.get('video_data', {})
        hs = vd.get('hot_score_data') or {}
        out.append({
            'name': vd.get('series_title') or it.get('name',''),
            'hot': hs.get('score', 0),
            'hot_text': hs.get('text', ''),
            'eps': vd.get('episode_cnt', 0),
            'cats': [c.get('name') for c in vd.get('category_list', [])],
            'intro': (vd.get('series_intro') or '')[:60],
            'id': vd.get('series_id', ''),
        })
    return out

def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); return
    # 精确名
    if args[0] == '--name':
        kws = [' '.join(args[1:])]
    else:
        kws = args
    allr = {}
    for kw in kws:
        try:
            for it in search(kw):
                if it['name'] and it['hot'] > 0:
                    allr[it['name']] = it
            time.sleep(0.8)
        except Exception as e:
            print(f"  ⚠️ {kw}: {e}")
    ranked = sorted(allr.values(), key=lambda x: -x['hot'])
    print(f"\n共 {len(ranked)} 部（按热度排序）\n")
    print(f"{'热度':>10} {'集数':>6}  剧名")
    print("-"*60)
    for it in ranked:
        print(f"{it['hot_text']:>10} {it['eps']:>6}  {it['name']}")
        if it['cats']: print(f"{'':>19}标签: {'/'.join(it['cats'])}")

def batch_save(kws, outfile='/app/workspace/build/榜单数据.json'):
    """批量抓取并存 JSON"""
    allr = {}
    for kw in kws:
        try:
            for it in search(kw):
                if it['name'] and it['hot'] > 0:
                    allr[it['name']] = it
            time.sleep(0.8)
        except Exception as e:
            print(f"  ⚠️ {kw}: {e}")
    data = sorted(allr.values(), key=lambda x: -x['hot'])
    json.dump(data, open(outfile, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"✅ 保存 {len(data)} 部 → {outfile}")
    return data

if __name__ == '__main__':
    main()

# ===== 扩展：批量抓 + 存 JSON =====
