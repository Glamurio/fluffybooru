import Component from "@glimmer/component";
import formatDate from "discourse/helpers/format-date";
import { apiInitializer } from "discourse/lib/api";
import { i18n } from "discourse-i18n";
import { showPublishedDate } from "../lib/published-date-mode";

// Core's "Activity" column shows when a topic was last posted in (bumpedAt), so an
// old story that got a reply last week looks new. This swaps it for the date the
// topic was first posted. The hover text keeps core's own "Created ... / Latest ..."
// summary, and the link still goes to the latest post, as before.
class PublishedHeader extends Component {
  <template>
    <th class="activity num topic-list-data published-date">{{i18n
        (themePrefix "published_header")
      }}</th>
  </template>
}

class PublishedItem extends Component {
  <template>
    <td
      class="activity num topic-list-data age published-date"
      title={{@topic.bumpedAtTitle}}
      ...attributes
    >
      <a class="post-activity" href={{@topic.lastPostUrl}}>{{formatDate
          @topic.createdAt
          format="tiny"
          noTitle="true"
        }}</a>
    </td>
  </template>
}

export default apiInitializer((api) => {
  api.registerValueTransformer("topic-list-columns", ({ value: columns }) => {
    if (showPublishedDate() && columns.has("activity")) {
      columns.replace("activity", {
        header: PublishedHeader,
        item: PublishedItem,
      });
    }
    return columns;
  });
});
