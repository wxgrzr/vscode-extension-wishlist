# Contributing

Thanks for your interest in improving Extension Wishlist!

## Development

This is a standard VS Code extension project (TypeScript + esbuild). It runs inside VS Code, not in a browser.

```bash
npm install
```

Then press `F5` in VS Code (or run the **Run Extension** launch config) to open an Extension Development Host with the extension loaded. Open the **Extension Wishlist** view from the Activity Bar.

Useful scripts:

| Script | Description |
| --- | --- |
| `npm run compile` | Bundle the extension to `dist/` with esbuild |
| `npm run watch` | Rebuild on change (with source maps) |
| `npm run package` | Production (minified) bundle |
| `npm run typecheck` | Type-check without emitting |
| `npm run release -- <patch\|minor\|major>` | Bump version, tag, and publish (see [Publishing](#publishing)) |

## Packaging

Build a `.vsix` locally:

```bash
npx vsce package
```

## Versioning

Releases use [semver](https://semver.org/) tags on `main` in the form `vX.Y.Z`, matching the `version` field in `package.json`. Before releasing, add an entry to [CHANGELOG.md](CHANGELOG.md) under `## [X.Y.Z] - YYYY-MM-DD` describing what changed.

## Publishing

Publishing requires a [Marketplace publisher](https://marketplace.visualstudio.com/manage).

Microsoft is retiring Azure DevOps Personal Access Tokens on **December 1, 2026**, so authenticate with [Microsoft Entra ID](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#azure-credential). Sign in with the Azure CLI, then bump, tag, and publish in one step:

```bash
az login
npm run release -- patch   # or minor / major
```

This runs `vsce publish --azure-credential <bump>`, which updates `version` in `package.json`, commits, creates the matching `vX.Y.Z` tag, and publishes to the Marketplace. Push the commit and tag afterward:

```bash
git push origin main --follow-tags
```

> PAT-based publishing (`vsce login wxgrzr` then `vsce publish`) still works until the December 1, 2026 retirement, but Entra ID is the future-proof path.
