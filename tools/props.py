# 道具表（GPT 畫的 4×2 洋紅底 work/art/props.png）→ 去背、切格、縮成遊戲尺寸，輸出 js/prop_data.js
# 用法：python3 tools/props.py [預覽圖輸出路徑]
import sys, io, base64, json
from PIL import Image

SHEETS = {'props': ['drum', 'jar', 'crate', 'goose', 'jelly', 'coin', 'gold', 'pouch'],
          'props2': ['axe', 'boulder', 'log', 'clock', 'bush', 'stones', 'flag', 'hotpot']}
SIZE = {'drum': 46, 'jar': 20, 'crate': 18, 'goose': 13, 'jelly': 12, 'coin': 10, 'gold': 8, 'pouch': 13,
        'axe': 14, 'boulder': 22, 'log': 14, 'clock': 12, 'bush': 16, 'stones': 8, 'flag': 22, 'hotpot': 16}   # 目標高度（遊戲像素）


def is_mag(r, g, b):
    return r > 150 and b > 150 and g < 110


def main():
  out = {}; prev = []
  for sheet, NAMES in SHEETS.items():
    import os
    if not os.path.exists(f'work/art/{sheet}.png'): continue
    im = Image.open(f'work/art/{sheet}.png').convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if is_mag(r, g, b): px[x, y] = (0, 0, 0, 0)
    for i, n in enumerate(NAMES):
        c, r = i % 4, i // 4
        cell = im.crop((c * im.width // 4, r * im.height // 2, (c + 1) * im.width // 4, (r + 1) * im.height // 2))
        bb = cell.getbbox(); cell = cell.crop(bb)
        if n == 'drum':   # 冤鼓要滾：只留圓形鼓身，去掉木架
            d = cell.width; cell = cell.crop((0, 0, d, d)); m = Image.new('L', (d, d), 0)
            from PIL import ImageDraw; ImageDraw.Draw(m).ellipse((1, 1, d - 2, d - 2), fill=255)
            a = Image.composite(cell.getchannel('A'), Image.new('L', (d, d), 0), m); cell.putalpha(a)
        h = SIZE[n]; w = max(1, round(cell.width * h / cell.height))
        sm = cell.resize((w, h), Image.LANCZOS); p = sm.load()
        for y in range(h):
            for x in range(w):
                rr, gg, bb2, a = p[x, y]
                p[x, y] = (0, 0, 0, 0) if a < 140 or is_mag(rr, gg, bb2) else (rr, gg, bb2, 255)
        sm = sm.crop(sm.getbbox())
        b = io.BytesIO(); sm.save(b, 'PNG'); out[n] = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
        prev.append(sm); print(n, sm.size)
  if True:
    open('js/prop_data.js', 'w').write('// 由 tools/props.py 產生，勿手改\nwindow.PROP_ART = ' + json.dumps(out) + ';\n')
    if len(sys.argv) > 1:
        W = sum(p.width + 4 for p in prev); H = max(p.height for p in prev)
        pv = Image.new('RGBA', (W, H), (60, 60, 80, 255)); x = 0
        for p in prev: pv.paste(p, (x, H - p.height), p); x += p.width + 4
        pv.resize((W * 4, H * 4), Image.NEAREST).save(sys.argv[1])


main()
