// Translates between Discourse's /filter query language and a booru-style search string.
//
//   filter query:   tag:foal tag:crying -tag:death created-by:kami order:created-asc
//   booru text:     foal crying -death u:kami order:created-asc
//
// Plain single-tag terms are include/exclude tags. `created-by:name` (the topic's
// author) is the "user tag": `u:name` / `user:name` in the search box, `-u:name` to
// leave someone out. Several included users mean "any of them" (created-by:a,b).
// Anything else (tag:a,b  -tag:a+b  category:x  order:...) is kept untouched in `other`.

const TAG_TERM = /^(-)?tags?:([^\s,+]+(?:\+[^\s,+]+)*)$/i;
const USER_FILTER_TERM = /^(-)?created-by:@?([^\s+]+)$/i;
const USER_BOORU_TERM = /^(-)?(?:u|user):@?([^\s,:]+)$/i;

export function parseFilterQuery(q = "") {
  const parts = emptyParts();

  for (const token of q.trim().split(/\s+/).filter(Boolean)) {
    const tag = token.match(TAG_TERM);
    const user = token.match(USER_FILTER_TERM);

    if (tag && !tag[1]) {
      parts.include.push(...tag[2].split("+"));
    } else if (tag && tag[1] && !tag[2].includes("+")) {
      parts.exclude.push(tag[2]);
    } else if (user) {
      const names = user[2].split(",").filter(Boolean);
      (user[1] ? parts.userExclude : parts.userInclude).push(...names);
    } else {
      parts.other.push(token);
    }
  }

  return dedupe(parts);
}

export function serializeFilterQuery(parts) {
  const { include, exclude, other } = withDefaults(parts);
  const terms = [
    ...other,
    ...include.map((name) => `tag:${name}`),
    ...exclude.map((name) => `-tag:${name}`),
  ];

  const { userInclude, userExclude } = withDefaults(parts);
  if (userInclude.length) {
    terms.push(`created-by:${userInclude.join(",")}`);
  }
  terms.push(...userExclude.map((name) => `-created-by:${name}`));

  return terms.join(" ");
}

// "foal crying -death u:kami order:created" -> filter query parts
export function parseBooruText(text = "") {
  const parts = emptyParts();

  for (const token of text.trim().split(/\s+/).filter(Boolean)) {
    const user = token.match(USER_BOORU_TERM);

    if (user) {
      (user[1] ? parts.userExclude : parts.userInclude).push(user[2]);
    } else if (token.includes(":")) {
      parts.other.push(token);
    } else if (token.startsWith("-") && token.length > 1) {
      parts.exclude.push(token.slice(1));
    } else {
      parts.include.push(token);
    }
  }

  return dedupe(parts);
}

export function toBooruText(parts) {
  const { include, exclude, userInclude, userExclude, other } =
    withDefaults(parts);
  return [
    ...include,
    ...exclude.map((name) => `-${name}`),
    ...userInclude.map((name) => `u:${name}`),
    ...userExclude.map((name) => `-u:${name}`),
    ...other,
  ].join(" ");
}

export function getOrder(parts) {
  const token = parts.other.find((t) => t.startsWith("order:"));
  return token ? token.slice("order:".length) : "";
}

export function withOrder(parts, order) {
  const other = parts.other.filter((t) => !t.startsWith("order:"));
  if (order) {
    other.push(`order:${order}`);
  }
  return { ...parts, other };
}

function emptyParts() {
  return {
    include: [],
    exclude: [],
    userInclude: [],
    userExclude: [],
    other: [],
  };
}

function withDefaults(parts) {
  return { ...emptyParts(), ...parts };
}

function dedupe(parts) {
  return {
    ...parts,
    include: unique(parts.include),
    exclude: unique(parts.exclude),
    userInclude: uniqueNames(parts.userInclude),
    userExclude: uniqueNames(parts.userExclude),
  };
}

function unique(list) {
  return [...new Set(list)];
}

// usernames are case-insensitive: keep the first spelling
function uniqueNames(list) {
  const seen = new Set();
  return list.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
