import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import { loadNewStrip } from "../lib/new-strip";

// Only the main lists, not category/tag pages, searches or the booru /filter pages.
const ROUTES = new Set([
  "discovery.new",
  "discovery.latest",
  "discovery.unread",
  "discovery.top",
  "discovery.hot",
]);

export default class NewStrip extends Component {
  @service router;
  @service currentUser;

  @tracked tiles = [];

  get onList() {
    return ROUTES.has(this.router.currentRouteName);
  }

  get show() {
    return this.onList && this.tiles.length > 0;
  }

  get title() {
    return settings.new_strip_title;
  }

  @action
  async load() {
    if (!this.onList) {
      return;
    }
    try {
      this.tiles = await loadNewStrip({
        userId: this.currentUser?.id,
        days: settings.new_strip_days,
        count: settings.new_strip_count,
        order: settings.new_strip_order,
        hideSeen: settings.new_strip_hide_seen,
        excluded: new Set(
          (settings.new_strip_exclude_categories || "").split("|").filter(Boolean)
        ),
      });
    } catch {
      // no strip is better than an error box
    }
  }

  <template>
    <div class="fcom-new-strip-loader" {{didInsert this.load}}>
      {{#if this.show}}
        <section class="fcom-new-strip">
          {{#if this.title}}
            <h2 class="fcom-new-strip__title">{{this.title}}</h2>
          {{/if}}
          <div class="fcom-new-strip__grid">
            {{#each this.tiles as |tile|}}
              <a
                class="fcom-new-strip__tile {{if tile.image 'has-image' 'no-image'}}"
                href={{tile.url}}
              >
                {{#if tile.image}}
                  <img src={{tile.image}} alt="" loading="lazy" decoding="async" />
                {{/if}}
                <span class="fcom-new-strip__label">
                  <span class="fcom-new-strip__name">{{tile.title}}</span>
                  {{#if tile.author}}
                    <span class="fcom-new-strip__meta">{{tile.author}}</span>
                  {{/if}}
                </span>
              </a>
            {{/each}}
          </div>
        </section>
      {{/if}}
    </div>
  </template>
}
