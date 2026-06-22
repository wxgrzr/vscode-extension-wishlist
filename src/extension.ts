import * as vscode from "vscode";
import { WishlistStore } from "./storage";
import { WishlistTreeProvider, WishlistTreeItem } from "./wishlistTree";
import { MarketplacePanel } from "./webview";
import { getExtensionById } from "./marketplace";

export function activate(context: vscode.ExtensionContext): void {
  const store = new WishlistStore(context);
  const treeProvider = new WishlistTreeProvider(store);

  const treeView = vscode.window.createTreeView("extensionWishlist.list", {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);

  const register = (command: string, callback: (...args: any[]) => any) =>
    context.subscriptions.push(
      vscode.commands.registerCommand(command, callback)
    );

  // Open the marketplace search + wishlist webview.
  register("extensionWishlist.search", () => {
    MarketplacePanel.show(context, store);
  });

  // Refresh the tree view.
  register("extensionWishlist.refresh", () => {
    treeProvider.refresh();
  });

  // Open the webview focused on a specific wishlisted extension.
  register("extensionWishlist.openDetails", (node?: WishlistTreeItem) => {
    MarketplacePanel.show(context, store, node?.item.extensionId);
  });

  // Open the marketplace web page for an item (from the tree).
  register("extensionWishlist.openInMarketplace", (node?: WishlistTreeItem) => {
    if (!node) {
      return;
    }
    vscode.env.openExternal(vscode.Uri.parse(node.item.marketplaceUrl));
  });

  // Trigger a real install from the wishlist when the user decides to try it.
  register("extensionWishlist.install", async (node?: WishlistTreeItem) => {
    if (!node) {
      return;
    }
    await vscode.commands.executeCommand(
      "workbench.extensions.installExtension",
      node.item.extensionId
    );
    vscode.window.setStatusBarMessage(
      `Installing ${node.item.displayName}...`,
      3000
    );
  });

  // Remove an item from the wishlist.
  register("extensionWishlist.remove", async (node?: WishlistTreeItem) => {
    if (!node) {
      return;
    }
    await store.remove(node.item.extensionId);
  });

  // Add an extension to the wishlist by typing its id.
  register("extensionWishlist.addById", async () => {
    const id = await vscode.window.showInputBox({
      title: "Add extension to wishlist",
      prompt: "Enter the extension id (e.g. esbenp.prettier-vscode)",
      placeHolder: "publisher.extension",
      validateInput: (value) =>
        /^[^.\s]+\.[^.\s]+/.test(value.trim())
          ? undefined
          : "Use the format publisher.extension",
    });
    if (!id) {
      return;
    }
    const trimmed = id.trim();
    if (store.has(trimmed)) {
      vscode.window.showInformationMessage(
        `${trimmed} is already on your wishlist.`
      );
      return;
    }

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Looking up ${trimmed}...` },
      async () => {
        try {
          const ext = await getExtensionById(trimmed);
          if (!ext) {
            vscode.window.showErrorMessage(
              `Could not find "${trimmed}" on the Marketplace.`
            );
            return;
          }
          await store.add(ext);
          vscode.window.setStatusBarMessage(
            `Added ${ext.displayName} to your wishlist`,
            3000
          );
        } catch (err) {
          vscode.window.showErrorMessage(
            `Failed to look up extension: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    );
  });

  // Clear the whole wishlist with a confirmation.
  register("extensionWishlist.clearAll", async () => {
    const items = store.getAll();
    if (items.length === 0) {
      vscode.window.showInformationMessage("Your wishlist is already empty.");
      return;
    }
    const choice = await vscode.window.showWarningMessage(
      `Remove all ${items.length} extensions from your wishlist?`,
      { modal: true },
      "Clear Wishlist"
    );
    if (choice === "Clear Wishlist") {
      await store.clear();
    }
  });

  // Keep the view title count in sync with the wishlist size.
  const updateBadge = () => {
    const count = store.getAll().length;
    treeView.badge = count
      ? { value: count, tooltip: `${count} wishlisted extensions` }
      : undefined;
  };
  store.onDidChange(updateBadge);
  updateBadge();
}

export function deactivate(): void {
  // Nothing to clean up; disposables are handled via context.subscriptions.
}
