"""Build the canonical, source-linked avocado snapshot for the static Atlas.

Run `python pipeline/download.py`, `python pipeline/extract.py`, then
`python pipeline/build.py` from the project root.
"""

import csv
from collections import defaultdict
from datetime import date
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGING = ROOT / "data" / "staging"
RAW = ROOT / "data" / "raw"
DIST = ROOT / "dist"
PROCESSED = ROOT / "data" / "processed"
POUNDS_TO_TONNES_PER_THOUSAND = 0.45359237
BASE_YEAR = 2024
LATEST_IMPORT_YEAR = 2025


def load_production():
    rows = []
    world = {}
    with (STAGING / "production_avocado.csv").open(encoding="utf-8") as file:
        for row in csv.DictReader(file):
            if row["Element Code"] != "5510" or row["Unit"] != "t" or not row["Value"]:
                continue
            year = int(row["Year"])
            if row["Area"] == "World":
                world[year] = round(float(row["Value"]), 2)
            # FAO code 351 is the "China" aggregate; mainland is a country
            # record (code 41). Country records in this source are <= 300.
            if int(row["Area Code"]) > 300:
                continue
            rows.append({
                "country": row["Area"],
                "m49": row["Area Code (M49)"].lstrip("'").zfill(3),
                "year": year,
                "tonnes": round(float(row["Value"]), 2),
                "flag": row["Flag"],
            })
    assert world[BASE_YEAR] > 10_000_000
    assert any(r["country"] == "Mexico" and r["year"] == BASE_YEAR for r in rows)
    return rows, world


def load_ers():
    volume = defaultdict(float)
    value = defaultdict(float)
    with (RAW / "usda_ers_trade.csv").open(encoding="utf-8-sig") as file:
        for row in csv.DictReader(file):
            if (row["Trade"] != "Import" or row["CommodityName"] != "Avocados"
                    or row["MarketSegment"] != "Fresh" or not 2017 <= int(row["Year"]) <= LATEST_IMPORT_YEAR):
                continue
            key = (row["GeographicDesc"], int(row["Year"]), int(row["MonthNumber"]))
            if row["UnitType"] == "Volume" and row["UnitDesc"] == "Thousand pounds":
                volume[key] += float(row["Amount"]) * POUNDS_TO_TONNES_PER_THOUSAND
            elif row["UnitType"] == "Value" and row["UnitDesc"] == "Thousand dollars":
                value[key] += float(row["Amount"]) * 1000
    records = []
    for (country, year, month), tonnes in sorted(volume.items()):
        records.append({"country": country, "year": year, "month": month,
                        "tonnes": round(tonnes, 2),
                        "valueUsd": round(value.get((country, year, month), 0), 2)})
    for year in range(2017, LATEST_IMPORT_YEAR + 1):
        for month in range(1, 13):
            world = volume.get(("World", year, month), 0)
            countries = sum(v for (c, y, m), v in volume.items() if c != "World" and y == year and m == month)
            assert world > 10_000, (year, month, "Missing or incomplete World total")
            assert abs(world - countries) < 0.05, (year, month, world, countries)
    return records


def load_yearbook_import_share():
    with (RAW / "yearbook_import_share.csv").open(encoding="utf-8-sig") as file:
        matches = [row for row in csv.DictReader(file)
                   if row["commodity_element"] == "Avocados"
                   and row["market_segment"] == "Fresh"
                   and row["variable"] == "Import share"
                   and row["year_value"] == str(BASE_YEAR)
                   and row["year_unit"] == "Calendar year"]
    assert len(matches) == 1, "Expected one USDA yearbook 2024 fresh-avocado import-share record"
    assert matches[0]["unit"] == "percent of fresh fruit availability"
    return round(float(matches[0]["value"]), 5)


def analyze_imports(imports, trade, import_share):
    by_year = defaultdict(lambda: defaultdict(float))
    by_month = defaultdict(lambda: defaultdict(float))
    for row in imports:
        by_year[row["year"]][row["country"]] += row["tonnes"]
        if row["year"] == BASE_YEAR:
            by_month[row["month"]][row["country"]] += row["tonnes"]
    concentration = []
    for year, origins in sorted(by_year.items()):
        world = origins["World"]
        hhi = sum((volume / world) ** 2 for country, volume in origins.items() if country != "World")
        concentration.append({"year": year, "worldTonnes": round(world, 2),
                              "mexicoTonnes": round(origins["Mexico"], 2),
                              "mexicoShare": round(origins["Mexico"] / world * 100, 3),
                              "hhi": round(hhi * 10000),
                              "effectiveOrigins": round(1 / hhi, 3)})
    months = []
    for month in range(1, 13):
        origins = by_month[month]
        months.append({"month": month, "worldTonnes": round(origins["World"], 2),
                       "mexicoTonnes": round(origins["Mexico"], 2),
                       "peruTonnes": round(origins["Peru"], 2),
                       "mexicoShare": round(origins["Mexico"] / origins["World"] * 100, 3)})
    elsewhere = defaultdict(float)
    for row in trade:
        if row["destination"] != "United States of America":
            elsewhere[row["origin"]] += row["tonnes"]
    suppliers = [{"country": country, "elsewhereTonnes": round(elsewhere[country], 2),
                  "usImportsTonnes": round(volume, 2)}
                 for country, volume in by_year[BASE_YEAR].items()
                 if country not in ("World", "Mexico") and volume > 0 and country in elsewhere]
    suppliers.sort(key=lambda row: row["elsewhereTonnes"], reverse=True)
    pool = sum(row["elsewhereTonnes"] for row in suppliers)
    lost = by_year[BASE_YEAR]["Mexico"]
    assert 700_000 < pool < 800_000 and lost > pool
    profiles = []
    for country in ("Peru", "Colombia", "Dominican Republic", "Chile"):
        monthly = [sum(row["tonnes"] for row in imports
                       if row["year"] == LATEST_IMPORT_YEAR
                       and row["country"] == country and row["month"] == month)
                   for month in range(1, 13)]
        peak_start = max(range(10), key=lambda index: sum(monthly[index:index + 3]))
        non_us = [row for row in trade if row["origin"] == country
                  and row["destination"] != "United States of America"]
        leading = max(non_us, key=lambda row: row["tonnes"])
        profiles.append({"country": country,
                         "usImports2024Tonnes": round(by_year[BASE_YEAR][country], 2),
                         "usImports2025Tonnes": round(by_year[LATEST_IMPORT_YEAR][country], 2),
                         "exportsElsewhere2024Tonnes": round(elsewhere[country], 2),
                         "peakThreeMonths2025": [peak_start + 1, peak_start + 3],
                         "peakThreeMonthShare2025": round(sum(monthly[peak_start:peak_start + 3]) / sum(monthly) * 100, 1),
                         "leadingNonUsDestination2024": leading["destination"],
                         "leadingNonUsDestinationTonnes2024": leading["tonnes"]})
    return {"importShareAvailability2024": import_share,
            "concentration": concentration, "months2024": months,
            "eligibleSupplierExports": suppliers,
            "alternativeProfiles": profiles,
            "diversionCeilingTonnes": round(pool, 2),
            "ceilingGapTonnes": round(lost - pool, 2)}


def load_trade():
    edges = []
    mirror = {}
    with (STAGING / "trade_avocado.csv").open(encoding="utf-8") as file:
        for row in csv.DictReader(file):
            if int(row["Year"]) != BASE_YEAR or row["Unit"] != "t":
                continue
            reporter = int(row["Reporter Country Code"])
            partner = int(row["Partner Country Code"])
            if reporter > 300 or partner > 300:
                continue
            tonnes = float(row["Value"])
            if row["Element"] == "Export quantity":
                edges.append({
                    "origin": row["Reporter Countries"],
                    "originM49": row["Reporter Country Code (M49)"].lstrip("'").zfill(3),
                    "destination": row["Partner Countries"],
                    "destinationM49": row["Partner Country Code (M49)"].lstrip("'").zfill(3),
                    "tonnes": round(tonnes, 2),
                    "flag": row["Flag"],
                })
            elif row["Element"] == "Import quantity":
                mirror[(row["Partner Countries"], row["Reporter Countries"])] = round(tonnes, 2)
    edges.sort(key=lambda r: r["tonnes"], reverse=True)
    return edges, mirror


def write_csv(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def main():
    production, world = load_production()
    imports = load_ers()
    trade, mirror = load_trade()
    import_share = load_yearbook_import_share()
    analysis = analyze_imports(imports, trade, import_share)
    retail = json.loads((STAGING / "retail_prices.json").read_text(encoding="utf-8"))
    assert trade, "FAOSTAT trade extract is empty or incomplete"
    base_imports = sum(r["tonnes"] for r in imports if r["year"] == BASE_YEAR and r["country"] == "World")
    mexico_imports = sum(r["tonnes"] for r in imports if r["year"] == BASE_YEAR and r["country"] == "Mexico")
    assert 1_200_000 < base_imports < 1_250_000
    assert 1_050_000 < mexico_imports < 1_080_000
    product = {
        "productId": "avocado-fresh",
        "name": "Fresh avocados",
        "productionItem": "FAOSTAT 572: Avocados",
        "tradeItem": "FAOSTAT 572: Avocados",
        "usImportScope": "USDA ERS Fresh / Avocados, including Hass-like and Unspecified detail",
        "baseYear": BASE_YEAR,
        "unit": "tonnes",
    }
    payload = {
        "product": product,
        "worldProduction": world,
        "production": production,
        "trade": trade,
        "usImports": imports,
        "analysis": analysis,
        "retail": retail,
        "sourceRefs": {
            "production": "https://www.fao.org/faostat/en/#data/QCL",
            "trade": "https://www.fao.org/faostat/en/#data/TM",
            "usImports": "https://www.ers.usda.gov/data-products/fruit-and-tree-nuts-data/trade-and-prices-by-category-and-commodity",
            "logistics": "https://esmis.nal.usda.gov/sites/default/release-files/h989r3203/2n49vz489/k643cx565/FTS-381.pdf",
            "availability": "https://ers.usda.gov/data-products/fruit-and-tree-nuts-data/fruit-and-tree-nuts-yearbook-tables",
            "retailScanner": "https://ers.usda.gov/data-products/fruit-and-vegetable-prices",
            "retailAdvertised": "https://www.ams.usda.gov/mnreports/fvwretail.pdf",
            "marketOutlook2026": "https://ers.usda.gov/sites/default/files/_laserfiche/outlooks/113982/FTS-384.pdf",
            "guatemalaAccess": "https://www.aphis.usda.gov/news/program-update/update-import-requirements-guatemala-fresh-avocado-fruit",
        },
        "builtAt": date.today().isoformat(),
    }
    DIST.mkdir(exist_ok=True)
    (DIST / "data.json").write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    write_csv(PROCESSED / "production.csv", production)
    write_csv(PROCESSED / "us_imports_monthly.csv", imports)
    write_csv(PROCESSED / "trade_edges_2024.csv", trade)
    (PROCESSED / "retail_prices.json").write_text(json.dumps(retail, indent=2), encoding="utf-8")
    mx_to_us = next((r["tonnes"] for r in trade if r["origin"] == "Mexico" and r["destination"] == "United States of America"), None)
    us_from_mx = mirror.get(("Mexico", "United States of America"))
    print(json.dumps({
        "productionRows": len(production), "tradeEdges2024": len(trade),
        "importRows": len(imports), "worldProduction2024": world[BASE_YEAR],
        "usImports2024": round(base_imports, 2), "mexicoImports2024": round(mexico_imports, 2),
        "faostatMexicoExportsToUS2024": mx_to_us,
        "faostatUSImportsFromMexico2024": us_from_mx,
        "importShareAvailability2024": import_share,
        "diversionCeilingTonnes": analysis["diversionCeilingTonnes"],
        "ceilingGapTonnes": analysis["ceilingGapTonnes"],
    }, indent=2))


if __name__ == "__main__":
    main()
