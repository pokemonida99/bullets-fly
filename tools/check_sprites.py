# 檢查切好的動作格有沒有破圖：碎片（跟本體分開的小塊）、殘留洋紅、高度異常、腳底對不齊
# 用法：python3 tools/check_sprites.py [預覽圖輸出資料夾]
import json, re, io, base64, sys, os
from PIL import Image
src = open('js/sprite_data.js').read()
data = json.loads(src[src.index('{'):src.rindex('}') + 1])
out_dir = sys.argv[1] if len(sys.argv) > 1 else None
report = []
def comps(im):
    a = im.getchannel('A'); w, h = im.size; px = a.load(); seen = set(); cs = []
    for y in range(h):
        for x in range(w):
            if px[x, y] and (x, y) not in seen:
                st = [(x, y)]; seen.add((x, y)); n = 0; xs = []; ys = []
                while st:
                    cx, cy = st.pop(); n += 1; xs.append(cx); ys.append(cy)
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and (nx, ny) not in seen: seen.add((nx, ny)); st.append((nx, ny))
                cs.append((n, min(xs), min(ys), max(xs), max(ys)))
    return sorted(cs, reverse=True)
for cid, d in data.items():
    atlas = Image.open(io.BytesIO(base64.b64decode(d['img'].split(',')[1]))).convert('RGBA')
    idle_h = d['frames']['idle0'][3]
    for n, (x, y, w, h, ax) in d['frames'].items():
        fr = atlas.crop((x, y, x + w, y + h)); probs = []
        cs = comps(fr)
        stray = [c for c in cs[1:] if c[0] >= 6]
        if stray: probs.append(f'碎片{len(stray)}塊(最大{stray[0][0]}px)')
        p = fr.load(); mag = sum(1 for yy in range(h) for xx in range(w) if p[xx, yy][3] and p[xx, yy][0] > 170 and p[xx, yy][2] > 170 and p[xx, yy][1] < 120)
        if mag > 3: probs.append(f'洋紅{mag}px')
        ride = n.startswith('r') and n in ('ride0','ride1','ride2','ride3','ratk0','ratk1','rjump','rhurt')
        if not ride and n not in ('down', 'down2', 'fall', 'jatk1', 'dash1') and h > idle_h * 1.35: probs.append(f'太高{h}/{idle_h}')
        if not ride and n not in ('down', 'down2', 'fall', 'jump0', 'jump2', 'jump3', 'jatk0', 'jatk1', 'beg', 'kneel', 'kneel2', 'mine', 'sp0', 'sp1', 's2a', 's2b', 's1a', 'dash0', 'dash1', 'getup', 'crouch') and h < idle_h * 0.6: probs.append(f'太矮{h}/{idle_h}')
        if probs:
            report.append((cid, n, probs))
            if out_dir:
                os.makedirs(out_dir, exist_ok=True)
                big = fr.resize((w * 4, h * 4), Image.NEAREST); bg = Image.new('RGBA', big.size, (60, 60, 80, 255)); bg.paste(big, (0, 0), big)
                bg.save(f'{out_dir}/{cid}_{n}.png')
for cid, n, p in report: print(cid, n, '、'.join(p))
print('共', len(report), '格有疑慮')
