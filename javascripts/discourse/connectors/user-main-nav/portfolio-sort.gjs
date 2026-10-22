import Component from "@glimmer/component";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { i18n } from "discourse-i18n";

// Sort menu for the User Portfolio page. It only drives the ?order= / ?ascending=
// URL parameters, which the discourse-sorting plugin makes the portfolio honour, so
// it is only shown when that plugin part is switched on.
const SORTS = [
  { id: "", key: "booru_sort_default", order: null, ascending: null },
  { id: "created", key: "booru_sort_newest", order: "created", ascending: null },
  {
    id: "created-asc",
    key: "booru_sort_oldest",
    order: "created",
    ascending: "true",
  },
  { id: "likes", key: "booru_sort_likes", order: "likes", ascending: null },
  { id: "views", key: "booru_sort_views", order: "views", ascending: null },
  {
    id: "activity",
    key: "portfolio_sort_activity",
    order: "activity",
    ascending: null,
  },
];

export default class PortfolioSort extends Component {
  @service router;
  @service siteSettings;

  get visible() {
    return (
      this.router.currentRouteName === "user.portfolio" &&
      this.siteSettings.discourse_sorting_enabled &&
      this.siteSettings.discourse_sorting_portfolio_params
    );
  }

  get currentId() {
    const params = this.router.currentRoute?.queryParams || {};
    if (!params.order) {
      return "";
    }
    return params.order === "created" && params.ascending === "true"
      ? "created-asc"
      : params.order;
  }

  get options() {
    const current = this.currentId;
    return SORTS.map(({ id, key }) => ({
      id,
      label: i18n(themePrefix(key)),
      selected: id === current,
    }));
  }

  @action
  change(event) {
    const sort = SORTS.find((s) => s.id === event.target.value);
    if (sort) {
      this.router.transitionTo({
        queryParams: { order: sort.order, ascending: sort.ascending },
      });
    }
  }

  <template>
    {{#if this.visible}}
      <label class="portfolio-sort__inner">
        <span class="portfolio-sort__label">{{i18n
            (themePrefix "portfolio_sort_label")
          }}</span>
        <select class="portfolio-sort__select" {{on "change" this.change}}>
          {{#each this.options as |sort|}}
            <option value={{sort.id}} selected={{sort.selected}}>{{sort.label}}</option>
          {{/each}}
        </select>
      </label>
    {{/if}}
  </template>
}
