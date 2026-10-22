import { tracked } from "@glimmer/tracking";

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

// Opt-in is stored per browser (localStorage), not per account.
class BooruState {
  @tracked enabled = readStored() ?? !!settings.enabled_by_default;

  applyBodyClass() {
    document.body.classList.toggle("booru-mode", this.enabled);
  }

  setEnabled(value) {
    this.enabled = value;
    writeStored(value);
    this.applyBodyClass();
  }

  toggle = () => {
    this.setEnabled(!this.enabled);
  };
}

export default new BooruState();
