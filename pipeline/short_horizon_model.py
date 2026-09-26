"""Build an illustrative short-horizon U.S. avocado sourcing tabletop.

Observed baseline: USDA ERS 2025 monthly fresh-avocado imports in processed CSV.
Scenario inputs are explicit assumptions, not supplier capacity or a price forecast.
"""

import csv
import json
from calendar import monthrange
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data/processed/us_imports_monthly.csv"
OUTPUT = ROOT / "dist/case_data.json"

PRESETS = [
    {"id": "inspection", "label": "One-week inspection pause", "month": 2, "weeks": 1, "mexicoAvailabilityPct": 0, "otherFlexPct": 10, "bufferDays": 3},
    {"id": "crop", "label": "Eight-week winter crop squeeze", "month": 2, "weeks": 8, "mexicoAvailabilityPct": 75, "otherFlexPct": 15, "bufferDays": 3},
    {"id": "summer", "label": "Two-week summer interruption", "month": 7, "weeks": 2, "mexicoAvailabilityPct": 0, "otherFlexPct": 20, "bufferDays": 3},
]


def calculate(baseline, scenario):
    days = monthrange(2025, scenario["month"])[1]
    weekly_world = baseline["worldTonnes"] * 7 / days
    weekly_mexico = baseline["mexicoTonnes"] * 7 / days
    weekly_other = weekly_world - weekly_mexico
    lost = weekly_mexico * scenario["weeks"] * (1 - scenario["mexicoAvailabilityPct"] / 100)
    flex = weekly_other * scenario["weeks"] * scenario["otherFlexPct"] / 100
    buffer = min(lost, weekly_mexico * scenario["bufferDays"] / 7)
    gap = max(0, lost - flex - buffer)
    return {
        "baselineWeeklyTonnes": round(weekly_world, 2),
        "lostMexicanTonnes": round(lost, 2),
        "assumedOtherFlexTonnes": round(flex, 2),
        "assumedBufferTonnes": round(buffer, 2),
        "uncoveredTonnes": round(gap, 2),
        "uncoveredSharePct": round(gap / (weekly_world * scenario["weeks"]) * 100, 2),
    }


def main():
    with INPUT.open(newline="", encoding="utf-8") as file:
        rows = list(csv.DictReader(file))
    baseline = {}
    for month in (2, 7):
        get = lambda country: next(float(r["tonnes"]) for r in rows if r["country"] == country and int(r["year"]) == 2025 and int(r["month"]) == month)
        world, mexico = get("World"), get("Mexico")
        assert world > mexico > 0
        baseline[str(month)] = {"worldTonnes": round(world, 2), "mexicoTonnes": round(mexico, 2), "otherTonnes": round(world - mexico, 2)}
    output = {
        "baselineYear": 2025,
        "baselineMeasure": "USDA ERS fresh avocado import tonnes by recorded origin and calendar month",
        "baselineSource": "https://www.ers.usda.gov/data-products/fruit-and-tree-nuts-data/trade-and-prices-by-category-and-commodity",
        "baseline": baseline,
        "presets": [{**preset, "result": calculate(baseline[str(preset["month"])], preset)} for preset in PRESETS],
        "retailAsp": [
            {"year": 2022, "usdPerFruit": 1.28},
            {"year": 2023, "usdPerFruit": 1.06},
            {"year": 2024, "usdPerFruit": 1.19},
        ],
        "retailAspMeasure": "Hass Avocado Board/Circana U.S. annual category average selling price, dollars per retail unit; not an advertised price or customs unit value",
        "retailAspSource": "https://hassavocadoboard.com/wp-content/uploads/Total-U.S.-2024-Q4.pdf",
    }
    OUTPUT.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT}")
    for preset in output["presets"]:
        print(preset["label"], preset["result"]["uncoveredTonnes"], "tonnes uncovered")


if __name__ == "__main__":
    main()
