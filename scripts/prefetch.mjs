// Sierra Leone: Western Area (Freeton, Waterloo)
const SIERRA_LEONE_URL =
  "https://api.openaerialmap.org/meta?bbox=-13.45,8.25,-13.05,8.65&limit=100";

// Global data (no limit - fetch all)
const GLOBAL_URL =
  "https://api.openaerialmap.org/meta";

const SIERRA_LEONE_OUTPUT = new URL("../public/data-sierra-leone.json", import.meta.url);
const GLOBAL_OUTPUT = new URL("../public/data-global-1gb.json", import.meta.url);

function resolveField(item, keys) {
  for (const key of keys) {
    if (item && key in item && item[key] !== null && item[key] !== "") {
      return item[key];
    }
  }
  return null;
}

function removeGeometry(item) {
  delete item.geojson;
  delete item.bbox;
  delete item.footprint;
  return item;
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

function resolveAssetUrl(item) {
  const properties = item?.properties || {};
  const s3Url =
    resolveField(item, ["s3_path", "url", "download_url"]) ||
    resolveField(properties, ["s3_path", "url", "download_url"]);
  const uuid = resolveField(item, ["uuid"]) || resolveField(properties, ["uuid"]);
  return normalizeAssetUrl(s3Url || uuid || "");
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return await response.json();
}

async function fetchContentLength(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      return null;
    }
    const length = response.headers.get("content-length");
    if (!length) {
      return null;
    }
    const parsed = Number(length);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function enrichSizes(results, showIndicator = false) {
  const targets = results
    .map((item, index) => ({
      index,
      url: resolveAssetUrl(item)
    }))
    .filter((entry) => entry.url);

  const concurrency = 6;
  let cursor = 0;
  const MIN_SIZE_GB = 1 * 1024 * 1024 * 1024;

  const workers = Array.from({ length: concurrency }).map(async () => {
    while (cursor < targets.length) {
      const current = targets[cursor++];
      const size = await fetchContentLength(current.url);
      if (Number.isFinite(size) && size > 0) {
        results[current.index].file_size = size;
        if (results[current.index].properties) {
          results[current.index].properties.file_size = size;
        }
      }
      // Show progress: o for >= 1GB, x for < 1GB
      if (showIndicator) {
        const actualSize = Number.isFinite(size) ? size : results[current.index].file_size;
        const indicator = (actualSize || 0) >= MIN_SIZE_GB ? "o" : "x";
        process.stderr.write(indicator);
      } else {
        process.stderr.write(".");
      }
    }
  });

  await Promise.all(workers);
  process.stderr.write("\n");
}

async function main() {
  // Fetch Sierra Leone data
  console.log("Fetching Sierra Leone data...");
  const sierraLeoneData = await fetchJson(SIERRA_LEONE_URL);
  const sierraLeoneResults = Array.isArray(sierraLeoneData.results) ? sierraLeoneData.results : [];
  await enrichSizes(sierraLeoneResults, false);

  // Fetch global data with pagination
  console.log("Fetching global data (paginated)...");
  let globalResults = [];
  const globalMeta = {};
  const CHUNK_SIZE = 500;
  const MIN_SIZE = 1 * 1024 * 1024 * 1024;

  // First, get metadata to know total count
  const metaResponse = await fetchJson(`${GLOBAL_URL}?limit=1`);
  const totalFound = metaResponse.meta?.found || 19962;
  const totalPages = Math.ceil(totalFound / CHUNK_SIZE);
  globalMeta.meta = metaResponse.meta;

  console.log(`Total items: ${totalFound}, will fetch ${totalPages} pages of ${CHUNK_SIZE}...`);

  // Fetch pages in sequence
  for (let page = 1; page <= totalPages; page++) {
    try {
      const pageUrl = `${GLOBAL_URL}?limit=${CHUNK_SIZE}&page=${page}`;
      const pageData = await fetchJson(pageUrl);
      const pageResults = Array.isArray(pageData.results) ? pageData.results : [];
      
      if (!pageResults.length) {
        console.log(`Page ${page}: no results, stopping`);
        break;
      }

      console.log(`Page ${page}/${totalPages}: ${pageResults.length} items fetched, checking sizes...`);
      
      // Enrich sizes with 1GB indicator output
      await enrichSizes(pageResults, true);
      
      // Filter and add to results
      const filtered = pageResults.filter((item) => (item.file_size || 0) >= MIN_SIZE);
      globalResults.push(...filtered);
      
      console.log(`  → ${filtered.length}/${pageResults.length} >= 1GB (total so far: ${globalResults.length})`);
    } catch (e) {
      console.error(`Error fetching page ${page}:`, e.message);
      break;
    }
  }

  console.log(`\nGlobal data complete: ${globalResults.length} items >= 1GB`);

  // Prepare output
  await import("node:fs/promises").then((fs) =>
    fs.mkdir(new URL("../public/", import.meta.url), { recursive: true })
  );

  // Save Sierra Leone data
  const sierraLeoneOutput = {
    ...sierraLeoneData,
    results: sierraLeoneResults.map(removeGeometry)
  };
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(SIERRA_LEONE_OUTPUT, `${JSON.stringify(sierraLeoneOutput, null, 2)}\n`, "utf-8")
  );
  console.log(`Sierra Leone snapshot saved to ${SIERRA_LEONE_OUTPUT.pathname}`);

  // Save global data (with geometry removed)
  const globalOutput = {
    ...globalMeta,
    results: globalResults.map(removeGeometry),
    meta: {
      ...globalMeta.meta,
      note: "Filtered to items with file_size >= 1GB, geometry removed"
    }
  };
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(GLOBAL_OUTPUT, `${JSON.stringify(globalOutput, null, 2)}\n`, "utf-8")
  );
  console.log(`Global snapshot saved to ${GLOBAL_OUTPUT.pathname}`);
}

main().catch((error) => {
  console.error("Prefetch failed:", error.message || error);
  process.exitCode = 1;
});
