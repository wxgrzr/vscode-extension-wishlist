# Extension Wishlist

A VS Code extension that lets you bookmark Marketplace extensions to a wishlist so you can try them later — without being forced to install and download them now.

## Features

- **Search the Marketplace** inside VS Code via a rich webview panel (queries the official VS Code gallery API).
- **Wishlist instead of install** — add any extension to a saved list with one click. Nothing is downloaded until you decide to try it.
- **Sidebar tree view** in the Activity Bar listing everything you've saved, with inline actions (open in Marketplace, install, remove) and a count badge.
- **Add by ID** for extensions you already know (e.g. `esbenp.prettier-vscode`).
- **Install when ready** — promote any wishlisted item to a real install in one click.
- **Settings Sync** — the wishlist is stored in `globalState` and roams across your machines.

## Running it

This is a standard VS Code extension project (TypeScript + esbuild). It runs inside VS Code, not in a browser.

```bash
npm install
```

Then press `F5` in VS Code (or run the "Run Extension" launch config) to open an Extension Development Host with the extension loaded. Open the **Extension Wishlist** view from the Activity Bar.

## Commands

| Command | Description |
| --- | --- |
| `Extension Wishlist: Search Marketplace` | Open the search + wishlist panel |
| `Extension Wishlist: Add by Extension ID` | Wishlist an extension by its id |
| `Extension Wishlist: Install Extension` | Install a wishlisted extension |
| `Extension Wishlist: Remove from Wishlist` | Remove a saved extension |
| `Extension Wishlist: Clear Wishlist` | Remove everything |

## Packaging

```bash
npx @vscode/vsce package
```
