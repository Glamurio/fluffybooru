// Topic Thumbnails' masonry layout gives every card a height of
//   column width / image aspect ratio + 76px
// where the 76px is a fixed guess for the title block. Tags make that block taller: a
// card with 15-25 tags, or a long title in a narrow column, needs far more than 76px.
// The card's height is fixed, so the text runs out of the bottom of the card and draws
// on top of the card below.
//
// This measures how tall each card's text really is and, only where the card is too
// short, adds the missing height. Cards that already fit are left alone. Cards are
// absolutely positioned from precomputed offsets, so each card's extra height is also
// added to the offsets of the cards below it in the same column.
//
// It never touches the component's own numbers (--masonry-height and friends). It
// writes three extra variables that common.scss adds on top of them:
//   --booru-fit-extra    on a card: extra height for this card
//   --booru-fit-above    on a card: summed extra height of the cards above it
//   --booru-fit-tallest  on the list: extra height of the whole list

// Space the component reserves for the title block under the image.
const TITLE_ALLOWANCE = 76;

function setPx(el, name, value) {
  const next = `${value}px`;
  if (el.style.getPropertyValue(name) !== next) {
    el.style.setProperty(name, next);
  }
}

// Natural height of the text rows (title block on the left, date and avatar on the
// right). Those grid rows size to their content whatever height the card has, so this
// stays the same before and after the fix.
export function textHeight(card) {
  const main = card.querySelector(".main-link");
  const activity = card.querySelector(".num.activity");
  const posters = card.querySelector(".posters");

  const side =
    (activity?.getBoundingClientRect().height ?? 0) +
    (posters?.getBoundingClientRect().height ?? 0);

  return Math.max(main?.getBoundingClientRect().height ?? 0, side);
}

// How much taller a card must be so that its text fits and the image keeps at least
// minImage pixels (or all of its intended height if that is less).
export function extraHeightFor(cardHeight, text, minImage) {
  const intendedImage = Math.max(0, cardHeight - TITLE_ALLOWANCE);
  return Math.max(
    0,
    Math.ceil(text + Math.min(intendedImage, minImage) - cardHeight)
  );
}

export function fitMasonry(list, minImage) {
  const cards = [...list.querySelectorAll(".topic-list-item")];
  if (!cards.length) {
    return;
  }

  // read everything first, then write, so the browser lays out once
  const entries = cards.map((card) => {
    const style = getComputedStyle(card);
    return {
      card,
      column: parseInt(style.getPropertyValue("--masonry-column-index"), 10),
      height: parseFloat(style.getPropertyValue("--masonry-height")),
      above: parseFloat(style.getPropertyValue("--masonry-height-above")),
      text: textHeight(card),
    };
  });

  const columns = new Map();
  for (const entry of entries) {
    // no usable layout numbers (for example a container narrower than one column)
    if (
      Number.isNaN(entry.column) ||
      Number.isNaN(entry.height) ||
      Number.isNaN(entry.above)
    ) {
      entry.skip = true;
      continue;
    }

    const column = columns.get(entry.column) ?? { extra: 0, end: 0 };
    entry.extraAbove = column.extra;
    entry.extra = extraHeightFor(entry.height, entry.text, minImage);
    column.extra += entry.extra;
    column.end = Math.max(column.end, entry.above + entry.height);
    columns.set(entry.column, column);
  }

  let oldTallest = 0;
  let newTallest = 0;
  for (const column of columns.values()) {
    oldTallest = Math.max(oldTallest, column.end);
    newTallest = Math.max(newTallest, column.end + column.extra);
  }

  for (const entry of entries) {
    if (entry.skip) {
      continue;
    }
    setPx(entry.card, "--booru-fit-extra", entry.extra);
    setPx(entry.card, "--booru-fit-above", entry.extraAbove);
  }
  setPx(list, "--booru-fit-tallest", Math.max(0, newTallest - oldTallest));
}
