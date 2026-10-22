import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { service } from "@ember/service";
import DiscourseURL from "discourse/lib/url";
import { i18n } from "discourse-i18n";
import {
  getOrder,
  parseBooruText,
  parseFilterQuery,
  serializeFilterQuery,
  toBooruText,
  withOrder,
} from "../lib/booru-query";
import { loadBooruTags } from "../lib/booru-tags";

const SORTS = [
  { value: "", key: "booru_sort_default" },
  { value: "created", key: "booru_sort_newest" },
  { value: "created-asc", key: "booru_sort_oldest" },
  { value: "likes", key: "booru_sort_likes" },
  { value: "views", key: "booru_sort_views" },
];

export default class BooruSidebar extends Component {
  @service router;

  @tracked tags = [];
  @tracked loading = true;
  @tracked failed = false;
  @tracked tagFilter = "";
  @tracked limit = settings.sidebar_page_size;
  @tracked draft = null;

  constructor() {
    super(...arguments);
    this.loadTags();
  }

  async loadTags() {
    try {
      this.tags = await loadBooruTags();
    } catch {
      this.failed = true;
    } finally {
      this.loading = false;
    }
  }

  // The q= value of the current /filter page, or "" anywhere else.
  get currentQuery() {
    const url = this.router.currentURL || "";
    if (!url.startsWith("/filter")) {
      return "";
    }
    return new URLSearchParams(url.split("?")[1] || "").get("q") || "";
  }

  get parts() {
    return parseFilterQuery(this.currentQuery);
  }

  get searchText() {
    return this.draft ?? toBooruText(this.parts);
  }

  get chips() {
    return [
      ...this.parts.include.map((name) => ({
        name,
        kind: "include",
        sign: "+",
      })),
      ...this.parts.exclude.map((name) => ({
        name,
        kind: "exclude",
        sign: "−",
      })),
    ];
  }

  get sortOptions() {
    const current = getOrder(this.parts);
    return SORTS.map(({ value, key }) => ({
      value,
      label: i18n(themePrefix(key)),
      selected: value === current,
    }));
  }

  get visibleTags() {
    const used = new Set([...this.parts.include, ...this.parts.exclude]);
    const needle = this.tagFilter.trim().toLowerCase();
    return this.tags
      .filter(
        (tag) => !used.has(tag.name) && (!needle || tag.name.includes(needle))
      )
      .slice(0, this.limit);
  }

  get hasMore() {
    const used = this.parts.include.length + this.parts.exclude.length;
    const needle = this.tagFilter.trim().toLowerCase();
    const matching = needle
      ? this.tags.filter((tag) => tag.name.includes(needle)).length
      : this.tags.length;
    return matching - used > this.limit;
  }

  go(parts) {
    const q = serializeFilterQuery(parts);
    this.draft = null;
    DiscourseURL.routeTo(q ? `/filter?q=${encodeURIComponent(q)}` : "/latest");
  }

  @action
  updateDraft(event) {
    this.draft = event.target.value;
  }

  @action
  submitSearch(event) {
    event.preventDefault();
    this.go(parseBooruText(this.searchText));
  }

  @action
  include(name) {
    const parts = this.parts;
    this.go({
      ...parts,
      include: [...parts.include, name],
      exclude: parts.exclude.filter((n) => n !== name),
    });
  }

  @action
  exclude(name) {
    const parts = this.parts;
    this.go({
      ...parts,
      exclude: [...parts.exclude, name],
      include: parts.include.filter((n) => n !== name),
    });
  }

  @action
  remove(name) {
    const parts = this.parts;
    this.go({
      ...parts,
      include: parts.include.filter((n) => n !== name),
      exclude: parts.exclude.filter((n) => n !== name),
    });
  }

  @action
  setSort(event) {
    this.go(withOrder(this.parts, event.target.value));
  }

  @action
  updateTagFilter(event) {
    this.tagFilter = event.target.value;
    this.limit = settings.sidebar_page_size;
  }

  @action
  showMore() {
    this.limit += settings.sidebar_page_size;
  }

  <template>
    <aside
      class="booru-sidebar"
      aria-label={{i18n (themePrefix "booru_sidebar_label")}}
    >
      <form class="booru-search" {{on "submit" this.submitSearch}}>
        <input
          type="search"
          class="booru-search__input"
          value={{this.searchText}}
          placeholder={{i18n (themePrefix "booru_search_placeholder")}}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          {{on "input" this.updateDraft}}
        />
        <button type="submit" class="btn btn-primary booru-search__submit">
          {{i18n (themePrefix "booru_search_button")}}
        </button>
      </form>
      <p class="booru-help">{{i18n (themePrefix "booru_search_help")}}</p>

      {{#if this.chips}}
        <div class="booru-active">
          <h3 class="booru-heading">{{i18n
              (themePrefix "booru_active_title")
            }}</h3>
          <ul class="booru-chips">
            {{#each this.chips as |chip|}}
              <li>
                <button
                  type="button"
                  class="booru-chip booru-chip--{{chip.kind}}"
                  title={{i18n (themePrefix "booru_remove_tag") tag=chip.name}}
                  {{on "click" (fn this.remove chip.name)}}
                >
                  <span class="booru-chip__sign">{{chip.sign}}</span>
                  {{chip.name}}
                  <span class="booru-chip__x" aria-hidden="true">×</span>
                </button>
              </li>
            {{/each}}
          </ul>
        </div>
      {{/if}}

      <label class="booru-sort">
        <span class="booru-heading">{{i18n
            (themePrefix "booru_sort_label")
          }}</span>
        <select {{on "change" this.setSort}}>
          {{#each this.sortOptions as |option|}}
            <option
              value={{option.value}}
              selected={{option.selected}}
            >{{option.label}}</option>
          {{/each}}
        </select>
      </label>

      <h3 class="booru-heading">{{i18n (themePrefix "booru_tags_title")}}</h3>
      <input
        type="search"
        class="booru-tag-filter"
        placeholder={{i18n (themePrefix "booru_tag_filter_placeholder")}}
        autocomplete="off"
        value={{this.tagFilter}}
        {{on "input" this.updateTagFilter}}
      />

      {{#if this.loading}}
        <p class="booru-status">{{i18n (themePrefix "booru_loading")}}</p>
      {{else if this.failed}}
        <p class="booru-status">{{i18n (themePrefix "booru_load_error")}}</p>
      {{else if this.visibleTags.length}}
        <ul class="booru-tags">
          {{#each this.visibleTags as |tag|}}
            <li class="booru-tag">
              <button
                type="button"
                class="booru-tag__exclude"
                title={{i18n (themePrefix "booru_exclude_tag") tag=tag.name}}
                {{on "click" (fn this.exclude tag.name)}}
              >−</button>
              <button
                type="button"
                class="booru-tag__name"
                title={{i18n (themePrefix "booru_include_tag") tag=tag.name}}
                {{on "click" (fn this.include tag.name)}}
              >{{tag.name}}</button>
              <span class="booru-tag__count">{{tag.count}}</span>
            </li>
          {{/each}}
        </ul>
        {{#if this.hasMore}}
          <button
            type="button"
            class="btn btn-default booru-more"
            {{on "click" this.showMore}}
          >{{i18n (themePrefix "booru_show_more")}}</button>
        {{/if}}
      {{else}}
        <p class="booru-status">{{i18n (themePrefix "booru_no_tags")}}</p>
      {{/if}}
    </aside>
  </template>
}
