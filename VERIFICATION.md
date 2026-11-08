# Verification — 2026-11-08

Target: Herdr Desktop 0.1.14, installed gpui-shell 0.7.1 interfaces,
Hostingaffe API revision `21dcec4eb670ff69818c24faa7951e2d84b6bf14`.
Tests use Node 24 on Windows.

## Completed

- Unit and local HTTP tests cover profile validation, response decoding,
  read-only transport, installation roles/status, search, null IPs, partial
  failures, safe error text, bounded request concurrency, stale results,
  refresh timeouts, separate panel state and launcher navigation.
- Every avatar/color combination has a locally bundled, native-compatible
  SVG. The generator is deterministic and the contract check verifies the
  original avatar and color enums as well as all consumed endpoints and fields.
- `npm test`, `npm run test:contract` and both native `herdr-app check` calls pass.
- Read-only integration against a configured live instance loads machine
  records, addresses and active application installations without request
  failures. No mutations or deployment actions are performed.
- Actual Herdr window frame inspected through `herdr-app shot`: original
  multicolor avatars, names, IPv4/IPv6/private IP rows, missing-IP text and
  application chips render correctly. The installed launcher is visible.
  The running app reports no native errors.

## Limits

- The desktop automation helper failed to activate the target window; search
  typing, wheel input and clipboard interaction have not been driven end to
  end. The visible frame was inspected using Herdr's own screenshot command.
- Native checks only materialize initial elements; they do not replace runtime
  checks. Large inventories, other operating systems and other Herdr versions
  have not been checked interactively.
- Inventory reflects the record and is not monitoring. "Active" is an
  installation status, not a live process or health measurement.
- Full machine responses are needed to read addresses, but unrelated detail
  fields are discarded. No inventory or credential is committed or cached.
- The host fetch interface has no cancellation or redirect policy. Use the
  final trusted origin and refresh after a timeout.
