"""Filter the large FAOSTAT archives to avocado-only source rows."""

import csv
import io
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
STAGING = ROOT / "data" / "staging"


def extract(archive_name: str, destination_name: str):
    STAGING.mkdir(parents=True, exist_ok=True)
    archive = zipfile.ZipFile(RAW / archive_name)
    member = next(name for name in archive.namelist() if name.endswith("(Normalized).csv"))
    count = 0
    with archive.open(member) as compressed, (STAGING / destination_name).open("w", newline="", encoding="utf-8") as output:
        reader = csv.DictReader(io.TextIOWrapper(compressed, encoding="utf-8-sig"))
        writer = csv.DictWriter(output, fieldnames=reader.fieldnames)
        writer.writeheader()
        for row in reader:
            if row["Item Code"] == "572" and int(row["Year"]) >= 2015:
                writer.writerow(row)
                count += 1
    print(f"{destination_name}: {count:,} avocado rows", flush=True)


if __name__ == "__main__":
    extract("faostat_production.zip", "production_avocado.csv")
    extract("faostat_trade.zip", "trade_avocado.csv")
