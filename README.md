# fluffybooru

Optional booru-style browsing for a Discourse site: a tag sidebar on the left, booru-style tag search, and a denser
thumbnail grid. A theme component. Version 0.1.0, **not yet run on a live Discourse** (see "Status").

It is opt-in per browser. Visitors who never touch the toggle see the normal site (unless `enabled_by_default` is on).

## What you get (when "Booru view" is on)

- **Tag sidebar** on discovery pages (latest, categories, tags, /filter): every tag with its topic count, most-used
  first, with a filter box and "show more". The site has about 670 tags, so the list is paged. Click a tag name to
  include it; the small `−` to its left excludes it. Active tags show as chips you can click to remove.
- **Booru search box**: `foal crying -death order:created-asc`. Plain words are tags that must all match, `-word`
  excludes a tag, and anything with a colon (`order:`, `category:`, `user:`) is passed straight to Discourse.
- **Sort in either direction**: Newest first / Oldest first / Most likes / Most views.
- **Denser grid**: thumbnail minimum width is a setting.

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

## Status

Checked: all JS/templates parse (including decorators), SCSS compiles, YAML/JSON parse, and the query translation
(booru text <-> `/filter` query) has unit tests that pass. Not checked: nothing has been loaded into a running
Discourse, so layout and the router/outlet behaviour are unverified. Test on a staging install first.

Things I could not confirm from the source and want checked there:
- that the sidebar column lines up beside the list (it relies on `before-list-area` and `#list-area` being siblings
  in one `.row.full-width`, which is what core's layout shows);
- that the sidebar updates when you navigate between `/filter` searches (depends on `router.currentURL` being tracked);
- that Topic Thumbnails shows the grid on `/filter`.

## Known limits / next steps

- **Opt-in is per browser (localStorage), not per account.** A real per-account setting needs a small server plugin
  (a user option); the companion `discourse-sorting` repo could host it.
- **Tag counts are site-wide**, not "within the current results" as on Gelbooru. That needs a server endpoint that
  counts tags across a filter; planned for the plugin side.
- No tag autocomplete inside the search box yet.
- Mobile: the sidebar stacks above the list.
