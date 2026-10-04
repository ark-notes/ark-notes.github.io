import base64, json, os, urllib.request, urllib.parse, time

TOKEN = open('/app/workspace/build/.token_site').read().strip()
REPO = "ark-notes/ark-notes.github.io"

def gh(method, path, data=None):
    req = urllib.request.Request("https://api.github.com"+path,
        data=json.dumps(data).encode() if data else None, method=method,
        headers={"Authorization":f"token {TOKEN}","Accept":"application/vnd.github+json",
                 "User-Agent":"push","Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())

def put(local, remote):
    b64 = base64.b64encode(open(local,"rb").read()).decode()
    p = "/repos/"+REPO+"/contents/"+urllib.parse.quote(remote)
    sha=None
    try: sha = gh("GET", p).get("sha")
    except Exception: pass
    data={"message":f"update {remote}", "content":b64}
    if sha: data["sha"]=sha
    for i in range(3):
        try:
            r=gh("PUT",p,data)
            return "content" in r
        except Exception as e:
            if i==2: return False
            time.sleep(3)
    return False

WS='/app/workspace/build'
targets=[]
# D5 域全部
for root,dirs,files in os.walk(f'{WS}/域/D5_内容变现'):
    for fn in files:
        if fn.startswith('.'): continue
        full=os.path.join(root,fn)
        rel='_域/'+os.path.relpath(full, f'{WS}/域').replace('\\','/')
        targets.append((full,rel))
# rules
for fn in os.listdir(f'{WS}/rules'):
    if fn.startswith('.'): continue
    targets.append((f'{WS}/rules/{fn}', '_tools/'+fn))
# 能力档案
targets.append((f'{WS}/能力档案.md','能力档案.md'))

print(f"准备推送 {len(targets)} 个文件")
ok=fail=0
for local,remote in targets:
    if not os.path.exists(local): continue
    if put(local,remote): ok+=1
    else: fail+=1; print(f"  ❌ {remote}")
print(f"✅ {ok} 成功 / ❌ {fail} 失败")
