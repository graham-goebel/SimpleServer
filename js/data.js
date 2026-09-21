/**
 * The collection. Each print carries its catalogue details, its purchase
 * options, and where it hangs on the wall.
 *
 * Wall coordinates are percentages of the wall's width (x, w) and height (y).
 * A frame's height follows from its artwork ratio, so the whole hang scales
 * with the viewport without anything drifting out of alignment.
 */
export const PRINTS = [
  {
    id: 'ninth-street',
    title: 'Ninth Street, After Rain',
    artist: 'Theo Marchetti',
    year: 2023,
    medium: 'Archival pigment print on cotton rag',
    edition: 'Edition of 40',
    place: 'Washington, DC',
    blurb:
      'Shot forty minutes after a summer storm, when the street still held the whole block upside down. The rowhouses went soft and the puddles did the drawing.',
    tags: ['Photography', 'Cityscape'],
    art: 'art/ninth-street.svg',
    ratio: 800 / 560,
    frame: 'black',
    mat: 'wide',
    wall: { x: 3, y: 4, w: 23 },
  },
  {
    id: 'bridge-tender',
    title: "Bridge Tender's House",
    artist: 'Theo Marchetti',
    year: 2022,
    medium: 'Archival pigment print on cotton rag',
    edition: 'Edition of 25',
    place: 'Anacostia, DC',
    blurb:
      'The last operator lives in a white box above the water and lifts the span twice a day. Photographed from the towpath at the hour the sky goes flat.',
    tags: ['Photography', 'Architecture'],
    art: 'art/bridge-tender.svg',
    ratio: 640 / 800,
    frame: 'black',
    mat: 'wide',
    wall: { x: 31, y: 2, w: 18 },
  },
  {
    id: 'juan',
    title: 'JUAN',
    artist: 'Elena Ruiz-Mora',
    year: 2024,
    medium: 'Four-colour screenprint on Coventry Rag',
    edition: 'Edition of 60, signed',
    place: 'San Juan, PR',
    blurb:
      'A love letter in four passes of ink: the arch of a doorway, one palm, one sun, and a name set the way it sounds when someone calls it across a courtyard.',
    tags: ['Screenprint', 'Type'],
    art: 'art/juan.svg',
    ratio: 600 / 760,
    frame: 'white',
    mat: 'wide',
    wall: { x: 55, y: 5, w: 15 },
  },
  {
    id: 'garden-state',
    title: 'Garden State Interchange',
    artist: 'Delia Okonkwo',
    year: 2023,
    medium: 'Six-colour risograph',
    edition: 'Edition of 75',
    place: 'Newark, NJ',
    blurb:
      'Overpass stacked on overpass stacked on marsh, printed at the exact minute the sodium lamps come on and the sky gives up its orange.',
    tags: ['Risograph', 'Landscape'],
    art: 'art/garden-state.svg',
    ratio: 760 / 540,
    frame: 'oak',
    mat: 'narrow',
    wall: { x: 77, y: 7, w: 19 },
  },
  {
    id: 'revolutionary',
    title: 'The Most Revolutionary',
    artist: 'Community Archive Project',
    year: 1994,
    medium: 'Offset lithograph, reissued from the original plates',
    edition: 'Open edition',
    place: 'Philadelphia, PA',
    blurb:
      'Exhibition poster for thirty years of LGBTQ politics and the radical left. Every badge around the fist belonged to a group that met in the same basement.',
    tags: ['Poster', 'Archive'],
    art: 'art/revolutionary.svg',
    ratio: 600 / 820,
    frame: 'black',
    mat: 'none',
    wall: { x: 4, y: 33, w: 17 },
  },
  {
    id: 'monument',
    title: 'Monument, 4:12 AM',
    artist: 'Theo Marchetti',
    year: 2024,
    medium: 'Archival pigment print on baryta',
    edition: 'Edition of 15, signed',
    place: 'Washington, DC',
    blurb:
      'Twelve minutes past four, no wind, no one on the path. The pool held the obelisk so still that the print reads the same either way up.',
    tags: ['Photography', 'Night'],
    art: 'art/monument.svg',
    ratio: 700 / 900,
    frame: 'black',
    mat: 'wide',
    feature: true,
    wall: { x: 27, y: 40, w: 23 },
  },
  {
    id: 'field-grain',
    title: 'Field Grain No. 4',
    artist: 'Ivo Lindqvist',
    year: 2021,
    medium: 'Photogravure on Hahnemühle',
    edition: 'Edition of 20',
    place: 'Gotland, SE',
    blurb:
      'A metre of winter grass at one second of exposure. Up close it is thousands of separate lines; from the sofa it is weather.',
    tags: ['Photogravure', 'Abstract'],
    art: 'art/field-grain.svg',
    ratio: 820 / 560,
    frame: 'black',
    mat: 'wide',
    wall: { x: 75, y: 36, w: 21 },
  },
  {
    id: 'wire-study',
    title: 'Wire Study No. 3',
    artist: 'Ana Bettencourt',
    year: 2022,
    medium: 'White ink screenprint on charcoal stock',
    edition: 'Edition of 30',
    place: 'Lisbon, PT',
    blurb:
      'A figure described entirely by the tension between eight points. Remove any one of them and the whole thing falls down.',
    tags: ['Screenprint', 'Line'],
    art: 'art/wire-study.svg',
    ratio: 560 / 700,
    frame: 'white',
    mat: 'narrow',
    wall: { x: 80, y: 60, w: 13 },
  },
  {
    id: 'three-rooms',
    title: 'Three Rooms, One Slab',
    artist: 'Delia Okonkwo',
    year: 2023,
    medium: 'Letterpress text with two tipped-in prints',
    edition: 'Edition of 18',
    place: 'Marfa, TX',
    blurb:
      'A triptych that argues with itself: the text describes a building, and the two photographs below it decline to confirm the description.',
    tags: ['Triptych', 'Letterpress'],
    art: 'art/three-rooms.svg',
    ratio: 400 / 1000,
    frame: 'black',
    mat: 'narrow',
    wall: { x: 6, y: 69, w: 9 },
  },
  {
    id: 'philly',
    title: 'PHILLY',
    artist: 'Elena Ruiz-Mora',
    year: 2024,
    medium: 'Two-colour screenprint on French Paper',
    edition: 'Edition of 100, signed',
    place: 'Philadelphia, PA',
    blurb:
      'The bell, the crack, and the only spelling of the city that anyone who lives there actually uses.',
    tags: ['Screenprint', 'Type'],
    art: 'art/philly.svg',
    ratio: 600 / 760,
    frame: 'white',
    mat: 'wide',
    wall: { x: 55, y: 62, w: 16 },
  },
];

/** Sizes are shared across the collection; the multiplier scales the base price. */
export const SIZES = [
  { id: 's', label: '18 × 24 in', note: 'Small', multiplier: 1 },
  { id: 'm', label: '24 × 36 in', note: 'Medium', multiplier: 1.7 },
  { id: 'l', label: '32 × 48 in', note: 'Large', multiplier: 2.6 },
];

export const FRAMES = [
  { id: 'none', label: 'Unframed', note: 'Rolled in a tube', add: 0 },
  { id: 'black', label: 'Black ash', note: 'Museum glass', add: 180 },
  { id: 'white', label: 'White oak', note: 'Museum glass', add: 180 },
  { id: 'oak', label: 'Natural oak', note: 'Museum glass', add: 205 },
];

/** Base price for the small size, before framing. */
export const BASE_PRICE = 165;

export function priceOf(print, sizeId, frameId) {
  const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[0];
  const frame = FRAMES.find((f) => f.id === frameId) ?? FRAMES[0];
  const premium = print.feature ? 60 : 0;
  return Math.round((BASE_PRICE + premium) * size.multiplier) + frame.add;
}

export const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
