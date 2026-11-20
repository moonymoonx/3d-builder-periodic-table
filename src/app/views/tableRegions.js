// Where the family names are written on the 18-column table (layout coordinates: x = group − 9.5,
// z = period − 5.35). They sit in the table's own empty spaces, like names on a map; side labels hang
// just outside the table. anchor: 'center' | 'left' (text starts at the point) | 'right' (text ends
// at the point) | 'bottom' (text sits above the point) | 'top' (text hangs below it). Phones show none:
// their tiles are too small to share space with words (the loupe and the card name the family).
export const REGIONS = [
  { cat: 'transition', x: -2.0, z: -2.75, anchor: 'center', priority: 6 },
  { cat: 'alkaline-earth', x: -6.35, z: -3.05, anchor: 'left', priority: 5 },
  { cat: 'alkali', x: -9.1, z: -0.85, anchor: 'right', priority: 5 },
  { cat: 'metalloid', x: 3.3, z: -4.62, anchor: 'bottom', priority: 4 },
  { cat: 'nonmetal', x: 5.45, z: -4.62, anchor: 'bottom', priority: 4 },
  { cat: 'halogen', x: 7.45, z: -4.62, anchor: 'bottom', priority: 4 },
  { cat: 'noble-gas', x: 9.1, z: -1.35, anchor: 'left', priority: 5 },
  { cat: 'post-transition', x: 4.5, z: 2.12, anchor: 'top', priority: 4 },
  { cat: 'lanthanide', x: -7.05, z: 3.35, anchor: 'right', priority: 5 },
  { cat: 'actinide', x: -7.05, z: 4.35, anchor: 'right', priority: 5 },
].map(r => ({ ...r, phone: false }));
