import Component from "@glimmer/component";
import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { service } from "@ember/service";
import DiscourseURL from "discourse/lib/url";
import { i18n } from "discourse-i18n";
import booruState from "../../lib/booru-state";

// Row above the topic list: the booru toggle (always) and, on /filter pages, links
// back to the normal lists plus a New Topic button. Core's /filter page only offers
// "All / New", which leaves people without a way back or a way to post.
export default class BooruBar extends Component {
  @service router;
  @service composer;
  @service currentUser;

  booruState = booruState;

  get onFilterPage() {
    return this.router.currentRouteName === "discovery.filter";
  }

  get links() {
    const links = [
      { path: "/latest", label: i18n(themePrefix("booru_nav_latest")) },
      { path: "/new", label: i18n(themePrefix("booru_nav_new")) },
    ];
    if (this.currentUser) {
      links.push({
        path: "/unread",
        label: i18n(themePrefix("booru_nav_unread")),
      });
    }
    links.push(
      { path: "/top", label: i18n(themePrefix("booru_nav_top")) },
      { path: "/categories", label: i18n(themePrefix("booru_nav_categories")) }
    );
    return links;
  }

  get canCreateTopic() {
    return !!this.currentUser?.can_create_topic;
  }

  @action
  go(path, event) {
    event.preventDefault();
    DiscourseURL.routeTo(path);
  }

  @action
  createTopic() {
    this.composer.openNewTopic({ preferDraft: true });
  }

  <template>
    <div class="booru-toggle-wrapper">
      {{#if this.onFilterPage}}
        <nav class="booru-nav" aria-label={{i18n (themePrefix "booru_nav_label")}}>
          <ul class="nav-pills booru-nav__pills">
            {{#each this.links as |entry|}}
              <li>
                <a
                  href={{entry.path}}
                  {{on "click" (fn this.go entry.path)}}
                >{{entry.label}}</a>
              </li>
            {{/each}}
          </ul>
          {{#if this.canCreateTopic}}
            <button
              type="button"
              class="btn btn-primary booru-new-topic"
              {{on "click" this.createTopic}}
            >{{i18n (themePrefix "booru_new_topic")}}</button>
          {{/if}}
        </nav>
      {{/if}}

      <button
        type="button"
        class="btn btn-default booru-toggle"
        aria-pressed={{if this.booruState.enabled "true" "false"}}
        title={{i18n (themePrefix "booru_toggle_title")}}
        {{on "click" this.booruState.toggle}}
      >
        {{#if this.booruState.enabled}}
          {{i18n (themePrefix "booru_toggle_on")}}
        {{else}}
          {{i18n (themePrefix "booru_toggle_off")}}
        {{/if}}
      </button>
    </div>
  </template>
}
