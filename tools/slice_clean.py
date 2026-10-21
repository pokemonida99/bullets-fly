# 從 tools/slice.py 抽出來的碎片清理（頭像也用）
from PIL import Image, ImageChops, ImageFilter

def clean(sm, gap=5):
    # 只留本體＋貼著本體的部分（槍口火光、聲波、煙）；去掉跟本體分開的碎片
    # （格子切法切進來的鄰格碎塊、GPT 畫進格子裡的障礙物、丟出去的道具——遊戲另外畫飛道具）
    a = sm.getchannel('A'); w, h = a.size; px = a.load(); seen = set(); cs = []
    for y in range(h):
        for x in range(w):
            if px[x, y] and (x, y) not in seen:
                st = [(x, y)]; seen.add((x, y)); pts = []
                while st:
                    cx, cy = st.pop(); pts.append((cx, cy))
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < w and 0 <= ny < h and px[nx, ny] and (nx, ny) not in seen: seen.add((nx, ny)); st.append((nx, ny))
                cs.append(pts)
    if len(cs) <= 1: return sm
    cs.sort(key=len, reverse=True)
    main = Image.new('L', (w, h), 0); mp = main.load()
    for (x, y) in cs[0]: mp[x, y] = 255
    near = main.filter(ImageFilter.MaxFilter(gap * 2 + 1)).load()
    keep = main.copy(); kp = keep.load()
    for c in cs[1:]:
        if any(near[x, y] for (x, y) in c[::3]):
            for (x, y) in c: kp[x, y] = 255
    out = sm.copy(); out.putalpha(ImageChops.multiply(a, keep))
    bb = out.getbbox(); return out.crop(bb) if bb else out



def bbox_of(orig, cleaned):
    # 清理後的圖在原圖裡的位置（clean 會裁掉空白；用原圖找回左上角）
    a = orig.getchannel('A'); w, h = cleaned.size
    best = None
    ob = a.getbbox()
    for y0 in range(ob[1], ob[3] - h + 2):
        for x0 in range(ob[0], ob[2] - w + 2):
            if orig.getpixel((x0 + w // 2, y0 + h // 2))[:3] == cleaned.getpixel((w // 2, h // 2))[:3] and orig.getpixel((x0, y0 + h - 1))[3] == cleaned.getpixel((0, h - 1))[3]:
                return (x0, y0)
    return ob[:2]
