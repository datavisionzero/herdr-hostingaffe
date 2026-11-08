# Hostingaffe avatars

The 38 original SVG drawings in `assets/upstream/`, the palette, avatar order
and FNV-1a fallback selection in `mods/hostingaffe/pictures.js` originate from
[Hostingaffe](https://github.com/datavisionzero/hostingaffe), revision
`21dcec4eb670ff69818c24faa7951e2d84b6bf14`.

Copyright (c) 2026 datavisionzero. MIT licensed; the original license is kept
in `assets/upstream/LICENSE` and the repository license has the same terms.

`scripts/build-avatars.mjs` resolves CSS custom colors into native SVG values.
The generated variants in `mods/hostingaffe/avatars/` retain the original
drawings and are covered by the same MIT license. No third-party logo service
is contacted. The default pictures include faces, as Hostingaffe does.
