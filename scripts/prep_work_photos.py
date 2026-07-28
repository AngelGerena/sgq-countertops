#!/usr/bin/env python3
"""Convert Cesar's real job photos into optimized webp tiles for the Work section."""
from PIL import Image, ImageOps
import os

SRC = '/home/ubuntu/upload'
OUT = '/home/ubuntu/sgq-source/public/images/work'
os.makedirs(OUT, exist_ok=True)

# (source file, output slug, max width)
JOBS = [
    # feature-size tiles (span 2 cols) get more width
    ('492070633_703803605535085_9118106433703831658_n.jpg',  'job-black-quartz-island',   1400),
    ('491368597_703804198868359_8485597396046117971_n.jpg',  'job-black-quartz-run',      1100),
    ('465061081_17895106509092709_3740108675606511514_n.jpg','job-white-shaker-peninsula',1100),
    ('465091382_17895106527092709_5277702822917064727_n.jpg','job-white-shaker-range',    1100),
    ('465168015_17895106518092709_4627544403175422887_n.jpg','job-shaker-pantry',         1100),
    ('498154009_17853405873443723_5802641190842755458_n.jpg','job-calacatta-island',      1100),
    ('497910764_17853405885443723_7846533076717389696_n.jpg','job-calacatta-vanity',      1100),
    ('497883858_17853405876443723_2640877322019461548_n.jpg','job-calacatta-niche',       1100),
    ('491219835_9805167489552300_586286487565882466_n.jpg',  'job-coastal-island',        1400),
    ('490697219_9805167486218967_3331436880215253083_n.jpg', 'job-white-island-espresso', 1400),
]

for fname, slug, maxw in JOBS:
    src = os.path.join(SRC, fname)
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    out = os.path.join(OUT, f'{slug}.webp')
    im.save(out, 'WEBP', quality=82, method=6)
    kb = os.path.getsize(out) // 1024
    print(f'{slug}.webp  {im.width}x{im.height}  {kb} KB')
