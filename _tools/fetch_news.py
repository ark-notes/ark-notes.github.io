#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""抓取 ARK 官方资料库最新内容
来源：https://ark-library.com/api/posts
分类：official-announcement / subsidy-policy / community-tweets / daily-class ...
"""
import json, urllib.request, urllib.parse, sys, datetime

BASE = "https://ark-library.com/api/posts"

def fetch(category, limit=30):
    url = f"{BASE}?category={urllib.parse.quote(category)}&limit={limit}"
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0","Accept":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def zh_text(it):
    locs = it.get("localizations", {})
    return locs.get("zh", {}).get("text", "") or ""

def main():
    cats = sys.argv[1:] or ["official-announcement","subsidy-policy","community-tweets","daily-class"]
    out = {"fetchedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "categories": {}}
    for c in cats:
        try:
            d = fetch(c)
            items = d.get("items", [])
            # 只留中文 + 有文字
            seen=set(); zh_items=[]
            for it in items:
                t = zh_text(it)
                ts = (it.get("publishedAt") or it.get("createdAt") or "")[:10]
                if not t or not ts: continue
                key = ts + t[:40]
                if key in seen: continue
                seen.add(key)
                zh_items.append({"date": ts, "text": t, "slug": it.get("categorySlug"), "type": it.get("postType")})
            out["categories"][c] = zh_items
            print(f"  {c}: {len(zh_items)} 条（中文去重后）")
        except Exception as e:
            print(f"  ❌ {c}: {e}")
    json.dump(out, open("/app/workspace/build/news_latest.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
    print("✅ 已保存 news_latest.json")

if __name__ == "__main__":
    main()
