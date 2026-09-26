# Data dictionary

| Field | Meaning | Unit | Grain | Source |
|---|---|---|---|---|
| `production.country`, `m49` | FAOSTAT area and UN M49 code | text | country | FAOSTAT QCL |
| `production.year` | Calendar year | year | country-year | FAOSTAT QCL |
| `production.tonnes` | Avocado production | metric tonnes | country-year | FAOSTAT QCL item 572, element 5510 |
| `production.flag` | Original FAOSTAT quality/method flag | code | country-year | FAOSTAT QCL |
| `trade.origin`, `destination` | Reporter exporter and partner | text | bilateral flow | FAOSTAT TM |
| `trade.tonnes` | Reported export quantity | metric tonnes | origin-destination-year | FAOSTAT TM item 572, export quantity |
| `usImports.country` | U.S. import origin, or `World` total | text | origin-month | USDA ERS |
| `usImports.tonnes` | Fresh-avocado import volume; converted from thousand pounds | metric tonnes | origin-month | USDA ERS |
| `usImports.valueUsd` | Import value; converted from thousand dollars | U.S. dollars | origin-month | USDA ERS |
| `worldProduction[year]` | Publisher's published world aggregate | metric tonnes | year | FAOSTAT QCL |
| `analysis.importShareAvailability2024` | ERS Yearbook import share of U.S. fresh-avocado domestic availability | percent | calendar year 2024 | USDA ERS Table H-1 |
| `analysis.concentration[]` | Annual ERS import total, Mexico share, HHI, and effective origins | tonnes / percent / index | calendar year 2017–2025 | Derived from USDA ERS |
| `analysis.months2024[]` | U.S. import total, Mexico volume/share, and Peru volume | tonnes / percent | calendar month 2024 | Derived from USDA ERS |
| `analysis.eligibleSupplierExports[]` | Observed 2024 U.S. suppliers and their FAOSTAT exports to non-U.S. partners | metric tonnes | origin-year | USDA ERS and FAOSTAT TM |
| `analysis.diversionCeilingTonnes`, `ceilingGapTonnes` | 100% redirection of eligible non-U.S. exports and remaining Mexican-volume gap | metric tonnes | 2024 conditional scenario | Derived |
| `analysis.alternativeProfiles[]` | 2024/2025 U.S. lane sizes, reported non-U.S. exports, leading trade destination, and peak three-month U.S. window | tonnes / percent / months | origin-year | Derived from USDA ERS and FAOSTAT TM |
| `retail.weeklyAdvertised` | National conventional Hass price per fruit; report week, prior week and comparable week last year with ad counts | USD per each | weekly report | USDA AMS |
| `retail.scannerBenchmark` | Fresh-avocado average retail price per pound | USD per pound | 2023 annual estimate | USDA ERS / Circana |

Derived website measures: supplier share = country U.S. imports / World U.S. imports; exports elsewhere = sum of FAOSTAT reporter export flows to partners other than the U.S.; modeled redirected supply = selected fraction × exports elsewhere; remaining gap = Mexico U.S. imports − redirected supply. See `ASSUMPTIONS.md` for the cost calculation.
