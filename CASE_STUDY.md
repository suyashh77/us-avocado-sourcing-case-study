# Food Supply Shock Tower — Case 01: U.S. avocado supply

**Why I built it:** I've worked in sourcing, and I'm a college student who is tired of watching the price of daily groceries move without understanding the supply behind them. I want a food supply shock tower that eventually helps me decide when to keep buying a food and when to switch. Avocados are the first case because I can trace their U.S. import concentration, seasonal alternatives, and documented disruptions with public data.

**Role in this case:** Retail produce sourcing analyst

**Decision:** How should a U.S. retailer preserve avocado availability and manage price exposure when Mexican supply is disrupted?

**Evidence snapshot:** September 26, 2026
**Interactive analysis:** [U.S. Avocado Sourcing Case Study](https://suyashh77.github.io/us-avocado-sourcing-case-study/)

**Series roadmap:** Potatoes, chicken, broccoli, apples, blueberries, and lettuce are planned. This avocado case does not yet monitor those foods or calculate a shopper substitution trigger.

## Executive decision

Keep Mexico as the core year-round lane while reducing single-origin failure risk. Prequalify Peru for the summer window and Colombia for a broader observed U.S. receipt pattern; contract for **weekly, SKU-specific** flex only after confirming fruit size, grade, APHIS access, packhouse and ripening capacity, freight, and incumbent customer commitments. Use a small, explicitly usable buffer for short interruptions. Set separate responses for a one-week inspection pause and an eight-week crop squeeze.

| 2025 observed U.S. import lane | Volume | Largest three-month U.S. receipt window | Procurement status |
|---|---:|---|---|
| Mexico | 1,084,244 t | Core lane throughout the year | Continuity and retailer-specific contingency volume unverified |
| Peru | 100,739 t | June–August | Summer option; uncommitted weekly volume, Hass size, and pack mix unverified |
| Colombia | 56,068 t | May–July | Broader observed pattern; contract release, transit, and grade unverified |

**Evidence labels:** Import tonnes and receipt windows are observed USDA ERS records; the suggested supplier roles are analyst interpretations; extra flow and buffer in the model are assumptions; contractable capacity is unverified. [USDA ERS trade data](https://www.ers.usda.gov/data-products/fruit-and-tree-nuts-data/trade-and-prices-by-category-and-commodity).

## Why the category is exposed

USDA ERS records **1.300 million tonnes** of U.S. fresh-avocado imports in 2025, including **1.084 million tonnes from Mexico (83.4%)**. USDA's balance-sheet estimate puts imports at **88.4% of U.S. fresh-avocado availability in 2024**. These percentages have different denominators. Global output is much broader than the pool of fruit that can arrive at a U.S. retailer in the correct week and format. [USDA ERS trade data](https://www.ers.usda.gov/data-products/fruit-and-tree-nuts-data/trade-and-prices-by-category-and-commodity); [USDA ERS Yearbook](https://ers.usda.gov/data-products/fruit-and-tree-nuts-data/fruit-and-tree-nuts-yearbook-tables).

The annual extreme test removes Mexico's **1.066 million tonnes** of 2024 U.S. import volume. Redirecting **all 750,409 tonnes** of reported non-U.S. exports from five alternative origins already supplying the United States would still leave **315,949 tonnes** uncovered. This is a conditional upper bound for that supplier set, not a physically or contractually feasible plan. [FAOSTAT bilateral trade](https://www.fao.org/faostat/en/#data/TM).

The interactive case note adds a Sankey of **Peru, Colombia, and Chile's exporter-reported 2024 trade partners**, plus a common-scale comparison of their U.S. and non-U.S. reported exports. Those exports are existing sales. The ribbons show commercial relationships and competing buyers; they do not measure cargo routes, Hass-qualified fruit, or spare capacity. [FAOSTAT bilateral trade](https://www.fao.org/faostat/en/#data/TM).

## What events show about price

| Episode | Observed supply and price evidence | Sourcing interpretation |
|---|---|---|
| **2022: crop and inspection shock** | USDA forecast Mexico's 2021/22 production **8% below** the preceding record. January 2022 U.S. imports were **17% below** January 2021. January shipping-point prices for specified conventional Hass cartons averaged **$48.94 vs $23.05** a year earlier. An inspection suspension ran **February 12–18**; prices in the final week of February were roughly **80% above** the comparable 2021 week. [USDA ERS March 2022](https://ers.usda.gov/sites/default/files/_laserfiche/outlooks/105859/FTS-374.pdf). | Prices were already elevated before the pause. The evidence supports a compound supply/logistics risk, not a claim that the short suspension alone caused the increase. |
| **2024: smaller fruit, higher retail ASP** | HAB/Circana reports U.S. retail avocado category units **up 4%** and average selling price **up 12% to $1.19 per fruit** in 2024. HAB describes fewer large 40/48-size fruit and more small fruit. USDA also records a brief June inspection suspension in Michoacán. [HAB retail composite](https://hassavocadoboard.com/wp-content/uploads/Total-U.S.-2024-Q4.pdf); [HAB year review](https://hassavocadoboard.com/happenings/2024-year-in-review/); [USDA ERS July 2024](https://ers.usda.gov/sites/default/files/_laserfiche/outlooks/109636/FTS-379.pdf). | Grade and size mix can change what a retailer can sell even when total units increase. The annual retail change does not isolate the effect of weather, size, or the short inspection pause. |
| **2025/26: large-fruit recovery** | USDA reports larger sizes rose from **40% to 50%** of Mexico's season-to-date U.S. shipments; mid-March 2026 FOB prices for larger Hass avocados were near **$1/lb**, about **one-third** of the prior-year level. [USDA ERS March 2026](https://ers.usda.gov/sites/default/files/_laserfiche/outlooks/113982/FTS-384.pdf). | More available large fruit eased an upstream price pressure. FOB dollars per pound are not retail dollars per fruit. |

A consistent HAB/Circana **annual retail average selling price per fruit** series is **$1.28 in 2022, $1.06 in 2023, and $1.19 in 2024**. It captures category movement, not the isolated price effect of any one event. The site keeps this series separate from weekly advertised prices, FOB prices, and customs values. [HAB retail composite](https://hassavocadoboard.com/wp-content/uploads/Total-U.S.-2024-Q4.pdf).

## Short-horizon scenario model

I used **February and July 2025 USDA ERS fresh-avocado imports** as distinct reference months. Monthly tonnes are converted to a weekly rate using the number of days in the month. A scenario removes some Mexican flow for one to eight weeks, then subtracts assumed extra arrivals from other origins and a one-time usable buffer. The model reports the residual gap in tonnes and as a share of baseline import-equivalent demand.

| Illustrative scenario | Mexico availability | Assumed extra non-Mexico flow | Buffer | Residual gap | Gap / period imports |
|---|---:|---:|---:|---:|---:|
| One-week February inspection pause | 0% | 10% of observed other-origin rate | 3 days | **10,669 t** | **45.5%** |
| Eight-week February crop squeeze | 75% | 15% | 3 days | **25,556 t** | **13.6%** |
| Two-week July interruption | 0% | 20% | 3 days | **22,042 t** | **45.2%** |

These are **illustrative import-equivalent gaps**, not forecasts of consumer shortages. A three-day buffer means one-time usable inventory equal to three days of normal Mexican import flow. It is not an observed national stock level. The eight-week case repeats February's weekly rate for all eight weeks and therefore does not forecast the actual spring calendar. No retail price response is estimated. See [`pipeline/short_horizon_model.py`](pipeline/short_horizon_model.py) and [`dist/case_data.json`](dist/case_data.json) for inputs, formulas, and rounded results.

## Buyer actions and next evidence

1. **Continuity:** confirm named Mexico suppliers, inspection contingency, crossing alternatives, order cutoffs, and DC receipt visibility.
2. **Seasonal alternatives:** test Peru's summer lane and Colombia's broader lane against firm weekly volume, grade/size, U.S. market access, packhouse throughput, transit time, and existing customer commitments.
3. **Retail execution:** contract by SKU and pack format, including small versus large fruit, bag count, ripeness specification, and shrink allowance.
4. **Trigger-based response:** compare weekly confirmed receipts with the retailer's POS demand and DC inventory. Reallocate promotions and assortment before the service gap reaches stores.

Before treating an alternative as replacement supply, ask the supplier for firm tonnes by week, uncommitted capacity beyond existing buyers, Hass size and grade, pack formats, ripeness specification, U.S. eligibility, packhouse and cold-chain throughput, transit variability, delivered cost by SKU, and interruption terms. National production and bilateral trade data cannot answer these commercial questions.

To convert the tabletop into a retailer-specific decision model, add chain POS forecasts, supplier contracts, purchase-order fill, store/DC inventory, landed cost, ripening loss, and margin by SKU. Then estimate price response separately with a defensible identification strategy. The public data used here cannot do that.

## Reproduce and inspect

```sh
python pipeline/short_horizon_model.py
python -m http.server 8765 --directory dist
```

The [README](README.md) describes the full data pipeline. [CONTENT_CRITIQUE.md](CONTENT_CRITIQUE.md) records what changed in the site's editorial framing and what remains unresolved. The [analyst report](ANALYST_REPORT.md) has the detailed supplier and risk assessment.
