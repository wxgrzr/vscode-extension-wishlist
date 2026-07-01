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

## Packaging

Build a `.vsix` locally:

```bash
npx @vscode/vsce package
```

## Publishing

Publishing requires a [Marketplace publisher](https://marketplace.visualstudio.com/manage).

Microsoft is retiring Azure DevOps Personal Access Tokens on **December 1, 2026**, so authenticate with [Microsoft Entra ID](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#azure-credential). Sign in with the Azure CLI, then publish with `--azure-credential`:

```bash
az login
npx @vscode/vsce publish --azure-credential
```

> PAT-based publishing (`vsce login wxgrzr` then `vsce publish`) still works until the December 1, 2026 retirement, but Entra ID is the future-proof path.
