# 背景、標題圖、結局圖、頭像：GPT 原圖 → 遊戲尺寸，輸出 js/art_data.js
# 頭像取自角色設定圖（work/art/ref_<id>.png）左半邊的半身像，去白底
# 用法：python3 tools/stage_art.py [預覽圖輸出路徑]
import sys, io, base64, json
from PIL import Image, ImageDraw

W, H = 384, 216
BGS = ['bg1', 'bg2', 'bg3', 'bg4', 'bg5', 'title', 'ending']
PORTRAIT_IDS = ['dage', 'erge', 'sange', 'liuzi', 'tang', 'huwan', 'wu', 'guard', 'mask']


def url(im, fmt='PNG'):
    b = io.BytesIO(); im.save(b, fmt); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def bg(key):
    im = Image.open(f'work/art/{key}.png').convert('RGB')
    tw = im.width; th = round(tw * H / W)
    if th > im.height: th = im.height; tw = round(th * W / H)
    x0 = (im.width - tw) // 2; y0 = im.height - th          # 保留底部地面
    im = im.crop((x0, y0, x0 + tw, y0 + th)).resize((W, H), Image.LANCZOS)
    return im.quantize(colors=160, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')


def portrait(cid, sizes=(40, 96)):
    im = Image.open(f'work/art/ref_{cid}.png').convert('RGB')
    key = (255, 0, 255)
    fill = im.copy()
    for p in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width // 2, 0), (im.width // 2, im.height - 1), (im.width - 1, im.height - 1)]:
        if sum(fill.getpixel(p)) > 690: ImageDraw.floodfill(fill, p, key, thresh=40)
    px = fill.load(); a = Image.new('L', im.size, 0); ap = a.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y] != key: ap[x, y] = 255
    # 左邊那個（半身像）：找左半邊的不透明範圍
    cols = [any(ap[x, y] for y in range(0, im.height, 3)) for x in range(im.width)]
    x0 = cols.index(True); x1 = x0
    while x1 < im.width and cols[x1]: x1 += 1
    rgba = im.convert('RGBA'); rgba.putalpha(a)
    bust = rgba.crop((x0, 0, x1, im.height)); bust = bust.crop(bust.getbbox())
    side = max(bust.width, bust.height)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(bust, ((side - bust.width) // 2, side - bust.height))
    out = []
    for s in sizes:
        sm = sq.resize((s, s), Image.LANCZOS); p = sm.load()
        for y in range(s):
            for x in range(s):
                r, g, b, al = p[x, y]
                p[x, y] = (r, g, b, 255) if al > 110 else (0, 0, 0, 0)
        out.append(sm)
    return out


bgs = {k: bg(k) for k in BGS}
ports = {k: portrait(k) for k in PORTRAIT_IDS}
open('js/art_data.js', 'w').write('// 由 tools/stage_art.py 產生，勿手改\nwindow.BG_ART = ' + json.dumps({k: url(v) for k, v in bgs.items()}) +
                                  ';\nwindow.PORTRAITS = ' + json.dumps({k: url(v[0]) for k, v in ports.items()}) +
                                  ';\nwindow.PORTRAITS_BIG = ' + json.dumps({k: url(v[1]) for k, v in ports.items()}) + ';\n')
print('ok', len(bgs), 'bgs', len(ports), 'portraits')
if len(sys.argv) > 1:
    out = Image.new('RGB', (W * 4, H * 2 + 100), (40, 40, 50))
    for i, k in enumerate(BGS): out.paste(bgs[k], ((i % 4) * W, (i // 4) * H))
    for i, k in enumerate(PORTRAIT_IDS): out.paste(ports[k][1], (i * 100, H * 2), ports[k][1])
    out.save(sys.argv[1])
