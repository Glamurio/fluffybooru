// Calls `callback` whenever something inside #main-outlet changes. #main-outlet does
// not exist yet when initializers run, so this watches the whole body and only reacts to
// changes inside it. Callers debounce (requestAnimationFrame) themselves.
export function watchMainOutlet(callback) {
  new MutationObserver((records) => {
    const inside = records.some((record) => {
      const target =
        record.target.nodeType === Node.ELEMENT_NODE
          ? record.target
          : record.target.parentElement;
      return target?.closest?.("#main-outlet");
    });
    if (inside) {
      callback();
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}
