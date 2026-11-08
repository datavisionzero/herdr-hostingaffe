# Working on herdr-hostingaffe

- English source, documentation and commit messages. MIT; no dependencies.
- This is a read-only client of Hostingaffe's public API. No writes, SSH,
  discovery, deployments or monitoring.
- Read README.md. Installed Herdr declarations define the native API. No
  browser or Node APIs in mods; Node belongs in scripts and tests only.
- Module code is shared across Herdr copies. Keep mutable state in View instances.
- Run npm test, npm run test:contract and npm run check. Layout or interaction
  changes also require a real Herdr window check.
- Never commit real infrastructure, tokens, private URLs, personal paths,
  screenshots or generated runtime declarations. Use artifacts/ locally.
- Review the entire staged diff and unpushed history before publishing.
- Maintainers deliver directly to main after checks; preserve required protections.
