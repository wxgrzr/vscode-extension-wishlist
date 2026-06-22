import * as vscode from "vscode";
import { MarketplaceExtension, WishlistItem } from "./types";

const STORAGE_KEY = "extensionWishlist.items";

/**
 * Persists the wishlist in the extension's globalState. globalState is included
 * in VS Code Settings Sync, so the wishlist follows the user across machines.
 */
export class WishlistStore {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  /** Fires whenever the wishlist contents change. */
  public readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    // Opt the wishlist key into Settings Sync so it roams across devices.
    context.globalState.setKeysForSync([STORAGE_KEY]);
  }

  /** Returns all wishlist items, newest first. */
  public getAll(): WishlistItem[] {
    const items = this.context.globalState.get<WishlistItem[]>(STORAGE_KEY, []);
    return [...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  }

  /** Returns true if the given extension id is already wishlisted. */
  public has(extensionId: string): boolean {
    return this.getAll().some(
      (i) => i.extensionId.toLowerCase() === extensionId.toLowerCase()
    );
  }

  /** Adds an extension to the wishlist. No-op if already present. */
  public async add(extension: MarketplaceExtension): Promise<boolean> {
    if (this.has(extension.extensionId)) {
      return false;
    }
    const item: WishlistItem = {
      ...extension,
      addedAt: new Date().toISOString(),
    };
    const next = [...this.getRaw(), item];
    await this.persist(next);
    return true;
  }

  /** Removes an extension from the wishlist by id. */
  public async remove(extensionId: string): Promise<void> {
    const next = this.getRaw().filter(
      (i) => i.extensionId.toLowerCase() !== extensionId.toLowerCase()
    );
    await this.persist(next);
  }

  /** Updates the freeform note attached to a wishlist item. */
  public async setNote(extensionId: string, note: string): Promise<void> {
    const next = this.getRaw().map((i) =>
      i.extensionId.toLowerCase() === extensionId.toLowerCase()
        ? { ...i, note }
        : i
    );
    await this.persist(next);
  }

  /** Clears the entire wishlist. */
  public async clear(): Promise<void> {
    await this.persist([]);
  }

  private getRaw(): WishlistItem[] {
    return this.context.globalState.get<WishlistItem[]>(STORAGE_KEY, []);
  }

  private async persist(items: WishlistItem[]): Promise<void> {
    await this.context.globalState.update(STORAGE_KEY, items);
    this._onDidChange.fire();
  }
}
