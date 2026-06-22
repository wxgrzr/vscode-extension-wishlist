import * as vscode from "vscode";
import { WishlistStore } from "./storage";
import { WishlistItem } from "./types";
import { formatInstalls } from "./marketplace";

/** A tree node wrapping a single wishlist item. */
export class WishlistTreeItem extends vscode.TreeItem {
  constructor(public readonly item: WishlistItem) {
    super(item.displayName, vscode.TreeItemCollapsibleState.None);

    this.id = item.extensionId;
    this.contextValue = "wishlistItem";
    this.iconPath = item.iconUrl
      ? vscode.Uri.parse(item.iconUrl)
      : new vscode.ThemeIcon("extensions");

    const installs = formatInstalls(item.installs);
    const rating = item.rating ? `${item.rating.toFixed(1)}★` : "unrated";
    this.description = `${item.publisherDisplayName} · ${installs} installs · ${rating}`;

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**${item.displayName}**\n\n`);
    md.appendMarkdown(`${item.shortDescription || "_No description_"}\n\n`);
    md.appendMarkdown(`\`${item.extensionId}\` · v${item.version}\n\n`);
    if (item.note) {
      md.appendMarkdown(`---\n\n_Note:_ ${item.note}`);
    }
    this.tooltip = md;

    // Single click opens the details webview.
    this.command = {
      command: "extensionWishlist.openDetails",
      title: "Open Details",
      arguments: [this],
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
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: WishlistTreeItem): vscode.TreeItem {
    return element;
  }

  public getChildren(): WishlistTreeItem[] {
    return this.store.getAll().map((item) => new WishlistTreeItem(item));
  }
}
