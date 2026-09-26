# Architecture

`FAOSTAT ZIP + USDA ERS CSV → raw snapshots → avocado-filtered staging → canonical production / trade / import records → data.json → static interactive story`

The current MVP is static because the selected historical snapshots and scenario are small enough to run in the browser. The scenario is deterministic arithmetic over the canonical records; no account, API server, or database is needed for this product slice. This keeps the source package reproducible and the published experience fast. Later products can reuse the ingestion pattern but require product-specific classifications and assumptions; the current formulas must not be generalized blindly.

Source identifiers and URL references travel with the output. Large raw archives are downloaded on demand and excluded from site publication. The processed CSV files allow direct audit of every plotted annual or monthly value.
