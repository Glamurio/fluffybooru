import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import icon from "discourse/helpers/d-icon";

const HIDDEN_KEY = "fcom-donation-banner-hidden";

// TEMPORARY donation banner with a hand-entered amount (settings donation_banner_*).
export default class DonationBanner extends Component {
  @tracked hidden = this.#readHidden();

  #readHidden() {
    try {
      return sessionStorage.getItem(HIDDEN_KEY) === "1";
    } catch {
      return false;
    }
  }

  get dismissible() {
    return settings.donation_banner_dismissible;
  }

  get visible() {
    return !(this.dismissible && this.hidden) && settings.donation_banner_goal > 0;
  }

  get title() {
    return settings.donation_banner_title;
  }

  get message() {
    return settings.donation_banner_message;
  }

  get url() {
    return settings.donation_banner_url;
  }

  get buttonText() {
    return settings.donation_banner_button_text;
  }

  get percent() {
    const raised = Number(settings.donation_banner_raised) || 0;
    return Math.min(100, Math.floor((raised / settings.donation_banner_goal) * 100));
  }

  get reached() {
    return (
      (Number(settings.donation_banner_raised) || 0) >=
      settings.donation_banner_goal
    );
  }

  get fillStyle() {
    return `width: ${this.percent}%`;
  }

  money(value) {
    const text = Number(value).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
    return `${settings.donation_banner_currency_symbol}${text}`;
  }

  get progressText() {
    return settings.donation_banner_progress_text
      .replace("{raised}", this.money(Number(settings.donation_banner_raised) || 0))
      .replace("{goal}", this.money(settings.donation_banner_goal));
  }

  get percentText() {
    return this.reached
      ? settings.donation_banner_reached_text
      : settings.donation_banner_percent_text.replace("{percent}", this.percent);
  }

  @action
  hide() {
    this.hidden = true;
    try {
      sessionStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // private mode: it just comes back on the next page
    }
  }

  <template>
    {{#if this.visible}}
      <aside class="fcom-donation-banner">
        <div class="fcom-donation-banner__head">
          {{#if this.url}}
            <a
              class="fcom-donation-banner__title"
              href={{this.url}}
              target="_blank"
              rel="noopener noreferrer"
            ><strong>{{this.title}}</strong></a>
          {{else}}
            <strong class="fcom-donation-banner__title">{{this.title}}</strong>
          {{/if}}
          <span class="fcom-donation-banner__amounts">{{this.progressText}}</span>
          {{#if this.dismissible}}
            <button
              type="button"
              class="btn-flat fcom-donation-banner__hide"
              {{on "click" this.hide}}
            >{{icon "xmark"}}</button>
          {{/if}}
        </div>
        {{#if this.message}}
          <p class="fcom-donation-banner__message">{{this.message}}</p>
        {{/if}}
        {{#if this.url}}
          <a
            class="fcom-donation-banner__barlink"
            href={{this.url}}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={{this.title}}
          ><div
              class="fcom-donation-banner__bar"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={{this.percent}}
            ><div class="fcom-donation-banner__fill" style={{this.fillStyle}}></div></div></a>
        {{else}}
          <div
            class="fcom-donation-banner__bar"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={{this.percent}}
          ><div class="fcom-donation-banner__fill" style={{this.fillStyle}}></div></div>
        {{/if}}
        <div class="fcom-donation-banner__foot">
          <span>{{this.percentText}}</span>
          {{#if this.url}}
            <a
              class="btn btn-primary fcom-donation-banner__donate"
              href={{this.url}}
              target="_blank"
              rel="noopener noreferrer"
            >{{this.buttonText}}</a>
          {{/if}}
        </div>
      </aside>
    {{/if}}
  </template>
}
