# fluffybooru

Optional booru-style browsing for a Discourse site: a tag sidebar on the left, booru-style tag search, and a denser
thumbnail grid. A theme component. Version 0.1.0, **not yet run on a live Discourse** (see "Status").

It is opt-in. Visitors who never touch the toggle see the normal site (unless `enabled_by_default` is on).

## What you get (when "Booru view" is on)

- **Tag sidebar** on discovery pages (latest, categories, tags, /filter): every tag with its topic count, most-used
  first, with a filter box and "show more". The site has about 670 tags, so the list is paged. Click a tag name to
  include it; the small `−` to its left excludes it. Active tags show as chips you can click to remove.
- **Booru search box**: `foal crying -death order:created-asc`. Plain words are tags that must all match, `-word`
  excludes a tag, and anything with a colon (`order:`, `category:`, `user:`) is passed straight to Discourse.
- **Sort in either direction**: Newest first / Oldest first / Most likes / Most views.
- **Denser grid**: thumbnail minimum width is a setting.
- **Cards that fit their tags** (everyone, not only booru view): Topic Thumbnails' masonry layout reserves a fixed
  76 px for each card's title block, so topics with many tags spilled onto the card below. This measures the text and
  makes only the cards that need it taller (`fit_masonry_to_text`, `masonry_min_image_height`).

It builds on Discourse's own `/filter` page (query language: `tag:a tag:b -tag:c order:created-asc`), so results,
permissions and pagination are all core behaviour. Searches are normal URLs you can bookmark and share.

## Requires

- Topic Thumbnails theme component (already installed on the site) in `grid` mode, for the thumbnails themselves.
- Tagging enabled.

## Install

Admin > Appearance > Components > Install > From a git repository: `https://github.com/Glamurio/fluffybooru.git`,
then add the component to your active theme.

## Settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `enabled_by_default` | off | Booru view is on for people who never chose |
| `sidebar_width` | 280 | Sidebar width in px |
| `sidebar_page_size` | 60 | Tags shown before "show more" |
| `min_tag_count` | 1 | Hide tags used on fewer topics |
| `hidden_tags` | none | Tags never listed in the sidebar |
| `thumbnail_min_width` | 170 | Thumbnail minimum width in px |
| `fit_masonry_to_text` | on | Stretch masonry cards so long tag lists fit |
| `masonry_min_image_height` | 120 | Image height kept when a card is stretched, px |

Tags in a tag group that only some groups may use are listed in the sidebar only to people who may use them (admins always; needs the discourse-sorting plugin).

## Status

Checked: all JS/templates parse (including decorators), SCSS compiles, YAML/JSON parse, and the query translation
(booru text <-> `/filter` query) has unit tests that pass. Not checked: nothing has been loaded into a running
Discourse, so layout and the router/outlet behaviour are unverified. Test on a staging install first.

Things I could not confirm from the source and want checked there:
- that the sidebar column lines up beside the list (it relies on `before-list-area` and `#list-area` being siblings
  in one `.row.full-width`, which is what core's layout shows);
- that the sidebar updates when you move between `/filter` searches (it listens for the router's `routeDidChange`);
- that Topic Thumbnails shows the grid on `/filter`;
- that `currentUser.fluffy_booru` arrives on the user model so the account setting is picked up (if it does not,
  the component silently falls back to the per-browser setting).

## Works better with the discourse-sorting plugin

Install [`discourse-sorting`](https://github.com/Glamurio/discourse-sorting) (0.2.0 or later) and two things change.
The component works without it, with the fallbacks noted.

- **Counts within the results.** On a `/filter` search the sidebar lists the tags of *those* topics with their counts
  in those topics, like a booru's tag column ("Counts are within these results."). Without the plugin, counts are
  site-wide.
- **The opt-in follows the account.** Logged-in people's on/off choice is saved on their account and applies on every
  device. Without the plugin (and for guests) it is saved per browser.

## Known limits / next steps

- No tag autocomplete inside the search box yet.
- Mobile: the sidebar stacks above the list.
- The in-results counts query looks at up to `discourse_sorting_tag_counts_max_topics` topics per search (default
  50,000, plugin setting). Watch the response time on very broad searches and lower it if needed.
