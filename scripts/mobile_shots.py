#!/usr/bin/env python3
"""Capture mobile-viewport (390x844) full-page screenshots of SGQ pages,
then slice each full-page shot into viewport-height chunks for review."""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/ubuntu/mobile-audit/before"
os.makedirs(OUT, exist_ok=True)

PAGES = [
    ("/", "home"),
    ("/cabinets", "cabinets"),
    ("/blog", "blog"),
    ("/admin/login", "admin-login"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        user_agent=("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"),
    )
    page = ctx.new_page()
    for path, name in PAGES:
        page.goto(BASE + path + "?v=99", wait_until="networkidle")
        page.wait_for_timeout(1200)
        # scroll through the whole page to trigger lazy loads / reveal animations
        height = page.evaluate("document.body.scrollHeight")
        y = 0
        while y < height:
            page.evaluate(f"window.scrollTo(0, {y})")
            page.wait_for_timeout(250)
            y += 700
            height = page.evaluate("document.body.scrollHeight")
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(600)
        fp = os.path.join(OUT, f"{name}-full.png")
        page.screenshot(path=fp, full_page=True)
        # detect horizontal overflow
        overflow = page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth")
        # find offending elements if overflow
        offenders = []
        if overflow > 0:
            offenders = page.evaluate("""
                () => {
                  const cw = document.documentElement.clientWidth;
                  const out = [];
                  document.querySelectorAll('*').forEach(el => {
                    const r = el.getBoundingClientRect();
                    if (r.right > cw + 1 || r.left < -1) {
                      out.push(el.tagName + '.' + (el.className && el.className.toString ? el.className.toString().split(' ').slice(0,2).join('.') : '') + ' w=' + Math.round(r.width) + ' right=' + Math.round(r.right));
                    }
                  });
                  return out.slice(0, 15);
                }
            """)
        print(f"{name}: height={height}px overflow={overflow}px -> {fp}")
        for o in offenders:
            print(f"   OVERFLOW: {o}")
    browser.close()

# slice full-page shots into 844*2-px-tall chunks (device_scale_factor=2)
from PIL import Image
CHUNK = 844 * 2
for f in sorted(os.listdir(OUT)):
    if not f.endswith("-full.png"):
        continue
    img = Image.open(os.path.join(OUT, f))
    w, h = img.size
    n = (h + CHUNK - 1) // CHUNK
    base = f.replace("-full.png", "")
    for i in range(n):
        crop = img.crop((0, i * CHUNK, w, min((i + 1) * CHUNK, h)))
        crop.save(os.path.join(OUT, f"{base}-part{i+1:02d}.png"))
    print(f"sliced {f} ({w}x{h}) into {n} parts")
