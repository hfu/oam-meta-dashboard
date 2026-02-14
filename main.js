const DATA_URL = "./data.json";

const elements = {
  sortSelect: document.getElementById("sortSelect"),
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  cardGrid: document.getElementById("cardGrid"),
  assetCount: document.getElementById("assetCount"),
  totalSize: document.getElementById("totalSize")
};

const state = {
  assets: [],
  isLoading: false,
  requestId: 0
};

const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit"
});

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function fetchSnapshot() {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Snapshot not found: ${response.status}`);
  }
  return await response.json();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "N/A";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(2)} ${units[index]}`;
}

function normalizeAssetUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }
  if (value.startsWith("s3://")) {
    const trimmed = value.replace("s3://", "");
    const parts = trimmed.split("/");
    const bucket = parts.shift();
    const key = parts.join("/");
    if (bucket && key) {
      return `https://${bucket}.s3.amazonaws.com/${key}`;
    }
  }
  return value;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const parsed = parseDate(value);
  return parsed ? formatter.format(parsed) : "Unknown";
}

function normalizeResolution(value) {
  if (!value && value !== 0) {
    return "N/A";
  }
  const numeric = Array.isArray(value)
    ? Number(value[0])
    : typeof value === "number"
      ? value
      : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "N/A";
  }
  const cm = Math.round(numeric * 100);
  return `${cm} cm`;
}

function resolveField(item, keys) {
  for (const key of keys) {
    if (item && key in item && item[key] !== null && item[key] !== "") {
      return item[key];
    }
  }
  return null;
}

function mapAsset(item) {
  const properties = item?.properties || {};
  const title =
    resolveField(item, ["title", "name"]) ||
    resolveField(properties, ["title", "name"]);
  const acquisitionStart =
    resolveField(item, ["acquisition_start"]) ||
    resolveField(properties, ["acquisition_start", "datetime"]);
  const platform =
    resolveField(item, ["platform"]) ||
    resolveField(properties, ["platform", "platform_name"]);
  const provider =
    resolveField(item, ["provider"]) ||
    resolveField(properties, ["provider"]);
  const resolution =
    resolveField(item, ["resolution"]) ||
    resolveField(properties, ["gsd", "resolution"]);
  const fileSize =
    resolveField(item, ["file_size"]) ||
    resolveField(properties, ["file_size"]);
  const uuid = resolveField(item, ["uuid"]) || resolveField(properties, ["uuid"]);
  const s3Url =
    resolveField(item, ["s3_path", "url", "download_url"]) ||
    resolveField(properties, ["s3_path", "url", "download_url"]);
  const thumbnail =
    resolveField(item, ["thumbnail", "thumbnail_url"]) ||
    resolveField(properties, ["thumbnail", "thumbnail_url"]);
  const assetUrl = normalizeAssetUrl(s3Url || uuid || "");

  return {
    title: title || "Untitled asset",
    acquisitionStart,
    platform: platform || "Unknown",
    provider: provider || "Unknown",
    resolution: normalizeResolution(resolution),
    fileSizeBytes: typeof fileSize === "number" ? fileSize : Number(fileSize),
    uuid: uuid || "Unknown",
    assetUrl,
    thumbnail: thumbnail || "",
    hasKnownSize: Number.isFinite(Number(fileSize)) && Number(fileSize) > 0
  };
}

function sortAssets(assets) {
  const sortValue = elements.sortSelect.value;
  const sorted = [...assets];

  sorted.sort((a, b) => {
    if (sortValue.startsWith("date")) {
      const aTime = parseDate(a.acquisitionStart)?.getTime();
      const bTime = parseDate(b.acquisitionStart)?.getTime();
      const aKnown = Number.isFinite(aTime);
      const bKnown = Number.isFinite(bTime);

      if (aKnown !== bKnown) {
        return aKnown ? -1 : 1;
      }

      const aDate = aTime || 0;
      const bDate = bTime || 0;
      return sortValue === "date-asc" ? aDate - bDate : bDate - aDate;
    }

    const aKnown = Number.isFinite(a.fileSizeBytes);
    const bKnown = Number.isFinite(b.fileSizeBytes);

    if (aKnown !== bKnown) {
      return aKnown ? -1 : 1;
    }

    const aSize = a.fileSizeBytes || 0;
    const bSize = b.fileSizeBytes || 0;
    return sortValue === "size-asc" ? aSize - bSize : bSize - aSize;
  });

  return sorted;
}

function renderStats(assets) {
  const total = assets.reduce((sum, asset) => {
    if (Number.isFinite(asset.fileSizeBytes)) {
      return sum + asset.fileSizeBytes;
    }
    return sum;
  }, 0);

  const known = assets.filter((asset) => Number.isFinite(asset.fileSizeBytes))
    .length;

  elements.assetCount.textContent = `${assets.length}`;
  elements.totalSize.textContent =
    assets.length === 0
      ? "-"
      : `${formatBytes(total)} (known ${known}/${assets.length})`;
}

function createMetaRow(label, value) {
  const row = document.createElement("div");
  row.innerHTML = `${label}: <span>${value}</span>`;
  return row;
}

function renderCards(assets) {
  elements.cardGrid.innerHTML = "";

  if (!assets.length) {
    const empty = document.createElement("p");
    empty.textContent = "No assets found.";
    elements.cardGrid.appendChild(empty);
    return;
  }

  for (const asset of assets) {
    const card = document.createElement("article");
    card.className = "card";

    if (asset.thumbnail && isValidUrl(asset.thumbnail)) {
      const img = document.createElement("img");
      img.src = asset.thumbnail;
      img.alt = "Asset thumbnail";
      img.loading = "lazy";
      card.appendChild(img);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("div");
    title.className = "card-title";
    const titleText = document.createElement("span");
    titleText.textContent = asset.title;
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = asset.platform;
    title.appendChild(titleText);
    title.appendChild(badge);
    body.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.appendChild(createMetaRow("Date", formatDate(asset.acquisitionStart)));
    meta.appendChild(createMetaRow("Provider", asset.provider));
    meta.appendChild(createMetaRow("Resolution", asset.resolution));
    meta.appendChild(
      createMetaRow("File size", formatBytes(asset.fileSizeBytes))
    );
    if (asset.uuid && asset.uuid !== "Unknown" && isValidUrl(asset.uuid)) {
      const row = document.createElement("div");
      row.innerHTML = "UUID: ";
      const link = document.createElement("a");
      link.href = asset.uuid;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = asset.uuid;
      row.appendChild(link);
      meta.appendChild(row);
    } else {
      meta.appendChild(createMetaRow("UUID", asset.uuid));
    }
    body.appendChild(meta);
    card.appendChild(body);

    elements.cardGrid.appendChild(card);
  }
}

function renderAll() {
  const sorted = sortAssets(state.assets);
  renderStats(sorted);
  renderCards(sorted);
}

function setLoading(isLoading, message = "Loading...") {
  state.isLoading = isLoading;
  elements.loading.textContent = message;
  elements.loading.style.display = isLoading ? "block" : "none";
}

function setError(message) {
  elements.error.textContent = message;
  elements.error.style.display = message ? "block" : "none";
}

async function loadAssets() {
  const requestId = ++state.requestId;

  setError("");
  setLoading(true, "Loading snapshot...");

  try {
    const data = await fetchSnapshot();
    const results = Array.isArray(data.results) ? data.results : [];
    state.assets = results.map(mapAsset);

    renderAll();

    setLoading(false);
  } catch (error) {
    if (requestId !== state.requestId) {
      return;
    }
    setLoading(false);
    setError(error.message || "Failed to load data.");
    state.assets = [];
    renderAll();
  }
}

function init() {
  elements.sortSelect.addEventListener("change", renderAll);

  void loadAssets();
}

init();
