import { apiInitializer } from "discourse/lib/api";
import { addSearchThumbnails } from "../lib/search-thumbnails";

// Topic images on the full-page search results. See lib/search-thumbnails.js.
export default apiInitializer((api) => {
  if (!settings.search_thumbnails) {
    return;
  }

  let frame = null;

  function run() {
    frame = null;
    if (document.querySelector(".search-results .fps-result")) {
      addSearchThumbnails(settings.search_thumbnail_size);
    }
  }

  function schedule() {
    if (frame === null) {
      frame = requestAnimationFrame(run);
    }
  }

  api.onPageChange(schedule);

  // results arrive after the page renders, and more are appended as you scroll
  const outlet = document.getElementById("main-outlet");
  if (outlet) {
    new MutationObserver(schedule).observe(outlet, {
      childList: true,
      subtree: true,
    });
  }
});
