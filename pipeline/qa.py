"""Smoke-check the rendered Atlas and save desktop/mobile screenshots."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qa"
OUT.mkdir(exist_ok=True)
URL = os.environ.get("ATLAS_QA_URL", "http://localhost:8765/")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width, height, name in [(1440, 900, "desktop"), (1280, 800, "laptop"), (1024, 768, "tablet"), (390, 844, "mobile")]:
        page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(URL, wait_until="networkidle")
        page.locator("#share-inline").wait_for(state="visible")
        assert page.locator("#share-inline").inner_text() == "83.4%"
        assert page.locator("#command-winter").inner_text() == "95.2%"
        assert page.locator("#lane-peru").inner_text() == "101k t"
        assert page.locator("#lane-colombia-window").inner_text() == "May–Jul"
        assert page.locator("#asp-chart .asp-year").count() == 3
        assert page.locator("#case-concentration .figure-bar").count() == 9
        assert page.locator("#case-import-value .figure-bar").count() == 9
        assert page.locator("#case-origin-mix .figure-stack").count() == 12
        page.locator("#figure-year").select_option("2024")
        assert "2024" in page.locator("#case-origin-mix").get_attribute("aria-label")
        page.locator("#figure-year").select_option("2025")
        assert page.locator("#case-gap").inner_text() == "10,669 t"
        # At 250 words/minute, 750 visible words is a three-minute read.
        assert len(page.locator("main").inner_text().split()) <= 750
        assert page.locator("#appendix").get_attribute("open") is None
        assert page.locator(".evidence-notes").get_attribute("open") is None
        assert "NOT A STORE SHORTAGE FORECAST" in page.locator(".result-caveat").inner_text()
        assert page.locator("#trade-sankey .sankey-flow").count() >= 12
        assert page.locator("#lane-pool .pool-row").count() == 3
        page.locator('#trade-sankey .sankey-flow[data-origin="Peru"][data-partner="Netherlands"]').click()
        assert "184,442 t" in page.locator("#sankey-readout").inner_text()
        assert page.locator(".supplier-questions li").count() == 6
        assert page.locator("#case-sensitivity .heat-cell").count() == 25
        page.locator('#case-sensitivity .heat-cell[data-flex="20"][data-buffer="5"]').click()
        assert page.locator("#case-flex").input_value() == "20"
        assert page.locator("#case-buffer").input_value() == "5"
        page.locator('.preset[data-preset="inspection"]').click()
        page.locator('.preset[data-preset="crop"]').click()
        assert page.locator("#case-gap").inner_text() == "25,556 t"
        page.locator('.preset[data-preset="summer"]').click()
        assert page.locator("#case-gap").inner_text() == "22,042 t"
        page.locator('.preset[data-preset="inspection"]').click()
        page.screenshot(path=str(OUT / f"{name}.png"), full_page=True)
        page.locator("#appendix > summary").click()
        assert page.locator("#global-lanes .global-list-row").count() == 6
        assert page.locator("#global-destinations .global-list-row").count() == 6
        assert page.locator("#world-trend .world-year").count() == 10
        assert page.locator("#availability-share").inner_text() == "88.4%"
        assert page.locator("#latest-mexico-share").inner_text() == "83.4%"
        assert page.locator("#ceiling-gap").inner_text() == "316k"
        assert page.locator("#retail-ad-price").inner_text() == "$0.88 / each"
        assert page.locator("#retail-scanner-price").inner_text() == "$2.26 / lb"
        assert "7,225 ads" in page.locator("#retail-ad-date").inner_text()
        assert page.locator("#brief-mx-2025").text_content() == "83.4%"
        assert page.locator(".origin-profile").count() == 4
        assert "101k" in page.locator(".origin-profile").first.inner_text()
        assert page.locator(".risk-register article").count() == 4
        assert "95.2%" in page.locator("#calendar-read").inner_text()
        page.locator("#global-lanes button").nth(1).click()
        assert page.locator("#country-select").input_value() == "Peru"
        page.locator("#country-select").select_option("Peru")
        assert page.locator("#detail-country").inner_text() == "Peru"
        assert "Jun–Aug" in page.locator("#detail-window").inner_text()
        assert page.locator("#detail-trend span").count() >= 9
        page.locator("#country-select").select_option("Mexico")
        assert page.locator(".format-row").count() == 4
        assert "28.4%" in page.locator(".format-row").last.inner_text()
        page.locator("#season-year").select_option("2017")
        assert page.locator("#season-year").input_value() == "2017"
        page.locator("#season-year").select_option("2025")
        assert page.locator("#season-year").input_value() == "2025"
        assert page.locator("#detail-destinations").inner_text().startswith("Top reported export destinations")
        page.locator("#story-next").click()
        assert page.locator("#story-count").inner_text() == "02 / 04"
        page.locator("#shock-toggle").click()
        assert page.locator("#result-state").inner_text() == "MEXICO → 0%"
        baseline_gap = page.locator("#gap-value").inner_text()
        page.locator("#diversion").fill("50")
        assert page.locator("#gap-value").inner_text() != baseline_gap
        page.locator("#diversion").fill("100")
        assert page.locator("#gap-value").inner_text() == "316k"
        assert not errors, errors
        assert not page.evaluate("document.documentElement.scrollWidth > innerWidth")
        page.goto(URL + "#sources", wait_until="networkidle")
        assert page.locator("#appendix").get_attribute("open") is not None
        print(name, "shock gap", baseline_gap, "at 50%", page.locator("#gap-value").inner_text(), "no console error / overflow")
        page.close()
    browser.close()
