import * as vscode from "vscode";
import { WishlistStore } from "./storage";
import { WishlistItem } from "./types";
import { formatInstalls } from "./marketplace";

/** Case-insensitive check for whether an extension is currently installed. */
function isInstalled(extensionId: string): boolean {
  const target = extensionId.toLowerCase();
  return vscode.extensions.all.some((e) => e.id.toLowerCase() === target);
}

/** A tree node wrapping a single wishlist item. */
export class WishlistTreeItem extends vscode.TreeItem {
  constructor(
    public readonly item: WishlistItem,
    public readonly installed: boolean
  ) {
    super(item.displayName, vscode.TreeItemCollapsibleState.None);

    this.id = item.extensionId;
    // contextValue drives which inline/context actions show for this item.
    this.contextValue = installed
      ? "wishlistItem.installed"
      : "wishlistItem.notInstalled";

    if (installed) {
      // A filled check makes installed items obvious at a glance.
      this.iconPath = new vscode.ThemeIcon(
        "check",
        new vscode.ThemeColor("testing.iconPassed")
      );
      this.description = `Installed · ${item.publisherDisplayName}`;
    } else {
      this.iconPath = item.iconUrl
        ? vscode.Uri.parse(item.iconUrl)
        : new vscode.ThemeIcon("extensions");
      const installs = formatInstalls(item.installs);
      const rating = item.rating ? `${item.rating.toFixed(1)}★` : "unrated";
      this.description = `${item.publisherDisplayName} · ${installs} installs · ${rating}`;
    }

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${item.displayName}**\n\n`);
    md.appendMarkdown(`${item.shortDescription || "_No description_"}\n\n`);
    md.appendMarkdown(`\`${item.extensionId}\` · v${item.version}\n\n`);
    if (installed) {
      md.appendMarkdown(`✓ _Installed_\n\n`);
    }
    if (item.note) {
      md.appendMarkdown(`---\n\n_Note:_ ${item.note}`);
    }
    this.tooltip = md;

    // Single click opens the extension's page inside VS Code, where the user
    // can read details and install/uninstall using native UI.
    this.command = {
      command: "extensionWishlist.open",
      title: "Open Extension",
      arguments: [item.extensionId],
    };
  }
}

/** Provides the wishlist items to the sidebar tree view. */
export class WishlistTreeProvider
  implements vscode.TreeDataProvider<WishlistTreeItem>
{
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly store: WishlistStore) {
    store.onDidChange(() => this._onDidChangeTreeData.fire());
    // Reflect install/uninstall changes (from anywhere in VS Code) in the tree.
    vscode.extensions.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: WishlistTreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(): WishlistTreeItem[] {
    return this.store
      .getAll()
      .map((item) => new WishlistTreeItem(item, isInstalled(item.extensionId)));
  }
}
