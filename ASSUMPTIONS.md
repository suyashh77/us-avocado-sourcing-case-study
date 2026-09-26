# Scenario assumptions

## Short-horizon tabletop

- Reference: observed February or July 2025 USDA ERS monthly fresh-avocado imports, converted to an average weekly rate. A selected duration repeats that rate; no within-month weekly pattern is inferred.
- Mexico availability, extra alternative-origin flow, and usable buffer days are adjustable assumptions. Extra flow is a percentage of the observed non-Mexico baseline, not a measurement of available capacity. Buffer is a one-time credit limited to lost Mexican volume.
- The calculated gap is an import-equivalent volume. It does not estimate store inventory, retail demand, substitution between avocado sizes or varieties, consumer response, or price elasticity.
- The three presets are illustrative sourcing exercises. Their values are documented in `dist/case_data.json`; they are not reconstructions of actual disruptions.

## Annual extreme supplier diversion

### Reference and shock

- Reference: calendar year 2024, complete annual volume.
- Requirement: replace the U.S. import volume historically supplied by Mexico. Domestic U.S. output and demand are held fixed. This is **import replacement**, not a modeled consumption balance.
- Shock: Mexico-to-U.S. fresh-avocado imports become zero. No inventory buffer is assumed.

### Eligible alternative supply

- Only origins with observed 2024 USDA ERS fresh-avocado imports into the U.S. enter the reallocation calculation.
- Their reported 2024 FAOSTAT exports to non-U.S. partners form an **upper reference pool of already committed trade**. The user chooses 0–100% to redirect. The default is 20% solely as a transparent what-if value, not an empirical estimate of free capacity. The 100% setting is a deliberately extreme conditional ceiling for this supplier set; it does not include potential new U.S. suppliers.
- No additional production, new U.S. market approvals, or extra logistical capacity is assumed. There is no month-by-month allocation; annual output can overstate practical replacement.

### Cost illustration

- Base customs unit value = 2024 USDA ERS World fresh-avocado import value / 2024 World import tonnes / 1,000 kg per tonne.
- The user selects an illustrative 0–100% premium; the display shows a band 10 percentage points below and above that selection (bounded at 0 and 100).
- Extra bill = redirected tonnes × 1,000 × base customs unit value per kg × premium band.
- This omits price effects on existing imports, retail margins, spoilage, transport-specific costs, tariffs, contract prices, and demand response. It is **not** the price required to clear the market.
