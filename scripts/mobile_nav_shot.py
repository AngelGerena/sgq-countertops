#!/usr/bin/env python3
"""Open the mobile hamburger nav and screenshot it."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={"width": 390, "height": 844},
                              device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.goto("http://localhost:4173/?v=100", wait_until="networkidle")
    page.wait_for_timeout(1000)
    burger = page.locator(".burger")
    print("burger visible:", burger.is_visible())
    burger.click()
    page.wait_for_timeout(600)
    page.screenshot(path="/home/ubuntu/mobile-audit/after/nav-open.png")
    links = page.locator(".nav a").all_inner_texts()
    print("nav links:", links)
    browser.close()
