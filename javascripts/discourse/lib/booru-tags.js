import { ajax } from "discourse/lib/ajax";

let pending;
let pendingRestricted;

function hiddenTags() {
  return new Set((settings.hidden_tags || "").split("|").filter(Boolean));
}

// Tags reserved for members of certain groups (a tag group whose permissions let only
// some groups use its tags) that this person may not use. They are not listed at all.
// Needs the discourse-sorting plugin; without it nothing extra is hidden. Fails open
// to "nothing restricted" on a network error but is retried next time.
function loadRestricted() {
  if (!pendingRestricted) {
    pendingRestricted = ajax("/discourse-sorting/tag-counts/restricted.json")
      .then((result) => new Set(result.tags || []))
      .catch((error) => {
        if (error?.jqXHR?.status !== 404) {
          pendingRestricted = null;
        }
        return new Set();
      });
  }
  return pendingRestricted;
}

// All tags with site-wide topic counts. One request per page load.
export function loadBooruTags() {
  if (!pending) {
    pending = Promise.all([ajax("/tags.json"), loadRestricted()])
      .then(([result, restricted]) => {
        const hidden = hiddenTags();
        return (result.tags || [])
          .filter(
            (tag) =>
              !tag.pm_only &&
              !hidden.has(tag.name) &&
              !restricted.has(tag.name) &&
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
  const [result, restricted] = await Promise.all([
    ajax("/discourse-sorting/tag-counts.json", { data: { q: query } }),
    loadRestricted(),
  ]);
  return (result.tags || []).filter(
    (tag) => !hidden.has(tag.name) && !restricted.has(tag.name)
  );
}
