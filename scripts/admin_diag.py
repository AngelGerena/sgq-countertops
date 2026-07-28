#!/usr/bin/env python3
"""Diagnose black gap under mobile admin topbar using the same mock as admin_mobile_shots."""
import json
import time
import re
import os
import sys

sys.argv = ["admin_mobile_shots.py", "/tmp/admin-diag-ignore"]

# Reuse the mock pieces by importing constants via exec of the top of the file is messy;
# simplest: copy handle_route setup by importing module with __name__ guard absent.
# Instead, re-implement minimal mock inline.
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173"
NOW = "2026-07-27T12:00:00.000Z"
USER_ID = "11111111-1111-1111-1111-111111111111"
USER = {"id": USER_ID, "aud": "authenticated", "role": "authenticated",
        "email": "cesar@example.com", "email_confirmed_at": NOW,
        "app_metadata": {}, "user_metadata": {}, "created_at": NOW, "updated_at": NOW}
SESSION = {"access_token": "mock", "token_type": "bearer", "expires_in": 3600,
           "expires_at": int(time.time()) + 3600, "refresh_token": "mock", "user": USER}
ADMIN_ROW = {"id": 1, "user_id": USER_ID, "email": "cesar@example.com",
             "full_name": "Cesar", "role": "owner", "is_super_admin": True}


def handle_route(route):
    url = route.request.url
    if "/auth/v1/user" in url:
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(USER))
    if "/auth/v1/" in url:
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(SESSION))
    m = re.search(r"/rest/v1/([a-zA-Z_]+)", url)
    if m:
        data = [ADMIN_ROW] if m.group(1) == "admin_users" else []
        accept = route.request.headers.get("accept", "")
        body = json.dumps(data[0] if data else {}) if "object" in accept else json.dumps(data)
        return route.fulfill(status=200, content_type="application/json", body=body)
    return route.continue_()


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True)
    ctx.route(re.compile(r".*supabase\.co.*"), handle_route)
    pg = ctx.new_page()
    pg.goto(BASE + "/?v=202", wait_until="domcontentloaded")
    pg.evaluate("([k,v]) => localStorage.setItem(k,v)",
                ["sb-llpcthsgihfdkqtuurge-auth-token", json.dumps(SESSION)])
    pg.goto(BASE + "/admin?v=202", wait_until="networkidle")
    pg.wait_for_timeout(1200)
    r = pg.evaluate("""() => {
      const out = {url: location.pathname};
      const side = document.querySelector('.side');
      const head = document.querySelector('.side-head');
      const main = document.querySelector('.main');
      if (side) { const cs = getComputedStyle(side);
        out.side = {rect_h: side.getBoundingClientRect().height, display: cs.display,
                    position: cs.position, cssHeight: cs.height, minHeight: cs.minHeight};
        out.sideChildren = [...side.children].map(c => ({cls: c.className,
          h: Math.round(c.getBoundingClientRect().height),
          disp: getComputedStyle(c).display}));
      }
      if (head) out.head_h = head.getBoundingClientRect().height;
      if (main) out.main_top = main.getBoundingClientRect().top;
      const shell = document.querySelector('.shell');
      if (shell) out.shell_rows = getComputedStyle(shell).gridTemplateRows;
      return out;
    }""")
    print(json.dumps(r, indent=1))
    b.close()
