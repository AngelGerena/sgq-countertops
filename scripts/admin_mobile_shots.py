#!/usr/bin/env python3
"""Capture mobile (390x844) full-page screenshots of admin portal pages.

Since the sandbox .env has placeholder Supabase keys, real auth cannot work.
Instead we intercept Supabase network calls and return mock responses so
ProtectedRoute sees a valid session + admin_users row, and pages render with
sample data. This is for LAYOUT auditing only.
"""
import json
import os
import re
import sys
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/ubuntu/mobile-audit/admin-before"
os.makedirs(OUT, exist_ok=True)

NOW = "2026-07-27T12:00:00.000Z"
USER_ID = "11111111-1111-1111-1111-111111111111"

USER = {
    "id": USER_ID, "aud": "authenticated", "role": "authenticated",
    "email": "cesar@example.com", "email_confirmed_at": NOW,
    "phone": "", "confirmed_at": NOW, "last_sign_in_at": NOW,
    "app_metadata": {"provider": "email", "providers": ["email"]},
    "user_metadata": {}, "identities": [], "created_at": NOW, "updated_at": NOW,
}
SESSION = {
    "access_token": "mock-access-token", "token_type": "bearer",
    "expires_in": 3600, "expires_at": int(time.time()) + 3600,
    "refresh_token": "mock-refresh-token", "user": USER,
}

ADMIN_ROW = {"id": 1, "user_id": USER_ID, "email": "cesar@example.com",
             "full_name": "Cesar", "role": "owner", "is_super_admin": True}

LEADS = [
    {"id": i, "created_at": NOW, "name": n, "phone": "386-555-01%02d" % i,
     "email": f"lead{i}@example.com", "city": c, "project_type": pt,
     "material": m, "status": s, "notes": "Wants estimate soon", "source": "website",
     "message": "Looking for new countertops for our kitchen remodel."}
    for i, (n, c, pt, m, s) in enumerate([
        ("Maria Gonzalez", "Deltona", "Kitchen countertops", "Quartz", "new"),
        ("James Carter", "Sanford", "Full kitchen", "Granite", "contacted"),
        ("Ana Rivera", "Orlando", "Bathroom vanity", "Quartzite", "quoted"),
        ("Tom Becker", "DeLand", "Cabinets + counters", "Quartz", "won"),
    ], start=1)
]

CATALOG = [
    {"id": i, "created_at": NOW, "name": n, "category": cat, "material": mat,
     "price_per_sqft": p, "price_unit": unit, "supplier": "Supplier", "color_family": cf,
     "is_active": True, "image_url": None, "description": d, "sort_order": i}
    for i, (n, cat, mat, p, unit, cf, d) in enumerate([
        ("Calacatta Gold", "countertop", "quartz", 68, "sqft", "white", "Bold veined quartz"),
        ("Steel Grey", "countertop", "granite", 52, "sqft", "grey", "Dense workhorse granite"),
        ("Taj Mahal", "countertop", "quartzite", 95, "sqft", "cream", "Soft warm quartzite"),
        ("Shaker White", "cabinet", "wood", 210, "lnft", "white", "Classic shaker line"),
        ("Frameless Gloss", "cabinet", "wood", 260, "lnft", "white", "Euro frameless line"),
    ], start=1)
]

QUOTES = [
    {"id": i, "created_at": NOW, "quote_number": f"Q-20260{i}", "customer_name": n,
     "customer_phone": "386-555-0199", "customer_email": "q@example.com",
     "status": s, "total": t, "valid_until": NOW, "line_items": [],
     "notes": "", "customer_id": i, "lead_id": i}
    for i, (n, s, t) in enumerate([
        ("Maria Gonzalez", "draft", 4850), ("James Carter", "sent", 12400),
        ("Ana Rivera", "accepted", 2300),
    ], start=1)
]

JOBS = [
    {"id": i, "created_at": NOW, "title": t, "customer_name": n, "status": s,
     "scheduled_date": "2026-08-0%d" % i, "address": "123 Palm Ave, Deltona FL",
     "notes": "", "quote_id": i, "customer_id": i}
    for i, (t, n, s) in enumerate([
        ("Kitchen install — quartz", "Maria Gonzalez", "scheduled"),
        ("Template visit", "James Carter", "in_progress"),
        ("Vanity install", "Ana Rivera", "done"),
    ], start=1)
]

CUSTOMERS = [
    {"id": i, "created_at": NOW, "name": n, "phone": "386-555-0142",
     "email": f"c{i}@example.com", "address": "123 Palm Ave, Deltona FL", "notes": ""}
    for i, n in enumerate(["Maria Gonzalez", "James Carter", "Ana Rivera"], start=1)
]

POSTS = [
    {"id": i, "created_at": NOW, "updated_at": NOW, "title_en": t, "title_es": t,
     "slug": f"post-{i}", "status": st, "body_en": "Body...", "body_es": "Cuerpo...",
     "excerpt_en": "Excerpt", "excerpt_es": "Extracto", "cover_url": None,
     "published_at": NOW if st == "published" else None}
    for i, (t, st) in enumerate([
        ("Choosing quartz vs granite", "published"),
        ("Kitchen island sizing guide", "draft"),
    ], start=1)
]

SITE_CONTENT = [
    {"id": 1, "key": "hero.title", "value_en": "Measured twice. Installed once.",
     "value_es": "Medido dos veces. Instalado una vez.", "updated_at": NOW},
]

SETTINGS = [{"id": 1, "key": "business_phone", "value": "386-444-5290"}]

TABLE_DATA = {
    "admin_users": [ADMIN_ROW],
    "leads": LEADS,
    "quotes": QUOTES,
    "jobs": JOBS,
    "customers": CUSTOMERS,
    "catalog_items": CATALOG,
    "catalog": CATALOG,
    "products": CATALOG,
    "blog_posts": POSTS,
    "posts": POSTS,
    "site_content": SITE_CONTENT,
    "settings": SETTINGS,
    "site_settings": SETTINGS,
    "quote_requests": LEADS,
}

PAGES = [
    ("/admin", "dashboard"),
    ("/admin/assistant", "assistant"),
    ("/admin/leads", "leads"),
    ("/admin/quotes", "quotes"),
    ("/admin/quotes/new", "quote-builder"),
    ("/admin/jobs", "jobs"),
    ("/admin/customers", "customers"),
    ("/admin/catalog", "catalog"),
    ("/admin/blog", "blog"),
    ("/admin/blog/new", "blog-editor"),
    ("/admin/site", "site-editor"),
    ("/admin/settings", "settings"),
]


def handle_route(route):
    url = route.request.url
    method = route.request.method
    # auth endpoints
    if "/auth/v1/token" in url:
        return route.fulfill(status=200, content_type="application/json",
                             body=json.dumps(SESSION))
    if "/auth/v1/user" in url:
        return route.fulfill(status=200, content_type="application/json",
                             body=json.dumps(USER))
    if "/auth/v1/logout" in url:
        return route.fulfill(status=204, body="")
    if "/auth/v1/" in url:
        return route.fulfill(status=200, content_type="application/json", body="{}")
    # rest endpoints
    m = re.search(r"/rest/v1/([a-zA-Z_]+)", url)
    if m:
        table = m.group(1)
        if table == "rpc":
            return route.fulfill(status=200, content_type="application/json", body="[]")
        data = TABLE_DATA.get(table, [])
        # single-object requests (Accept: application/vnd.pgrst.object+json)
        accept = route.request.headers.get("accept", "")
        if "object" in accept:
            body = json.dumps(data[0] if data else {})
        else:
            body = json.dumps(data)
        if method in ("POST", "PATCH"):
            body = json.dumps(data[0] if data else {})
        headers = {"content-range": f"0-{max(len(data)-1,0)}/{len(data)}"}
        return route.fulfill(status=200, content_type="application/json",
                             headers=headers, body=body)
    if "/storage/v1/" in url:
        return route.fulfill(status=200, content_type="application/json", body="[]")
    return route.continue_()


with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              device_scale_factor=2, is_mobile=True, has_touch=True)
    ctx.route(re.compile(r".*supabase\.co.*"), handle_route)
    page = ctx.new_page()

    # seed the auth token in localStorage the way supabase-js stores it
    page.goto(BASE + "/?v=201", wait_until="domcontentloaded")
    ref = "llpcthsgihfdkqtuurge"
    page.evaluate(
        "([key, val]) => localStorage.setItem(key, val)",
        [f"sb-{ref}-auth-token", json.dumps(SESSION)],
    )

    for path, name in PAGES:
        page.goto(BASE + path + "?v=201", wait_until="networkidle")
        page.wait_for_timeout(1200)
        cur = page.url
        if "/admin/login" in cur and name != "login":
            print(f"{name}: REDIRECTED TO LOGIN ({cur}) — auth mock failed")
            page.screenshot(path=os.path.join(OUT, f"{name}-full.png"), full_page=True)
            continue
        height = page.evaluate("document.body.scrollHeight")
        overflow = page.evaluate(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth")
        offenders = []
        if overflow > 0:
            offenders = page.evaluate("""
                () => {
                  const cw = document.documentElement.clientWidth;
                  const out = [];
                  document.querySelectorAll('*').forEach(el => {
                    const r = el.getBoundingClientRect();
                    if (r.width > cw + 1) {
                      const cls = (el.className && el.className.toString) ? el.className.toString().split(' ').slice(0,2).join('.') : '';
                      out.push(el.tagName + '.' + cls + ' w=' + Math.round(r.width));
                    }
                  });
                  return out.slice(0, 12);
                }
            """)
        page.screenshot(path=os.path.join(OUT, f"{name}-full.png"), full_page=True)
        print(f"{name}: height={height} overflow={overflow} url={cur}")
        for o in offenders:
            print(f"   OVERFLOW: {o}")
    browser.close()

# slice tall shots
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
        img.crop((0, i * CHUNK, w, min((i + 1) * CHUNK, h))).save(
            os.path.join(OUT, f"{base}-part{i+1:02d}.png"))
print("sliced all")
