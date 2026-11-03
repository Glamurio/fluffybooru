import { ajax } from "discourse/lib/ajax";

// Search results (/search) carry no image data, unlike topic lists. This looks the
// images up with the same request topic lists use: /latest.json?topic_ids=1,2,3 returns
// those topics with image_url and thumbnails (30 per request, only topics the person may
// see). Results are cached for the page session.

const CHUNK = 30;
const cache = new Map(); // topic id -> { url, width, height } | null (no image)
const inFlight = new Set();

// the smallest generated thumbnail that is at least `size` wide, else the largest
function pick(topic, size) {
  const thumbs = (topic.thumbnails || [])
    .filter((t) => t.url && t.width)
    .sort((a, b) => a.width - b.width);

  const best = thumbs.find((t) => t.width >= size) || thumbs[thumbs.length - 1];
  if (best) {
    return { url: best.url, width: best.width, height: best.height };
  }
  return topic.image_url ? { url: topic.image_url } : null;
}

async function fetchChunk(ids, size) {
  ids.forEach((id) => inFlight.add(id));
  try {
    const result = await ajax("/latest.json", {
      data: { topic_ids: ids.join(","), no_definitions: true },
    });
    const topics = result?.topic_list?.topics || [];
    for (const id of ids) {
      const topic = topics.find((t) => t.id === id);
      cache.set(id, topic ? pick(topic, size) : null);
    }
  } catch {
    // leave them out of the cache so a later pass can retry
  } finally {
    ids.forEach((id) => inFlight.delete(id));
  }
}

function thumbnailElement(id, info, size) {
  const link = document.createElement("a");
  link.className = "fcom-search-thumb";
  link.href = `/t/${id}`;
  link.tabIndex = -1;
  link.setAttribute("aria-hidden", "true");

  const img = document.createElement("img");
  img.src = info.url;
  img.alt = "";
  img.loading = "lazy";
  img.decoding = "async";
  img.width = size;
  img.height = size;
  link.append(img);
  return link;
}

export async function addSearchThumbnails(size) {
  const entries = [...document.querySelectorAll(".search-results .fps-result")]
    .map((entry) => ({
      entry,
      id: parseInt(entry.querySelector(".fps-topic")?.dataset.topicId, 10),
    }))
    .filter(({ entry, id }) => !Number.isNaN(id) && !entry.querySelector(".fcom-search-thumb"));

  const missing = [
    ...new Set(
      entries.map(({ id }) => id).filter((id) => !cache.has(id) && !inFlight.has(id))
    ),
  ];
  const chunks = [];
  for (let i = 0; i < missing.length; i += CHUNK) {
    chunks.push(missing.slice(i, i + CHUNK));
  }
  await Promise.all(chunks.map((ids) => fetchChunk(ids, size)));

  for (const { entry, id } of entries) {
    const info = cache.get(id);
    // the entry may have been re-rendered while the request ran
    if (info && entry.isConnected && !entry.querySelector(".fcom-search-thumb")) {
      entry.append(thumbnailElement(id, info, size));
    }
  }
}
