import * as vscode from "vscode";
import { WishlistStore } from "./storage";
import { searchMarketplace } from "./marketplace";
import { MarketplaceExtension } from "./types";

type Inbound =
  | { type: "search"; query: string }
  | { type: "wishlistAdd"; extension: MarketplaceExtension }
  | { type: "wishlistRemove"; extensionId: string }
  | { type: "openMarketplace"; extensionId: string }
  | { type: "openExtension"; extensionId: string }
  | { type: "install"; extensionId: string }
  | { type: "uninstall"; extensionId: string }
  | { type: "ready" }
  | { type: "focusItem"; extensionId: string };

/**
 * Manages the single "Marketplace + Wishlist" webview panel. The panel lets
 * users search the marketplace, see which results are already wishlisted,
 * and add/remove items. It stays in sync with the store.
 */
export class MarketplacePanel {
  public static readonly viewType = "extensionWishlist.panel";
  private static current: MarketplacePanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  public static show(
    context: vscode.ExtensionContext,
    store: WishlistStore,
    focusExtensionId?: string
  ): void {
    const column = vscode.ViewColumn.Active;
    if (MarketplacePanel.current) {
      MarketplacePanel.current.panel.reveal(column);
      if (focusExtensionId) {
        MarketplacePanel.current.post({ type: "focusItem", extensionId: focusExtensionId });
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      MarketplacePanel.viewType,
      "Extension Wishlist",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
      }
    );

    MarketplacePanel.current = new MarketplacePanel(
      panel,
      context,
      store,
      focusExtensionId
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext,
    private readonly store: WishlistStore,
    private readonly focusExtensionId?: string
  ) {
    this.panel = panel;
    this.panel.iconPath = vscode.Uri.joinPath(
      context.extensionUri,
      "media",
      "wishlist.svg"
    );
    this.panel.webview.html = this.render();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (msg: Inbound) => this.handleMessage(msg),
      null,
      this.disposables
    );

    // Keep webview wishlist state in sync with the store.
    this.store.onDidChange(
      () => this.postWishlistIds(),
      null,
      this.disposables
    );

    // Keep webview install state in sync as extensions are installed/removed.
    vscode.extensions.onDidChange(
      () => this.postInstalledIds(),
      null,
      this.disposables
    );
  }

  private async handleMessage(msg: Inbound): Promise<void> {
    switch (msg.type) {
      case "ready": {
        this.postWishlistIds();
        this.postInstalledIds();
        if (this.focusExtensionId) {
          this.post({ type: "focusItem", extensionId: this.focusExtensionId });
        }
        break;
      }
      case "search": {
        try {
          const results = await searchMarketplace(msg.query);
          this.post({ type: "results", results });
        } catch (err) {
          this.post({
            type: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
        break;
      }
      case "wishlistAdd": {
        const added = await this.store.add(msg.extension);
        if (added) {
          vscode.window.setStatusBarMessage(
            `Added ${msg.extension.displayName} to your wishlist`,
            3000
          );
        }
        break;
      }
      case "wishlistRemove": {
        await this.store.remove(msg.extensionId);
        break;
      }
      case "openMarketplace": {
        vscode.env.openExternal(
          vscode.Uri.parse(
            `https://marketplace.visualstudio.com/items?itemName=${msg.extensionId}`
          )
        );
        break;
      }
      case "openExtension": {
        // Open the extension's details page inside VS Code (works for
        // gallery extensions that aren't installed yet).
        await vscode.commands.executeCommand(
          "extension.open",
          msg.extensionId
        );
        break;
      }
      case "install": {
        vscode.window.setStatusBarMessage(
          `Installing ${msg.extensionId}...`,
          3000
        );
        await vscode.commands.executeCommand(
          "workbench.extensions.installExtension",
          msg.extensionId
        );
        this.postInstalledIds();
        break;
      }
      case "uninstall": {
        vscode.window.setStatusBarMessage(
          `Uninstalling ${msg.extensionId}...`,
          3000
        );
        await vscode.commands.executeCommand(
          "workbench.extensions.uninstallExtension",
          msg.extensionId
        );
        this.postInstalledIds();
        break;
      }
    }
  }

  private postInstalledIds(): void {
    this.post({
      type: "installedIds",
      ids: vscode.extensions.all.map((e) => e.id.toLowerCase()),
    });
  }

  private postWishlistIds(): void {
    this.post({
      type: "wishlistIds",
      ids: this.store.getAll().map((i) => i.extensionId),
    });
  }

  private post(message: unknown): void {
    this.panel.webview.postMessage(message);
  }

  private dispose(): void {
    MarketplacePanel.current = undefined;
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }

  private render(): string {
    const nonce = getNonce();
    const csp = [
      `default-src 'none'`,
      `img-src https: data:`,
      `style-src 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `connect-src https:`,
    ].join("; ");

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Extension Wishlist</title>
<style>${styles()}</style>
</head>
<body>
  <header class="topbar">
    <div class="search">
      <input id="q" type="search" placeholder="Search the VS Code Marketplace..." autofocus aria-label="Search the Marketplace" />
      <button id="searchBtn" type="button">Search</button>
    </div>
    <p class="hint">Bookmark extensions to try later — nothing gets installed until you choose to.</p>
  </header>
  <main id="results" class="grid" aria-live="polite"></main>
  <div id="status" class="status"></div>
<script nonce="${nonce}">${script()}</script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function styles(): string {
  return /* css */ `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
  }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 16px 20px 12px;
    background: var(--vscode-editor-background);
    border-bottom: 1px solid var(--vscode-panel-border);
  }
  .search { display: flex; gap: 8px; align-items: center; }
  #q {
    flex: 1;
    padding: 8px 10px;
    color: var(--vscode-input-foreground);
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border, transparent);
    border-radius: 4px;
    outline: none;
  }
  #q:focus { border-color: var(--vscode-focusBorder); }
  button {
    padding: 8px 14px;
    color: var(--vscode-button-foreground);
    background: var(--vscode-button-background);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
  }
  button:hover { background: var(--vscode-button-hoverBackground); }
  button.secondary {
    color: var(--vscode-button-secondaryForeground);
    background: var(--vscode-button-secondaryBackground);
  }
  button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
  .hint { margin: 8px 0 0; font-size: 12px; color: var(--vscode-descriptionForeground); }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 14px;
    padding: 18px 20px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
  }
  .card-head { display: flex; gap: 12px; align-items: flex-start; }
  .card-icon {
    width: 42px; height: 42px; border-radius: 8px; flex: none;
    object-fit: contain; background: var(--vscode-editor-background);
  }
  .card-title { font-weight: 600; line-height: 1.3; cursor: pointer; display: inline-block; }
  .card-title:hover { color: var(--vscode-textLink-foreground); text-decoration: underline; }
  .card-title:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
  .card-pub { font-size: 12px; color: var(--vscode-descriptionForeground); }
  .card-desc {
    font-size: 13px; line-height: 1.5; color: var(--vscode-foreground);
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .meta { display: flex; gap: 14px; font-size: 12px; color: var(--vscode-descriptionForeground); }
  .actions { display: flex; gap: 8px; margin-top: auto; }
  .actions button { flex: 1; font-size: 12px; padding: 6px 10px; }
  .saved .wish-btn { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
  .empty, .status {
    padding: 24px 20px; color: var(--vscode-descriptionForeground); text-align: center;
  }
  .status { padding: 0 20px 24px; }
  .error { color: var(--vscode-errorForeground); }
  .highlight { outline: 2px solid var(--vscode-focusBorder); outline-offset: 2px; }
  `;
}

function script(): string {
  return /* js */ `
  const vscode = acquireVsCodeApi();
  const q = document.getElementById('q');
  const searchBtn = document.getElementById('searchBtn');
  const resultsEl = document.getElementById('results');
  const statusEl = document.getElementById('status');
  let wishlistIds = new Set();
  let installedIds = new Set();
  let lastResults = [];

  function formatInstalls(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n || 0);
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    if (!lastResults.length) {
      resultsEl.innerHTML = '<div class="empty">Search the Marketplace to start building your wishlist.</div>';
      return;
    }
    resultsEl.innerHTML = lastResults.map(function (e) {
      const saved = wishlistIds.has(e.extensionId);
      const installed = installedIds.has(String(e.extensionId).toLowerCase());
      const icon = e.iconUrl
        ? '<img class="card-icon" src="' + esc(e.iconUrl) + '" alt="" />'
        : '<div class="card-icon"></div>';
      const rating = e.rating ? e.rating.toFixed(1) + '\u2605' : 'unrated';
      return '<article class="card ' + (saved ? 'saved' : '') + '" data-id="' + esc(e.extensionId) + '">' +
        '<div class="card-head">' + icon +
          '<div><div class="card-title" data-act="open" role="link" tabindex="0" title="Open in VS Code">' + esc(e.displayName) + '</div>' +
          '<div class="card-pub">' + esc(e.publisherDisplayName) + '</div></div>' +
        '</div>' +
        '<div class="card-desc">' + esc(e.shortDescription) + '</div>' +
        '<div class="meta"><span>' + formatInstalls(e.installs) + ' installs</span>' +
          '<span>' + rating + '</span><span>v' + esc(e.version) + '</span></div>' +
        '<div class="actions">' +
          '<button class="wish-btn" data-act="wish">' + (saved ? 'Remove from Wishlist' : 'Add to Wishlist') + '</button>' +
          '<button class="secondary" data-act="market">Marketplace</button>' +
          (installed
            ? '<button class="secondary" data-act="uninstall">Uninstall</button>'
            : '<button class="secondary" data-act="install">Install</button>') +
        '</div>' +
      '</article>';
    }).join('');
  }

  function doSearch() {
    const query = q.value.trim();
    if (!query) return;
    statusEl.textContent = 'Searching...';
    statusEl.className = 'status';
    vscode.postMessage({ type: 'search', query: query });
  }

  searchBtn.addEventListener('click', doSearch);
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });

  function handleAction(target) {
    const actEl = target.closest('[data-act]');
    if (!actEl) return;
    const card = target.closest('.card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    const ext = lastResults.find(function (x) { return x.extensionId === id; });
    const act = actEl.getAttribute('data-act');
    if (act === 'wish') {
      if (wishlistIds.has(id)) {
        vscode.postMessage({ type: 'wishlistRemove', extensionId: id });
      } else if (ext) {
        vscode.postMessage({ type: 'wishlistAdd', extension: ext });
      }
    } else if (act === 'market') {
      vscode.postMessage({ type: 'openMarketplace', extensionId: id });
    } else if (act === 'install') {
      vscode.postMessage({ type: 'install', extensionId: id });
    } else if (act === 'uninstall') {
      vscode.postMessage({ type: 'uninstall', extensionId: id });
    } else if (act === 'open') {
      vscode.postMessage({ type: 'openExtension', extensionId: id });
    }
  }

  resultsEl.addEventListener('click', function (e) { handleAction(e.target); });
  resultsEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (!e.target.closest('.card-title')) return;
    e.preventDefault();
    handleAction(e.target);
  });

  window.addEventListener('message', function (event) {
    const msg = event.data;
    if (msg.type === 'results') {
      lastResults = msg.results;
      statusEl.textContent = msg.results.length ? '' : 'No extensions found.';
      render();
    } else if (msg.type === 'wishlistIds') {
      wishlistIds = new Set(msg.ids);
      render();
    } else if (msg.type === 'installedIds') {
      installedIds = new Set(msg.ids);
      render();
    } else if (msg.type === 'error') {
      statusEl.textContent = 'Error: ' + msg.message;
      statusEl.className = 'status error';
    } else if (msg.type === 'focusItem') {
      q.value = msg.extensionId;
      doSearch();
    }
  });

  render();
  vscode.postMessage({ type: 'ready' });
  `;
}
