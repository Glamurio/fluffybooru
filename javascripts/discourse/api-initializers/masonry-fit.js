import { apiInitializer } from "discourse/lib/api";
import { fitMasonry } from "../lib/masonry-fit";

// Keeps cards in Topic Thumbnails' masonry layout tall enough for their tags and title
// (see lib/masonry-fit.js). Runs for everyone, not only in booru view, because the
// overlap happens in the normal masonry lists too.
export default apiInitializer((api) => {
  if (!settings.fit_masonry_to_text) {
    return;
  }

  let frame = null;
  const watched = new WeakSet();

  function run() {
    frame = null;

    const list = document.querySelector(".topic-list.topic-thumbnails-masonry");
    if (!list) {
      return;
    }

    if (!watched.has(list)) {
      watched.add(list);
      // the list resized (window, orientation, sidebar) or the component rewrote its
      // layout numbers / loaded more topics
      new ResizeObserver(schedule).observe(list);
      new MutationObserver(schedule).observe(list, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    fitMasonry(list, settings.masonry_min_image_height);
  }

  // At most once per frame. fitMasonry only writes style attributes, which none of the
  // observers above watch, and it skips writes that change nothing, so it settles.
  function schedule() {
    if (frame === null) {
      frame = requestAnimationFrame(run);
    }
  }

  api.onPageChange(schedule);

  // web fonts change how the text wraps
  document.fonts?.ready.then(schedule);

  // the list is created after the route renders; catch it appearing
  const outlet = document.getElementById("main-outlet");
  if (outlet) {
    new MutationObserver(schedule).observe(outlet, {
      childList: true,
      subtree: true,
    });
  }
});
