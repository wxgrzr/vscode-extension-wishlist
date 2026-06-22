/**
 * A single extension as returned from the Marketplace gallery API,
 * normalized to the fields we care about.
 */
export interface MarketplaceExtension {
  /** Canonical extension id, e.g. "esbenp.prettier-vscode" */
  extensionId: string;
  /** Short, url-safe name, e.g. "prettier-vscode" */
  extensionName: string;
  /** Human-friendly display name, e.g. "Prettier - Code formatter" */
  displayName: string;
  /** Publisher id, e.g. "esbenp" */
  publisher: string;
  /** Publisher display name, e.g. "Prettier" */
  publisherDisplayName: string;
  /** Short description shown in the marketplace */
  shortDescription: string;
  /** Latest version string, e.g. "10.1.0" */
  version: string;
  /** Total install count, if available */
  installs: number;
  /** Average star rating 0-5, if available */
  rating: number;
  /** Number of ratings */
  ratingCount: number;
  /** Icon image url, if available */
  iconUrl?: string;
  /** Marketplace web page url */
  marketplaceUrl: string;
}

/**
 * A wishlisted item: a marketplace extension plus local metadata.
 */
export interface WishlistItem extends MarketplaceExtension {
  /** ISO timestamp of when it was added to the wishlist */
  addedAt: string;
  /** Optional freeform note the user attaches */
  note?: string;
}
