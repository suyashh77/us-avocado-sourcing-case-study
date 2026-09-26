"""Download the public source snapshots used by the avocado MVP.

Run from the project root: python pipeline/download.py
Large raw files are intentionally excluded from the distributable site.
"""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
SOURCES = {
    "faostat_production.zip": "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip",
    "faostat_trade.zip": "https://bulks-faostat.fao.org/production/Trade_DetailedTradeMatrix_E_All_Data_(Normalized).zip",
    "usda_ers_trade.csv": "https://www.ers.usda.gov/media/6475/fruit-and-tree-nuts-trade-data.csv?v=19621",
    "fatus_calendar.csv": "https://www.ers.usda.gov/media/5311/csv-comma-separated-values-format-of-all-data.csv?v=74642",
    "yearbook_import_share.csv": "https://ers.usda.gov/media/6514/import-share-of-domestic-availability-fresh-canned-frozen-juice-and-dried-fruit.csv?v=82990",
    "avocado_retail_2023.xlsx": "https://ers.usda.gov/media/6244/avocados-average-retail-price-per-pound-and-per-cup-equivalent.xlsx?v=66944",
    "ams_retail_latest.pdf": "https://www.ams.usda.gov/mnreports/fvwretail.pdf",
}


def download(item):
    filename, url = item
    RAW.mkdir(parents=True, exist_ok=True)
    destination = RAW / filename
    if destination.exists() and destination.stat().st_size > 10_000:
        return f"kept {filename} ({destination.stat().st_size:,} bytes)"
    partial = destination.with_suffix(destination.suffix + ".part")
    with requests.get(url, stream=True, timeout=90) as response:
        response.raise_for_status()
        with partial.open("wb") as output:
            for chunk in response.iter_content(1024 * 1024):
                output.write(chunk)
    partial.replace(destination)
    return f"downloaded {filename} ({destination.stat().st_size:,} bytes)"


if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=3) as pool:
        for result in pool.map(download, SOURCES.items()):
            print(result, flush=True)
