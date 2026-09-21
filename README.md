# Gallery

An interactive print wall. Ten pieces hung salon style on a single page: hover a
frame for its label, click it and the print flies to the middle of the screen
while the rest of the wall blurs back and a panel slides in with the details,
the size and framing options, and an add-to-cart button.

No build step, no dependencies, no framework — plain HTML, CSS and ES modules.
The artwork is inline SVG, so the whole site is about 100 KB and works offline.

## Running it

The page loads ES modules, so it needs to be served over http rather than
opened from the filesystem:

```sh
./serve.py            # http://localhost:8000
./serve.py 3000       # or pick a port
```

Anything else that serves static files works just as well (`python3 -m
http.server`, `npx http-server`, etc.).

## What it does

| Interaction | Behaviour |
| --- | --- |
| Hover a frame | Label with title, artist, year and starting price |
| Click a frame | Print scales into view, the rest of the wall blurs, panel opens |
| Size / framing | Price updates live; framed pieces cost more |
| Add to cart | Drawer with quantities, line totals and a subtotal; kept in `localStorage` |
| `←` `→` | Step to the previous or next print without leaving focus mode |
| `Esc` | Close the cart, then leave focus mode |
| Click the print, the backdrop, or ✕ | Back to the wall |
| Dim the room | Swaps the wall to a dark hang; the choice is remembered |
| `/#philly` | Deep link — opens that print directly |

Every frame is a real `<button>`, so the wall is fully keyboard navigable. While
a print holds focus the other frames drop out of the tab order, and focus moves
into the panel. Motion respects `prefers-reduced-motion`.

Below 880px the salon hang would be unreadable, so the wall becomes a single
column and the detail panel becomes a bottom sheet.

## Layout

The hang is data, not CSS. Each print carries a `wall: { x, y, w }` in
`js/data.js`, given as percentages of the wall's width. A frame's height follows
from its artwork's aspect ratio, so the arrangement scales with the viewport
without anything drifting out of alignment or overlapping.

```js
{
  id: 'monument',
  title: 'Monument, 4:12 AM',
  art: 'art/monument.svg',
  ratio: 700 / 900,        // the artwork's own aspect ratio
  frame: 'black',          // black | white | oak
  mat: 'wide',             // wide | narrow | none
  feature: true,           // carries a price premium
  wall: { x: 27, y: 40, w: 23 },
}
```

## Adding a print

1. Drop the artwork in `art/` — SVG, or a raster image if you prefer.
2. Add an entry to `PRINTS` in `js/data.js` with its details and a free patch of
   wall.
3. Reload. Nothing else needs touching; the frame, mat, hover label, detail
   panel and cart entry are all generated from that one object.

Sizes, framing options and the base price live in the same file, in `SIZES`,
`FRAMES` and `BASE_PRICE`.

## Files

```
index.html            markup for the wall, panel, cart and tooltip
css/styles.css        the room, the frames, and the focus choreography
js/data.js            the collection, the price list, and the hang
js/app.js             hover, focus mode, options, cart
art/*.svg             ten prints
serve.py              static server for local preview
test/interaction.mjs  end-to-end check of every interaction above
```

## Checking it still works

```sh
./serve.py 8765 &
node test/interaction.mjs        # needs: npm i -D playwright
```

26 checks covering focus mode geometry, keyboard navigation, pricing, the cart,
persistence and deep links.

---

A demo shop front. Every print, price and artist in it is invented.
