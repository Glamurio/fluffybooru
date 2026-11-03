import { apiInitializer } from "discourse/lib/api";
import DonationBanner from "../components/donation-banner";

// TEMPORARY stand-in for the discourse-sorting plugin's donation tracker; see
// settings.yml. Steps aside once the plugin's own thermometer is switched on.
export default apiInitializer((api) => {
  const siteSettings = api.container.lookup("service:site-settings");

  if (!settings.donation_banner_enabled) {
    return;
  }
  if (siteSettings.discourse_sorting_donations_enabled) {
    return;
  }

  const user = api.getCurrentUser();
  const audience = settings.donation_banner_audience;
  const allowed =
    audience === "everyone" ||
    (audience === "staff" ? user?.staff : user?.admin);
  if (!allowed) {
    return;
  }

  api.renderInOutlet("discovery-list-container-top", DonationBanner);
});
