import { MarketplaceExtension } from "./types";

const GALLERY_ENDPOINT =
  "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery";

// Flags requested from the gallery API (bitmask). We ask for the latest
// version, asset URIs, statistics and basic metadata.
const FLAGS =
  0x1 /* IncludeVersions */ |
  0x2 /* IncludeFiles */ |
  0x4 /* IncludeCategoryAndTags */ |
  0x10 /* IncludeVersionProperties */ |
  0x100 /* IncludeStatistics */ |
  0x200; /* IncludeLatestVersionOnly */

// Filter type constants for the gallery "criteria".
const FILTER_EXTENSION_NAME = 7;
const FILTER_TARGET = 8;
const FILTER_EXCLUDE_FLAGS = 12;

const ICON_ASSET_TYPE = "Microsoft.VisualStudio.Services.Icons.Default";

interface GalleryStatistic {
  statisticName: string;
  value: number;
}

interface GalleryFile {
  assetType: string;
  source: string;
}

interface GalleryVersion {
  version: string;
  files?: GalleryFile[];
}

interface GalleryPublisher {
  publisherName: string;
  displayName: string;
}

interface GalleryExtension {
  extensionName: string;
  displayName: string;
  shortDescription?: string;
  publisher: GalleryPublisher;
  versions?: GalleryVersion[];
  statistics?: GalleryStatistic[];
}

interface GalleryResponse {
  results: Array<{ extensions: GalleryExtension[] }>;
}

function statValue(stats: GalleryStatistic[] | undefined, name: string): number {
  return stats?.find((s) => s.statisticName === name)?.value ?? 0;
}

function normalize(ext: GalleryExtension): MarketplaceExtension {
  const publisher = ext.publisher.publisherName;
  const extensionId = `${publisher}.${ext.extensionName}`;
  const latest = ext.versions?.[0];
  const iconUrl = latest?.files?.find((f) => f.assetType === ICON_ASSET_TYPE)
    ?.source;

  return {
    extensionId,
    extensionName: ext.extensionName,
    displayName: ext.displayName || ext.extensionName,
    publisher,
    publisherDisplayName: ext.publisher.displayName || publisher,
    shortDescription: ext.shortDescription ?? "",
    version: latest?.version ?? "",
    installs: statValue(ext.statistics, "install"),
    rating: statValue(ext.statistics, "averagerating"),
    ratingCount: statValue(ext.statistics, "ratingcount"),
    iconUrl,
    marketplaceUrl: `https://marketplace.visualstudio.com/items?itemName=${extensionId}`,
  };
}

async function query(criteria: Array<{ filterType: number; value: string }>, pageSize: number): Promise<MarketplaceExtension[]> {
  const body = {
    filters: [
      {
        criteria: [
          // Restrict to the VS Code marketplace target.
          { filterType: FILTER_TARGET, value: "Microsoft.VisualStudio.Code" },
          // Exclude unpublished (0x1000) extensions.
          { filterType: FILTER_EXCLUDE_FLAGS, value: "4096" },
          ...criteria,
        ],
        pageNumber: 1,
        pageSize,
        sortBy: 0,
        sortOrder: 0,
      },
    ],
    assetTypes: [ICON_ASSET_TYPE],
    flags: FLAGS,
  };

  const res = await fetch(GALLERY_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json;api-version=3.0-preview.1",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `Marketplace request failed: ${res.status} ${res.statusText}`
    );
  }

  const data = (await res.json()) as GalleryResponse;
  const extensions = data.results?.[0]?.extensions ?? [];
  return extensions.map(normalize);
}

/** Look up a single extension by its canonical id (publisher.name). */
export async function getExtensionById(
  extensionId: string
): Promise<MarketplaceExtension | undefined> {
  const results = await query(
    [{ filterType: FILTER_EXTENSION_NAME, value: extensionId }],
    1
  );
  // Confirm the returned id actually matches what was requested.
  return results.find(
    (r) => r.extensionId.toLowerCase() === extensionId.toLowerCase()
  );
}

/** Formats an install count into a compact human-readable string. */
export function formatInstalls(installs: number): string {
  if (installs >= 1_000_000) {
    return `${(installs / 1_000_000).toFixed(1)}M`;
  }
  if (installs >= 1_000) {
    return `${(installs / 1_000).toFixed(1)}K`;
  }
  return String(installs);
}
