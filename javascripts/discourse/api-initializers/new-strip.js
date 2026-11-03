import { apiInitializer } from "discourse/lib/api";
import NewStrip from "../components/new-strip";

// A strip of this week's new topics above the main topic lists, so new work is not
// buried under old threads that get bumped. See lib/new-strip.js.
export default apiInitializer((api) => {
  if (!settings.new_strip_enabled) {
    return;
  }

  const user = api.getCurrentUser();
  const audience = settings.new_strip_audience;
  const allowed =
    audience === "everyone" ||
    (audience === "staff" ? user?.staff : user?.admin);
  if (!allowed) {
    return;
  }

  api.renderInOutlet("discovery-list-container-top", NewStrip);
});
