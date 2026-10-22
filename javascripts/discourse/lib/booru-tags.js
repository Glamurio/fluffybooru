import { ajax } from "discourse/lib/ajax";

let pending;

// One request per page load. /tags.json already carries topic counts.
export function loadBooruTags() {
  if (!pending) {
    pending = ajax("/tags.json")
      .then((result) => {
        const hidden = new Set(
          (settings.hidden_tags || "").split("|").filter(Boolean)
        );
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
