import { on } from "@ember/modifier";
import { i18n } from "discourse-i18n";
import booruState from "../../lib/booru-state";

<template>
  <div class="booru-toggle-wrapper">
    <button
      type="button"
      class="btn btn-default booru-toggle"
      aria-pressed={{if booruState.enabled "true" "false"}}
      title={{i18n (themePrefix "booru_toggle_title")}}
      {{on "click" booruState.toggle}}
    >
      {{#if booruState.enabled}}
        {{i18n (themePrefix "booru_toggle_on")}}
      {{else}}
        {{i18n (themePrefix "booru_toggle_off")}}
      {{/if}}
    </button>
  </div>
</template>
