# Extension Wishlist

A VS Code extension that lets you bookmark Marketplace extensions to a wishlist so you can try them later — without being forced to install and download them now.

## Features

- **Add from the native Extensions view** — right-click any extension and choose **Add to Wishlist**. No custom search UI; it stays out of the way of VS Code's built-in Marketplace.
- **Wishlist instead of install** — saved extensions aren't downloaded until you decide to try them.
- **Sidebar tree view** in the Activity Bar listing everything you've saved, with a count badge. Click an item to open its page **inside VS Code**, where you can install it with the native UI.
- **Installed at a glance** — once a wishlisted extension is installed, its row shows a ✓ "Installed" marker and an inline **Uninstall** action.
- **Add by ID** for extensions you already know (e.g. `esbenp.prettier-vscode`).
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
| `Extension Wishlist: Add to Wishlist` | Right-click an extension in the Extensions view to save it |
| `Extension Wishlist: Add by Extension ID` | Wishlist an extension by its id |
| `Extension Wishlist: Open Extension Page` | Open a wishlisted extension's page in VS Code |
| `Extension Wishlist: Uninstall Extension` | Uninstall an installed wishlisted extension |
| `Extension Wishlist: Remove from Wishlist` | Remove a saved extension |
| `Extension Wishlist: Clear Wishlist` | Remove everything |

## Packaging

```bash
npx @vscode/vsce package
```
