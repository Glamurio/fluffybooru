import { tracked } from "@glimmer/tracking";
import { ajax } from "discourse/lib/ajax";

const STORAGE_KEY = "fluffybooru-enabled";

function readStored() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === null ? null : value === "1";
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // storage can be blocked; the choice then lasts until the page reloads
  }
}

// Where the choice lives:
// - logged in with the discourse-sorting plugin installed: on the account
//   (currentUser.fluffy_booru, true/false once chosen), so it follows the person
//   across devices;
// - otherwise (guests, or no plugin): in this browser (localStorage).
class BooruState {
  user = null;

  @tracked enabled = readStored() ?? !!settings.enabled_by_default;

  // Called once at startup with the current user (or null for guests).
  init(user) {
    this.user = user;
    if (typeof user?.fluffy_booru === "boolean") {
      this.enabled = user.fluffy_booru;
    }
    this.applyBodyClass();
  }

  applyBodyClass() {
    document.body.classList.toggle("booru-mode", this.enabled);
  }

  setEnabled(value) {
    this.enabled = value;
    writeStored(value);
    this.applyBodyClass();

    if (this.user && "fluffy_booru" in this.user) {
      this.user.fluffy_booru = value;
      ajax("/discourse-sorting/booru", {
        type: "PUT",
        data: { enabled: value },
      }).catch(() => {
        // the browser copy still applies; the account copy will be retried on the next toggle
      });
    }
  }

  toggle = () => {
    this.setEnabled(!this.enabled);
  };
}

export default new BooruState();
