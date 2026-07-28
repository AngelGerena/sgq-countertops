#!/usr/bin/env python3
"""Viewport (non-fullpage) mobile screenshots of key admin pages + menu open/close test."""
import json
import re
import os
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
OUT = "/home/ubuntu/mobile-audit/admin-after"
os.makedirs(OUT, exist_ok=True)

NOW = "2026-07-27T12:00:00.000Z"
USER_ID = "11111111-1111-1111-1111-111111111111"
USER = {"id": USER_ID, "aud": "authenticated", "role": "authenticated",
        "email": "cesar@example.com", "email_confirmed_at": NOW,
        "app_metadata": {}, "user_metadata": {}, "created_at": NOW, "updated_at": NOW}
SESSION = {"access_token": "mock", "token_type": "bearer", "expires_in": 3600,
           "expires_at": int(time.time()) + 3600, "refresh_token": "mock", "user": USER}
ADMIN_ROW = {"id": 1, "user_id": USER_ID, "email": "cesar@example.com",
             "full_name": "Cesar", "role": "owner", "is_super_admin": True}

LEADS = [
    {"id": i, "created_at": NOW, "name": n, "phone": "386-555-01%02d" % i,
     "email": f"lead{i}@example.com", "city": c, "project_type": pt,
     "material": m, "status": s, "notes": "", "source": "website",
     "message": "Looking for new countertops."}
    for i, (n, c, pt, m, s) in enumerate([
        ("Maria Gonzalez", "Deltona", "Kitchen countertops", "Quartz", "new"),
        ("James Carter", "Sanford", "Full kitchen", "Granite", "contacted"),
        ("Ana Rivera", "Orlando", "Bathroom vanity", "Quartzite", "quoted"),
    ], start=1)
]


def handle_route(route):
    url = route.request.url
    if "/auth/v1/user" in url:
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(USER))
    if "/auth/v1/" in url:
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(SESSION))
    m = re.search(r"/rest/v1/([a-zA-Z_]+)", url)
    if m:
        t = m.group(1)
        data = [ADMIN_ROW] if t == "admin_users" else (LEADS if t in ("leads", "quote_requests") else [])
        accept = route.request.headers.get("accept", "")
        body = json.dumps(data[0] if data else {}) if "object" in accept else json.dumps(data)
        hdrs = {"content-range": f"0-{max(len(data)-1,0)}/{len(data)}"}
        return route.fulfill(status=200, content_type="application/json", headers=hdrs, body=body)
    return route.continue_()


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2,
                        is_mobile=True, has_touch=True)
    ctx.route(re.compile(r".*supabase\.co.*"), handle_route)
    pg = ctx.new_page()
    pg.goto(BASE + "/?v=203", wait_until="domcontentloaded")
    pg.evaluate("([k,v]) => localStorage.setItem(k,v)",
                ["sb-llpcthsgihfdkqtuurge-auth-token", json.dumps(SESSION)])

    # dashboard collapsed (viewport only — avoids sticky artifact)
    pg.goto(BASE + "/admin?v=203", wait_until="networkidle")
    pg.wait_for_timeout(1000)
    pg.screenshot(path=f"{OUT}/vp-dashboard-collapsed.png")
    print("dashboard collapsed: main_top =", pg.evaluate(
        "document.querySelector('.main').getBoundingClientRect().top"))

    # open the menu
    pg.click(".side-toggle")
    pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/vp-menu-open.png")
    links = pg.evaluate("[...document.querySelectorAll('.side.open .side-link')].map(a=>a.textContent)")
    print("menu open links:", links)

    # click a link -> menu should auto-close, navigate to Requests
    pg.click("#nav-leads")
    pg.wait_for_timeout(900)
    is_open = pg.evaluate("document.querySelector('.side').classList.contains('open')")
    print("after nav click, url =", pg.url, "menu open? ", is_open)
    pg.screenshot(path=f"{OUT}/vp-leads-after-navclick.png")

    b.close()
print("done")
