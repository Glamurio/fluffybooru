import { ajax } from "discourse/lib/ajax";

// Data for the "new this week" strip: the week's topics (as /filter lists them, so
// permissions and hidden categories behave exactly as on the normal lists), cached in the
// browser for 10 minutes, then narrowed down and ordered according to the settings.

const MAX_PAGES = 6; // 30 topics each; a week is about 70 today
const TTL = 10 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

function cacheKey(userId, days) {
  return `fcom-new-strip:v1:${userId ?? "anon"}:${days}`;
}

function readCache(key) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(key));
    if (cached && Date.now() - cached.at < TTL) {
      return cached.topics;
    }
  } catch {
    // no storage: fetch every time
  }
  return null;
}

function writeCache(key, topics) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), topics }));
  } catch {
    // ignore
  }
}

// the smallest generated thumbnail that is at least 300px wide, else the largest
function pickImage(topic) {
  const thumbs = (topic.thumbnails || [])
    .filter((t) => t.url && t.width)
    .sort((a, b) => a.width - b.width);
  const best = thumbs.find((t) => t.width >= 300) || thumbs[thumbs.length - 1];
  return best?.url || topic.image_url || null;
}

async function fetchWeek(days) {
  const day = new Date(Date.now() - days * DAY).toISOString().slice(0, 10);
  const cutoff = Date.now() - days * DAY;
  const topics = [];
  const seen = new Set();

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await ajax("/filter.json", {
      data: { q: `order:created created-after:${day}`, page },
    });
    const list = result?.topic_list?.topics || [];
    const users = new Map((result?.users || []).map((u) => [u.id, u.username]));

    let added = 0;
    for (const t of list) {
      if (seen.has(t.id)) {
        continue;
      }
      seen.add(t.id);
      if (t.archetype === "private_message") {
        continue;
      }
      if (Date.parse(t.created_at) < cutoff) {
        continue;
      }
      const op =
        (t.posters || []).find((p) => /Original Poster/.test(p.description)) ||
        t.posters?.[0];
      topics.push({
        id: t.id,
        title: t.title,
        url: `/t/${t.slug}/${t.id}`,
        created: Date.parse(t.created_at),
        category: t.category_id,
        image: pickImage(t),
        likes: t.like_count || 0,
        views: t.views || 0,
        read: t.last_read_post_number > 0,
        author: users.get(op?.user_id) || null,
      });
      added++;
    }
    // a short page is the last one; a page with nothing new means paging stopped working
    if (list.length < 30 || added === 0) {
      break;
    }
  }
  return topics;
}

// small seeded generator so a person sees the same selection for a whole hour
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function chooseTiles(topics, options) {
  const { count, order, hideSeen, excluded, userId, now = Date.now() } = options;

  let pool = topics.filter((t) => !excluded.has(String(t.category)));
  if (hideSeen && userId) {
    pool = pool.filter((t) => !t.read);
  }

  if (order === "newest") {
    pool = [...pool].sort((a, b) => b.created - a.created);
  } else if (order === "popular") {
    pool = [...pool].sort((a, b) => b.likes - a.likes || b.views - a.views);
  } else {
    const random = seeded((userId || 7) * 2654435761 + Math.floor(now / 3600000));
    pool = [...pool];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  return pool.slice(0, count);
}

export async function loadNewStrip({ userId, days, ...options }) {
  const key = cacheKey(userId, days);
  let topics = readCache(key);
  if (!topics) {
    topics = await fetchWeek(days);
    writeCache(key, topics);
  }
  return chooseTiles(topics, { ...options, userId });
}
