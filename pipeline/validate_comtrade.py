"""Fetch a small independent UN Comtrade check of the 2024 U.S. baseline.

HS 080440 covers avocados, fresh OR dried, so these values validate order of
magnitude and reporting consistency; they do not replace the ERS fresh series.
"""

import json
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
URL = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"
PARTNERS = {"World": 0, "Mexico": 484, "Peru": 604, "Colombia": 170, "Dominican Republic": 214, "Chile": 152}


def main():
    rows = []
    response = requests.get(URL, params={"period": "2024", "reportercode": "842",
        "cmdCode": "080440", "flowCode": "M",
        "partnerCode": ",".join(str(x) for x in PARTNERS.values()), "maxRecords": 20}, timeout=30)
    response.raise_for_status()
    data = response.json()["data"]
    for name, code in PARTNERS.items():
        matching = [record for record in data if record["partnerCode"] == code]
        assert len(matching) == 1, (name, len(matching))
        record = matching[0]
        assert record["partnerCode"] == code and record["cmdCode"] == "080440"
        rows.append({"partner": name, "m49": code, "netWeightKg": record["netWgt"],
                     "tonnes": record["netWgt"] / 1000, "tradeValueUsd": record["primaryValue"],
                     "hsClassification": record["classificationCode"], "isReported": record["isReported"]})
    destination = ROOT / "data" / "processed" / "comtrade_2024_check.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps({"sourceUrl": URL, "scope": "US reporter imports, HS 080440 fresh or dried, 2024", "rows": rows}, indent=2), encoding="utf-8")
    ers = json.loads((ROOT / "dist" / "data.json").read_text(encoding="utf-8"))
    for name in ["World", "Mexico"]:
        observed = sum(r["tonnes"] for r in ers["usImports"] if r["year"] == 2024 and r["country"] == name)
        comtrade = next(r["tonnes"] for r in rows if r["partner"] == name)
        print(f"{name}: UN Comtrade {comtrade:,.2f} t; USDA ERS {observed:,.2f} t; delta {comtrade-observed:,.2f} t")


if __name__ == "__main__":
    main()
