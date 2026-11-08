# herdr-hostingaffe

A compact, read-only [Hostingaffe](https://github.com/datavisionzero/hostingaffe)
machine overview for [Herdr Desktop](https://github.com/herdrdev/herdr-app).
Native GPUI, MIT licensed, no webview, dependencies or installation build step.

Each machine card shows its original Hostingaffe avatar, name, key, kind,
IPv4, IPv6 and private IP addresses, and its active application installations.
Click an IP to copy it. Search finds machines by name, key, hostname, IP or app.
There are no detail pages, SSH actions or write operations.

This is recorded inventory, not a live health check. An active record does not
mean a machine is online. Missing addresses and failed requests are distinguished.

## Install

Requires Herdr 0.1.14's installed native interfaces. Compatibility is checked
against Hostingaffe revision `21dcec4eb670ff69818c24faa7951e2d84b6bf14`.

Copy `mods/hostingaffe` into Herdr's `mods` directory:
`$HERDR_APP_HOME/mods/hostingaffe`, or `~/.config/herdr-app/mods/hostingaffe`.
Keep the `avatars` subdirectory. Run:

```sh
herdr-app check <path-to-installed-mod>
herdr-app do pane.split '{"direction":"right","mod":"hostingaffe"}'
```

Or open a dedicated tab (no repository mapping is needed):

```sh
herdr-app do tab.new '{"name":"Machines","mod":"hostingaffe"}'
```

These examples use POSIX shells or PowerShell 7 native argument passing.

### Connection

Create `hostingaffe.local.json` in Herdr's home, **outside Git**:

```json
{
  "profiles": {
    "default": {
      "url": "https://inventory.example",
      "token": "REPLACE_LOCALLY"
    }
  }
}
```

Use a Hostingaffe user or agent token. A machine token only submits reports
and cannot read the inventory. The mod only issues GET requests, regardless
of the permissions the credential itself has. This local plaintext file is
not an OS keychain. Do not paste tokens into chats or commit them.

The URL is the final HTTPS origin, without `/api`, a path, credentials or a
query. HTTP is permitted only for loopback development. Avoid redirects:
Herdr's fetch interface does not expose redirect controls. The mod does not
read browser sessions, Proton Pass, Vaultaffe or CLI credentials automatically.
Provision an existing credential locally with the credential manager you use.

Named profiles can be selected with `"props":{"profile":"work"}`. Profile
settings stay on the local computer even when Herdr shows a remote terminal.
No endpoint or credential is taken from the focused repository.

### Reopen from a launcher

Optionally install `mods/hostingaffe-launcher` beside the main mod. Use a
personal Herdr layout; clone the shipped layout first if necessary:

```sh
herdr-app do layout.clone '{"name":"main","as":"inventory-workspace"}'
```

Herdr docks the newly discovered launcher at the bottom of the personal
layout. Click **hostingaffe: Machines**, or run:

```sh
herdr-app do hostingaffe-launcher.open
```

It focuses an existing overview in the current tab or opens one on the right.
The launcher must be visible for its command to receive events. Existing
personal layouts and other mods should be preserved. Add a block referencing
`hostingaffe-launcher` for any other layout you want it in.

### Demo

```sh
herdr-app do tab.new '{"name":"Machine demo","mod":"hostingaffe","props":{"demo":true}}'
```

Demo mode needs no credentials or network. All demo addresses are documentation
ranges and every app and machine is invented.

## Scope and data flow

- Machines: all non-retired records, including clearly marked planned machines.
- Apps: active installations with `role=application`. Platform services and
  planned/retired installations are omitted. This is the API's role distinction,
  not a guess about who owns a software repository.
- `GET /api/machines` and
  `GET /api/installations?role=application&status=active` load the overview.
- Machine summaries do not carry IPs. `GET /api/machines/{key}` supplies them,
  with at most four requests in flight. Other detail fields are discarded;
  no files, reports, history, runbooks or installation details are requested.
- One failed address request affects only that card. Failed installation loading
  is shown as unavailable, never as an empty installation list.
- Refresh reloads the inventory. No automatic network polling. After 60 seconds
  a stalled load can be retried; late results cannot overwrite a newer load.
  The host cannot cancel already-started fetches through its declared API.
- Inventory stays in memory; no logs, state files or caches contain it. IPs only
  reach the clipboard when clicked.
- Avatars and colors match Hostingaffe, including its deterministic fallback
  for unset choices. Native full-color SVG variants are bundled locally. Faces
  are enabled, independently of the web browser's display preference.

## Development

Node 24 is used only for tests and maintenance scripts. Herdr runs the mod.

```sh
npm test
npm run test:contract
npm run check
npm run assets
```

The contract check downloads the public pinned OpenAPI contract. Offline:
`node scripts/check-contract.mjs /path/to/hostingaffe/docs/api/openapi.json`.
`npm run assets` regenerates 380 variants from the 38 vendored original SVGs;
users do not need to run it. CI checks tests, the contract and asset reproducibility
on Linux and Windows. Herdr checks and visual checks remain local.

`main.js` owns per-panel state and native rendering, `client.js` contains the
read-only HTTP boundary, `core.js` validates and filters the consumed fields,
and `pictures.js` selects bundled assets. All mutable data is per View instance
because Herdr shares module code between copies.

See [VERIFICATION.md](VERIFICATION.md) for checks and limits and
[NOTICE.md](NOTICE.md) for avatar provenance. Contributions and documentation
are in English. Maintainers may push to `main` after checks pass; external
contributions use pull requests. Do not publish real infrastructure or credentials.

## License

[MIT](LICENSE). Original Hostingaffe drawings are MIT as well. Herdr is a
separate application with its own license; its generated declarations are not
redistributed here.
