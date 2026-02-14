const DEFAULT_URL =
  "https://api.openaerialmap.org/meta?bbox=-13.45,8.25,-13.05,8.65&limit=100";

const OUTPUT_PATH = new URL("../public/data.json", import.meta.url);

function resolveField(item, keys) {
  for (const key of keys) {
    if (item && key in item && item[key] !== null && item[key] !== "") {
      return item[key];
    }
  }
  return null;
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

async function enrichSizes(results) {
  const targets = results
    .map((item, index) => ({
      index,
      url: resolveAssetUrl(item)
    }))
    .filter((entry) => entry.url);

  const concurrency = 6;
  let cursor = 0;

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
    }
  });

  await Promise.all(workers);
}

async function main() {
  const data = await fetchJson(DEFAULT_URL);
  const results = Array.isArray(data.results) ? data.results : [];

  await enrichSizes(results);

  await import("node:fs/promises").then((fs) =>
    fs.mkdir(new URL("../public/", import.meta.url), { recursive: true })
  );

  await import("node:fs/promises").then((fs) =>
    fs.writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf-8")
  );

  console.log(`Snapshot saved to ${OUTPUT_PATH.pathname}`);
}

main().catch((error) => {
  console.error("Prefetch failed:", error.message || error);
  process.exitCode = 1;
});
