#!/usr/bin/env python3
"""Prepare material card images for the homepage 'Choose your material' section.

Sources (downloaded from the stone supplier's public site (kept anonymous) into /home/ubuntu/slab-assets/):
  - granite:   granite-hero.jpg       (dramatic gray viscount granite kitchen)
  - quartz:    quartz-mythology.webp  (black-marquina-look quartz waterfall island + backsplash)
  - quartzite: quartzite-about.jpg    (warm taj-mahal-look quartzite kitchen)

Output: public/images/materials/mat-{granite,quartz,quartzite}.webp
Target: 900x520 (16:9.25-ish card crop), quality 82, EXIF stripped.
"""
from PIL import Image
import os

SRC = "/home/ubuntu/slab-assets"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "images", "materials")
os.makedirs(OUT, exist_ok=True)

TW, TH = 900, 520

JOBS = [
    ("granite-hero.jpg", "mat-granite.webp", 0.55),   # bias crop slightly lower to feature the island
    ("quartz-mythology.webp", "mat-quartz.webp", 0.60),
    ("quartzite-about.jpg", "mat-quartzite.webp", 0.55),
]

for src, dst, vbias in JOBS:
    im = Image.open(os.path.join(SRC, src)).convert("RGB")
    # cover-crop to target aspect
    ta = TW / TH
    sa = im.width / im.height
    if sa > ta:  # too wide -> crop width, center
        nw = int(im.height * ta)
        x0 = (im.width - nw) // 2
        box = (x0, 0, x0 + nw, im.height)
    else:  # too tall -> crop height with vertical bias
        nh = int(im.width / ta)
        y0 = int((im.height - nh) * vbias)
        box = (0, y0, im.width, y0 + nh)
    im = im.crop(box).resize((TW, TH), Image.LANCZOS)
    path = os.path.join(OUT, dst)
    im.save(path, "WEBP", quality=82, method=6)
    print(f"{dst}: {os.path.getsize(path)//1024} KB")
