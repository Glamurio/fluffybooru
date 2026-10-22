// Translates between Discourse's /filter query language and a booru-style search string.
//
//   filter query:   tag:foal tag:crying -tag:death order:created-asc
//   booru text:     foal crying -death order:created-asc
//
// Only plain single-tag terms are understood as include/exclude. Anything else
// (tag:a,b  -tag:a+b  category:x  user:y  order:...) is kept untouched in `other`.

const TAG_TERM = /^(-)?tags?:([^\s,+]+(?:\+[^\s,+]+)*)$/i;

export function parseFilterQuery(q = "") {
  const include = [];
  const exclude = [];
  const other = [];

  for (const token of q.trim().split(/\s+/).filter(Boolean)) {
    const match = token.match(TAG_TERM);
    if (match && !match[1]) {
      include.push(...match[2].split("+"));
    } else if (match && match[1] && !match[2].includes("+")) {
      exclude.push(match[2]);
    } else {
      other.push(token);
    }
  }

  return { include: unique(include), exclude: unique(exclude), other };
}

export function serializeFilterQuery({ include, exclude, other }) {
  return [
    ...other,
    ...include.map((name) => `tag:${name}`),
    ...exclude.map((name) => `-tag:${name}`),
  ].join(" ");
}

// "foal crying -death order:created" -> filter query parts
export function parseBooruText(text = "") {
  const include = [];
  const exclude = [];
  const other = [];

  for (const token of text.trim().split(/\s+/).filter(Boolean)) {
    if (token.includes(":")) {
      other.push(token);
    } else if (token.startsWith("-") && token.length > 1) {
      exclude.push(token.slice(1));
    } else {
      include.push(token);
    }
  }

  return { include: unique(include), exclude: unique(exclude), other };
}

export function toBooruText({ include, exclude, other }) {
  return [...include, ...exclude.map((name) => `-${name}`), ...other].join(" ");
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

function unique(list) {
  return [...new Set(list)];
}
