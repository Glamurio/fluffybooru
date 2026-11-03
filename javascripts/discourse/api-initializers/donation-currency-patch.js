import { apiInitializer } from "discourse/lib/api";

// TEMPORARY. The discourse-sorting plugin's donation thermometer formats money with the
// browser's locale, which in some regions writes "US$50". Newer versions of the plugin
// force "$50"; until that is deployed this rewrites the text in the banner. Delete this
// file once the plugin has been rebuilt with the fix.
export default apiInitializer(() => {
  let frame = null;

  function fix() {
    frame = null;
    for (const banner of document.querySelectorAll(".donation-thermometer")) {
      const walker = document.createTreeWalker(banner, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.nodeValue.includes("US$")) {
          node.nodeValue = node.nodeValue.replaceAll("US$", "$");
        }
      }
    }
  }

  function schedule() {
    if (frame === null) {
      frame = requestAnimationFrame(fix);
    }
  }

  // the banner appears after its data arrives and re-renders when it changes
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  schedule();
});
