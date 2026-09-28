# Food Supply Shock Tower — Case 01: Avocados

I've worked in sourcing, and as a college student I keep noticing price changes in the foods I buy every week. I started a Food Supply Shock Tower to ask whether I can spot supply exposure early enough to make a better buying or substitution decision. Avocados are case 01: a tractable starting point with a concentrated U.S. import lane and measurable alternative origins. [Explore the interactive case study](https://suyashh77.github.io/us-avocado-sourcing-case-study/).

This first case connects U.S. avocado import concentration, documented production and inspection shocks, retail and upstream price evidence, alternative origins, and transparent short-horizon scenario tests. It uses dated data snapshots, not a live shipment feed. **Potatoes, chicken, broccoli, apples, blueberries, and lettuce are planned future cases; they are not monitored here yet.** The current analysis does not recommend when a shopper should switch foods: that needs local shelf prices, availability, and substitute costs.

The page is structured as a 2–3 minute visual case note: buyer decision with observed Mexico/Peru/Colombia lanes, six evidence figures including a Sankey of reported export relationships, an adjustable disruption scenario with sensitivity grid, and three sourcing actions. Event context, supplier questions, the map, global charts, supplier profiles, annual extreme test, methods, and source ledger open on demand. The figures are rendered from checked-in snapshots and update when those snapshots are rebuilt and redeployed.

Start with the [case study narrative](CASE_STUDY.md) and the [editorial critique](CONTENT_CRITIQUE.md). The interactive site includes the global map as context and preserves the annual Mexico-zero calculation as an extreme bound.

The central buyer question is: **how much weekly supply can qualified alternatives and usable inventory cover when Mexican flow is interrupted?**

## Principal finding

Mexico supplied **83.4%** of 2025 U.S. fresh-avocado imports. In an illustrative **one-week February interruption**, assuming 10% extra non-Mexican flow and a one-time three-day usable buffer, the short-horizon tabletop leaves **10,669 tonnes** of import-equivalent demand uncovered (**45.5%** of that period's reference flow). These flex and buffer quantities are assumptions, not measured free capacity or retailer inventory. They show why a buyer needs weekly commitments and SKU-level contingency plans. [USDA ERS trade data](https://www.ers.usda.gov/data-products/fruit-and-tree-nuts-data/trade-and-prices-by-category-and-commodity).

The separate annual extreme test uses 2024 U.S. imports: Mexico supplied **1,066,358 tonnes (87.6%)**. Five alternative origins already selling to the U.S. reported **750,409 tonnes** of exports to non-U.S. partners; redirecting all of it still leaves **315,949 tonnes** uncovered. That conditional arithmetic is not a feasible sourcing plan. [FAOSTAT trade matrix](https://www.fao.org/faostat/en/#data/TM).

The website starts in `dist/index.html`. Open it through a local HTTP server, because the browser loads `data.json`, `case_data.json`, and `world.geojson`. The dated written assessment, supplier comparison, risk register, and decision agenda are in [ANALYST_REPORT.md](ANALYST_REPORT.md).

The global desk computes its 2015–2024 production trend, 2024 producer count, largest exporter-to-partner records, and leading reported destinations from `dist/data.json`. Selecting a country on the map or in the control filters its production history, U.S. lane, and reported trade partners. A trade relationship is not a physical route or proof of spare supply; destination totals do not measure final consumption because countries can re-export fruit.

The short-horizon sourcing tabletop is generated from `data/processed/us_imports_monthly.csv` by `pipeline/short_horizon_model.py`, which writes `dist/case_data.json`. Its February/July 2025 baselines are observed; its Mexico availability, extra alternative flow, and usable buffer are assumptions. HAB/Circana 2022–2024 retail annual average selling prices are transcribed with source and measure labels in the same output.

## Reproduce the data

Requirements: Python 3.10+, `requests`, `openpyxl`, and Poppler's `pdftotext`. From this directory:

```sh
python pipeline/download.py
python pipeline/extract.py
python pipeline/retail.py
python pipeline/build.py
python pipeline/short_horizon_model.py
python pipeline/validate_comtrade.py
python pipeline/validate_fatus.py
python -m http.server 8765 --directory dist
```

The seven public source snapshots total about 596 MB compressed. Raw downloads remain in ignored `data/raw/`. The filtered FAOSTAT rows are in `data/staging/`; the normalized snapshots are in `data/processed/`. `dist/data.json` is the compact website snapshot. `pipeline/qa.py` uses Playwright for browser checks after the local server starts.

## GitHub Pages

The checked-in `dist/` directory is the static site. [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes that exact directory on pushes to `main`. The source tables and methods remain in this repository; the site uses relative asset paths so it also works under a GitHub Pages project URL. New data requires a deliberate pipeline rebuild, review of derived outputs, and a commit.

## Data and method

- FAOSTAT item 572, Avocados: 2015–2024 country production in tonnes; 2024 bilateral export quantity. FAOSTAT's world total is retained as published. Country rankings exclude area aggregates such as “China” while retaining “China, mainland.”
- USDA ERS Fruit and Tree Nuts Trade Data: 2017–2025 monthly U.S. **fresh** avocado import volume and value by origin. Both Hass-like and unspecified detail are included. ERS “thousand pounds” are converted with `1 thousand pounds = 0.45359237 tonnes`.
- USDA ERS Fruit and Tree Nuts Yearbook, Table H-1: 2024 fresh-avocado import share of domestic availability, a balance-sheet estimate.
- USDA AMS weekly national retail report: conventional Hass advertised price per fruit, with prior-week and year-earlier report comparisons. USDA ERS Fruit and Vegetable Prices: 2023 scanner-based average retail price per pound. These measures are kept separate from the import unit-value scenario.
- Natural Earth 1:110m country shapes provide the visual geography. Bilateral records are drawn as abstract arcs; they do not prove actual shipping paths.
- The shock removes the ERS 2024 Mexico-to-U.S. volume. Only countries with an observed ERS U.S. flow in 2024 can contribute. A selected 0–100% fraction of their FAOSTAT 2024 exports to non-U.S. partners is redirected, without increasing production. The uncovered volume is `lost − redirected`.
- The displayed extra import bill applies a selected cost-premium band (±10 percentage points) to the 2024 ERS average customs import unit value **only for redirected volume**. It is not a retail-price estimate or market-clearing price.

See [METHODOLOGY.md](METHODOLOGY.md), [ASSUMPTIONS.md](ASSUMPTIONS.md), [DATA_DICTIONARY.md](DATA_DICTIONARY.md), and [SOURCE_LEDGER.md](SOURCE_LEDGER.md) for definitions, provenance, and limits.

## What remains uncertain

Annual exports do not identify available packing capacity, contracts, U.S. market access beyond observed shipments, monthly surplus, transit time, grade or variety compatibility, or the price required to displace other buyers. The MVP therefore reports an uncovered volume under assumptions and an illustrative import-cost band. It cannot infer a defensible market-clearing price or predict consumer substitution. Port-level route modeling and historical causal calibration are future work, not implied by the current output.

The Atlas uses 2024 to align FAOSTAT annual production/trade with a complete year of ERS monthly imports. The ERS source file was updated September 15, 2026; its historical observations may be revised by the publisher on later downloads.

The AMS PDF URL points to a rolling latest report. The checked-in `data/processed/retail_prices.json` records the report date and extracted values used by the published site. To refresh that observation deliberately, delete only the ignored `data/raw/ams_retail_latest.pdf`, rerun `download.py`, `retail.py`, and `build.py`, then review the new report date.
