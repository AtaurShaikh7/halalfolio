# Order module — Halal Basket → Angel One

Turns a fund's **screened halal holdings** into real BUY orders on your own
Angel One account. Personal use only. Runs **locally** (needs a whitelisted
static IP) — it is *not* part of the web app and does not run on GitHub Pages.

## Safety model

- **Dry-run by default.** `place.mjs` places nothing unless you pass `--confirm`.
- **`--confirm` is the human authorisation.** No scheduling, no cron, ever.
- **Live pre-flight** places one 1-share order to verify IP/auth/permissions
  before the batch (skip with `--no-preflight`).
- **Rate-limited** to ~3.3 orders/sec (Angel cap is 9/sec).
- **Audit log** of every result in `order/execution-logs/`.
- **No silent retries** — failures are logged and surfaced.

## One-time setup

```bash
npm i smartapi-javascript otplib          # only needed to place real orders
cp order/.env.example order/.env          # then fill in your credentials
```

In the SmartAPI dashboard: create an app, enable order permissions, and register
your machine's **static IP** (Primary Static IP). Orders from other IPs are rejected.

## Flow

```bash
# 1. Build the basket (no orders placed — just computes & writes a plan)
node order/build-basket.mjs --code 122639 --amount 100000

# 2. Review order/baskets/122639.json (symbols, tokens, quantities)

# 3. Dry run — see exactly what would be placed
node order/place.mjs --basket order/baskets/122639.json

# 4. Place for real (only when you're sure)
node order/place.mjs --basket order/baskets/122639.json --confirm
```

## Notes & limits

- **Quantities** are sized from a live Yahoo price; the buy is a MARKET order so
  the fill price may differ slightly. Leftover cash (un-allocatable remainder)
  is reported.
- **Unresolved names** (no NSE mapping, or foreign listings like the US stocks
  PPFAS holds) are skipped and listed. Add NSE symbols to `symbol-map.json` to
  include more; foreign listings can't be bought on NSE.
- `build-basket.mjs` and the dry run need **no credentials**. Only real
  placement (`--confirm`) reads `order/.env`.
- Scheme codes: Parag Parikh `122639`, HDFC Flexi `118955`, ICICI Value `120323`,
  Invesco Midcap `120403`, Mirae Small Cap `153196`.
```
