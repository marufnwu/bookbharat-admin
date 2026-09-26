# Courier logos

Placeholder monogram badges served from the admin app's own origin, referenced
by `logo_url` in the backend's `config/shipping-carriers.php`.

## Why placeholders

The config previously pointed at each carrier's public website logo. Every one of
those URLs was dead when checked:

| URL | Result |
| --- | --- |
| `bluedart.com/images/logo.png` | 404 |
| `shadowfax.in/img/logo.png` | 404 |
| `shiprocket.in/img/logo.png` | 404 |
| `indiapost.gov.in/imgs/logo.png` | 404 |
| `shipway.com/assets/img/logo.png` | 404 |
| `rapidshyp.com/img/logo.png` | 500 |
| the rest | connection/DNS failure |

Because every request 404s, the admin's `onError` handler hides the `<img>` and
the courier list renders an empty box. Local assets remove the external
dependency entirely, so a carrier changing its website can no longer break the
order screen.

## Swapping in official artwork

Drop the real logo in as `<slug>.svg` (or add `<slug>.png` and update the config
to match). Keep it square and transparent; the UI renders it at 20×20 inside a
36×36 bordered tile, so anything busier than a wordmark will be illegible at that
size.

The background colours are close approximations of each brand, not official brand
values. Replace them along with the artwork if that matters for brand guidelines.
