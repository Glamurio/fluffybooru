import { ajax } from "discourse/lib/ajax";

let pending;

function hiddenTags() {
  return new Set((settings.hidden_tags || "").split("|").filter(Boolean));
}

// All tags with site-wide topic counts. One request per page load.
export function loadBooruTags() {
  if (!pending) {
    pending = ajax("/tags.json")
      .then((result) => {
        const hidden = hiddenTags();
        return (result.tags || [])
          .filter(
            (tag) =>
              !tag.pm_only &&
              !hidden.has(tag.name) &&
              tag.count >= settings.min_tag_count
          )
          .map((tag) => ({ name: tag.name, count: tag.count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      })
      .catch((error) => {
        pending = null; // allow a retry on the next render
        throw error;
      });
  }
  return pending;
}

// Tag counts among the topics a /filter search lists. Needs the discourse-sorting
// plugin; rejects (404) without it, and the sidebar then keeps the site-wide counts.
export async function loadScopedTags(query) {
  const hidden = hiddenTags();
  const result = await ajax("/discourse-sorting/tag-counts.json", {
    data: { q: query },
  });
  return (result.tags || []).filter((tag) => !hidden.has(tag.name));
}
