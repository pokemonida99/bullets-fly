# 背景、標題圖、結局圖、頭像：GPT 原圖 → 遊戲尺寸，輸出 js/art_data.js
# 頭像取自角色設定圖（work/art/ref_<id>.png）左半邊的半身像，去白底
# 用法：python3 tools/stage_art.py [預覽圖輸出路徑]
import sys, io, base64, json
from PIL import Image, ImageDraw

W, H = 384, 216
BGS = ['bg1', 'bg2', 'bg3', 'bg4', 'bg5', 'title', 'ending', 'r_far']
PANELS = ['p_mozart', 'p_skills', 'p_cloud', 'p_photo', 'p_rally', 'p_cable', 'p_fakemazi', 'p_tangdie', 'p_burn', 'p_return', 'p_gate', 'p_crowd', 'p_charge2', 'p_smoke', 'p_explode', 'p_bikes', 'h_ryuyou', 'h_kangcheng', 'h_whiteman', 'p_grave', 'p_cards', 'p_invite', 'p_banquet', 'p_toast', 'p_plot', 'p_raid', 'p_unmask', 'p_mourn', 'p_kidnap', 'p_silver', 'p_huajie', 'p_situng', 'p_fanyi', 'p_ridge', 'p_hotpot', 'p_scope', 'p_split', 'p_axes', 'p_flip', 'p_clock', 'p_caravan', 'p_gate', 'p_drum', 'p_liangfen', 'p_wu', 'p_gongping', 'p_stand', 'p_charge']
import os
PORTRAIT_IDS = ['jiamazi', 'dage', 'erge', 'sange', 'siger', 'wuge', 'qidi', 'liuzi', 'tang', 'huwan', 'wu', 'guard', 'mask', 'soldier', 'huang', 'huajie', 'wife']


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
    cols = [sum(1 for y in range(0, im.height, 3) if ap[x, y]) > 6 for x in range(im.width)]
    runs, st = [], None   # 找左半邊最寬的一段（半身像），忽略零星碎點
    for x, c in enumerate(cols + [False]):
        if c and st is None: st = x
        if not c and st is not None: runs.append((st, x)); st = None
    left = [r for r in runs if r[0] < im.width * 0.55 and r[1] - r[0] > 40] or runs
    x0, x1 = left[0]
    if x1 - x0 > im.width * 0.6:   # 半身像跟全身像黏在一起：在中段找最空的一欄切開
        dens = [sum(1 for y in range(0, im.height, 3) if ap[x, y]) for x in range(x0, x1)]
        lo, hi = int(len(dens) * 0.35), int(len(dens) * 0.8)
        x1 = x0 + lo + min(range(hi - lo), key=lambda i: dens[lo + i])
    rgba = im.convert('RGBA'); rgba.putalpha(a)
    bust = rgba.crop((x0, 0, x1, im.height)); bust = bust.crop(bust.getbbox())
    side = max(bust.width, bust.height)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(bust, ((side - bust.width) // 2, side - bust.height))
    # 去掉跟半身像分開的小碎點
    import importlib.util
    spec = importlib.util.spec_from_file_location('sl', 'tools/slice_clean.py'); sl = importlib.util.module_from_spec(spec); spec.loader.exec_module(sl)
    out = []
    for s in sizes:
        sm = sq.resize((s, s), Image.LANCZOS); p = sm.load()
        for y in range(s):
            for x in range(s):
                r, g, b, al = p[x, y]
                p[x, y] = (r, g, b, 255) if al > 110 else (0, 0, 0, 0)
        c = sl.clean(sm, 1); full = Image.new('RGBA', (s, s), (0, 0, 0, 0)); bb = sm.getchannel('A').getbbox() and sl.bbox_of(sm, c)
        full.paste(c, bb[:2] if bb else (0, 0)); out.append(full)
    return out


def panel(key):   # 劇情插圖：置中裁成 16:9
    im = Image.open(f'work/art/{key}.png').convert('RGB')
    tw = im.width; th = round(tw * H / W)
    if th > im.height: th = im.height; tw = round(th * W / H)
    x0 = (im.width - tw) // 2; y0 = (im.height - th) // 2
    im = im.crop((x0, y0, x0 + tw, y0 + th)).resize((W, H), Image.LANCZOS)
    return im.quantize(colors=200, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')


def demag(im):
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if r > 150 and b > 150 and g < 110: px[x, y] = (0, 0, 0, 0)
    return im


def hard(sm):
    p = sm.load()
    for y in range(sm.height):
        for x in range(sm.width):
            r, g, b, a = p[x, y]
            p[x, y] = (0, 0, 0, 0) if a < 140 or (r > 150 and b > 150 and g < 110) else (r, g, b, 255)
    return sm


meta = {}
def near():   # 序章近景：鐵軌路堤＋馬跑的路（上方洋紅透明）
    im = demag(Image.open('work/art/r_near.png'))
    sm = hard(im.resize((W, round(im.height * W / im.width)), Image.LANCZOS))
    if sm.height < H:
        out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); out.paste(sm, (0, H - sm.height)); sm = out
    else: sm = sm.crop((0, sm.height - H, W, sm.height))
    a = sm.getchannel('A').load()
    top = next(y for y in range(H) if sum(1 for x in range(W) if a[x, y]) > W * 0.6)
    meta['railY'] = top + 6
    return sm


def train():
    im = demag(Image.open('work/art/r_train.png')); im = im.crop(im.getbbox())
    h = 84; sm = hard(im.resize((round(im.width * h / im.height), h), Image.LANCZOS))
    meta['trainH'] = sm.height
    # 找車窗：窗框中段那一列的暗色區段（黑色窗內）
    px = sm.load(); best = None
    for fy in [i / 100 for i in range(35, 62)]:
        y = round(sm.height * fy); runs = []; st = None
        for x in range(sm.width):
            r, g, b, a = px[x, y]; dark = a and r + g + b < 120
            if dark and st is None: st = x
            if not dark and st is not None:
                if 3 <= x - st <= 22: runs.append((st + x) / 2)
                st = None
        if best is None or abs(len(runs) - 16) < abs(len(best[1]) - 16): best = (fy, runs)
    meta['windows'] = [[round(x, 1), round(best[0], 2)] for x in best[1]]
    return sm


FACADE_H = {'w_trees1': 132, 'w_trees2': 124, 'w_rocks': 92, 'w_bamboo': 138, 'd_tower1': 150, 'd_tower2': 144, 'd_bamboo': 132, 'd_irongate': 120, 'g_hall': 128, 'g_corridor': 96, 'g_rooms': 124, 'g_moon': 92, 'g_gate': 120, 'f_gate': 138, 'f_shop1': 118, 'f_yamen': 108, 'f_shop2': 132, 'f_noodle': 100, 'f_shop3': 124, 'f_wall': 84, 'f_huang': 140}


def facade(key):   # 建築立面：去洋紅底、裁到建築本身、縮到指定高度
    im = demag(Image.open(f'work/art/{key}.png')); im = im.crop(im.getbbox())
    h = FACADE_H[key]; sm = hard(im.resize((round(im.width * h / im.height), h), Image.LANCZOS))
    return sm.crop(sm.getbbox())


def sky(key):
    im = Image.open(f'work/art/{key}.png').convert('RGB')
    return im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS).quantize(colors=128, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')


def ground(key='ground'):
    im = Image.open(f'work/art/{key}.png').convert('RGB')
    sm = im.resize((1300, round(im.height * 1300 / im.width)), Image.LANCZOS)
    return sm.crop((0, 0, 1300, 80)).quantize(colors=96, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')


bgs = {k: bg(k) for k in BGS if os.path.exists(f'work/art/{k}.png')}
bgs.update({k: facade(k) for k in FACADE_H if os.path.exists(f'work/art/{k}.png')})
bgs.update({k: sky(k) for k in ('sky_day', 'sky_dusk', 'sky_night') if os.path.exists(f'work/art/{k}.png')})
if os.path.exists('work/art/ground.png'): bgs['ground'] = ground()
if os.path.exists('work/art/ground_dirt.png'): bgs['ground_dirt'] = ground('ground_dirt')
if os.path.exists('work/art/ironwall.png'): bgs['ironwall'] = Image.open('work/art/ironwall.png').convert('RGB').resize((W, H), Image.LANCZOS).quantize(colors=96, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')
bgs.update({k: panel(k) for k in PANELS if os.path.exists(f'work/art/{k}.png')})
if os.path.exists('work/art/r_near.png'): bgs['r_near'] = near()
if os.path.exists('work/art/r_train.png'): bgs['r_train'] = train()
ports = {k: portrait(k) for k in PORTRAIT_IDS if os.path.exists(f'work/art/ref_{k}.png')}
open('js/art_data.js', 'w').write('// 由 tools/stage_art.py 產生，勿手改\nwindow.BG_ART = ' + json.dumps({k: url(v) for k, v in bgs.items()}) +
                                  ';\nwindow.PORTRAITS = ' + json.dumps({k: url(v[0]) for k, v in ports.items()}) +
                                  ';\nwindow.PORTRAITS_BIG = ' + json.dumps({k: url(v[1]) for k, v in ports.items()}) +
                                  ';\nwindow.RIDE_META = ' + json.dumps(meta) + ';\n')
print('ride meta', meta)
print('ok', len(bgs), 'bgs', len(ports), 'portraits')
if len(sys.argv) > 1:
    ks = list(bgs); rows = (len(ks) + 3) // 4
    out = Image.new('RGB', (W * 4, H * rows + 100), (40, 40, 50))
    for i, k in enumerate(ks): out.paste(bgs[k].convert('RGB'), ((i % 4) * W, (i // 4) * H))
    for i, k in enumerate(ports): out.paste(ports[k][1], (i * 100, H * rows), ports[k][1])
    out.save(sys.argv[1])
