"""Check ERS's fresh-avocado import value against its FATUS calendar table."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
with (ROOT / "data" / "raw" / "fatus_calendar.csv").open(encoding="utf-8-sig") as file:
    candidates = [r for r in csv.DictReader(file) if r["Year"] == "2024" and r["Trade type"] == "Import"
                  and r["FATUS commodity group "] == "Avocados" and r["Geographical unit"] == "World total"
                  and r["Measure"] == "Value"]
assert len(candidates) == 1
fatus_usd = float(candidates[0]["Value"])
snapshot = json.loads((ROOT / "dist" / "data.json").read_text(encoding="utf-8"))
ers_usd = sum(r["valueUsd"] for r in snapshot["usImports"] if r["country"] == "World" and r["year"] == 2024)
assert abs(fatus_usd - ers_usd) < 1
print(f"FATUS and ERS 2024 avocado import value agree: ${fatus_usd:,.0f}")
