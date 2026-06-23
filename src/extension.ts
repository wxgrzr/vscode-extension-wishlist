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
    await addExtensionToWishlist(store, id);
  });

  // Add to wishlist from the built-in Extensions view right-click menu.
  // VS Code passes the selected extension to commands contributed to
  // `extension/context`; the shape can be a string id or an object, so
  // we normalize it before looking the extension up.
  register("extensionWishlist.addFromMarketplace", async (arg?: unknown) => {
    const id = extractExtensionId(arg);
    if (!id) {
      vscode.window.showErrorMessage(
        "Could not determine which extension to add to your wishlist."
      );
      return;
    }
    await addExtensionToWishlist(store, id);
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

/**
 * Looks an extension up on the Marketplace by id and adds it to the wishlist,
 * showing progress and result feedback. No-op if it is already wishlisted.
 */
async function addExtensionToWishlist(
  store: WishlistStore,
  extensionId: string
): Promise<void> {
  const trimmed = extensionId.trim();
  if (!trimmed) {
    return;
  }
  if (store.has(trimmed)) {
    vscode.window.showInformationMessage(
      `${trimmed} is already on your wishlist.`
    );
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Looking up ${trimmed}...`,
    },
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
}

/**
 * Normalizes the argument VS Code passes to an `extension/context` command
 * into a canonical extension id. Depending on the invocation, this can be a
 * plain id string or an object carrying the identifier.
 */
function extractExtensionId(arg: unknown): string | undefined {
  if (typeof arg === "string") {
    return arg;
  }
  if (arg && typeof arg === "object") {
    const obj = arg as Record<string, any>;
    const candidate =
      obj.extensionId ??
      obj.id ??
      obj.identifier?.id ??
      obj.identifier?.value;
    if (typeof candidate === "string") {
      return candidate;
    }
  }
  return undefined;
}
