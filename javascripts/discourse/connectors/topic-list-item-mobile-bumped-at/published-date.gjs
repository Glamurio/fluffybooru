import Component from "@glimmer/component";
import formatDate from "discourse/helpers/format-date";
import { showPublishedDate } from "../../lib/published-date-mode";

// Mobile topic lists draw the date through this outlet instead of a table column.
// When this connector does not render, core's own last-activity date stays.
export default class PublishedDateMobile extends Component {
  static shouldRender() {
    return showPublishedDate();
  }

  <template>
    <span
      class="age activity published-date"
      title={{@outletArgs.topic.bumpedAtTitle}}
    >
      <a href={{@outletArgs.topic.lastPostUrl}}>{{formatDate
          @outletArgs.topic.createdAt
          format="tiny"
          noTitle="true"
        }}</a>
    </span>
  </template>
}
