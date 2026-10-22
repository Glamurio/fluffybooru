import booruState from "./booru-state";

// Whether topic lists should show the date a topic was first posted instead of the
// date of its latest post. Controlled by the published_date_mode setting.
export function showPublishedDate() {
  switch (settings.published_date_mode) {
    case "always":
      return true;
    case "booru":
      return booruState.enabled;
    default:
      return false;
  }
}
