import { apiInitializer } from "discourse/lib/api";
import booruState from "../lib/booru-state";

// In booru view a tag page is shown as a filter search, so the tag sidebar, search
// box and sorting are all there:
//   /tag/alicorn/571   ->   /filter?q=tag%3Aalicorn
//
// Only plain tag pages are rewritten (/tag/name, /tag/name/id, /tag/name/l/latest).
// Category-scoped tag pages, /tag/name/info and the other lists are left alone.
const TAG_PAGE = /^\/tag\/([^/?#]+)(?:\/\d+)?(?:\/l\/latest)?\/?(?:[?#].*)?$/;

export default apiInitializer((api) => {
  const router = api.container.lookup("service:router");

  api.onPageChange((url) => {
    if (!settings.tag_pages_as_filter || !booruState.enabled) {
      return;
    }

    const match = (url || "").match(TAG_PAGE);
    if (!match) {
      return;
    }

    let name;
    try {
      name = decodeURIComponent(match[1]);
    } catch {
      return;
    }

    // "none" and similar are not real tags
    if (!name || name === "none" || name === "info") {
      return;
    }

    // replace, not push, so the Back button does not bounce off the tag page
    router
      .replaceWith(`/filter?q=${encodeURIComponent(`tag:${name}`)}`)
      .catch(() => {
        // a newer navigation took over; nothing to do
      });
  });
});
