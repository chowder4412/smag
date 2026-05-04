# Maestro E2E Tests

## Setup

Install Maestro CLI:
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## Running flows

Run all flows against a running simulator/device:
```bash
# Customer app (smag)
maestro test .maestro/

# Run a single flow
maestro test .maestro/01_login_to_home.yaml
```

## Flows

| File | Path | Description |
|---|---|---|
| `01_login_to_home.yaml` | Login → Home | Email login, splash animation, home screen |
| `02_menu_to_checkout.yaml` | Menu → Cart → Checkout | Add item, cart totals, proceed to checkout |
| `03_order_history_to_track.yaml` | Orders → Track | Order history, track active order |
| `04_driver_accept_order.yaml` | Driver login → Accept | Driver auth, available orders, self-assign |

## Prerequisites

- App must be running on a simulator or physical device
- Test accounts must exist in Firebase:
  - `chef@smag.com` / `password123` — customer account with at least one past order
  - `driver@smag.com` / `password123` — approved driver account in smag_business

## CI integration

Add to your CI pipeline:
```yaml
- name: Run Maestro E2E tests
  run: maestro test .maestro/ --format junit --output maestro-results.xml
```
