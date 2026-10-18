// Verse wallpapers — rendered once, hosted on Cloudflare R2 behind
// media.jirehbible.com (free egress), streamed as thumbnails and only
// downloaded in full when someone saves one. Nothing is bundled, so the
// shelf can grow monthly without an app update... once the list itself
// moves server-side; for now adding one means a release.
//
// Free tier gets two; the rest are Premium — the same split as the
// story shelf, enforced here and asleep behind PREMIUM_UNLOCKED.

const BASE = 'https://media.jirehbible.com/wallpapers';

export interface Wallpaper {
  id: string;
  title: string;
  verse: string;
  reference: string;
  free?: boolean;
}

export function wallpaperUrl(w: Wallpaper): string {
  return `${BASE}/${w.id}.png`;
}

export function wallpaperThumbUrl(w: Wallpaper): string {
  return `${BASE}/thumb-${w.id}.jpg`;
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'lamb',
    title: 'The Lamb',
    verse: 'The LORD is my shepherd; I shall not want.',
    reference: 'Psalm 23:1',
    free: true,
  },
  {
    id: 'stars',
    title: 'Be Still',
    verse: 'Be still, and know that I am God.',
    reference: 'Psalm 46:10',
    free: true,
  },
  {
    id: 'crucified',
    title: 'It Is Finished',
    verse: 'It is finished.',
    reference: 'John 19:30',
  },
  {
    id: 'water',
    title: 'Take Heart',
    verse: 'Take heart. It is I.',
    reference: 'Matthew 14:27',
  },
  {
    id: 'shepherd',
    title: 'The Good Shepherd',
    verse: 'I am the good shepherd.',
    reference: 'John 10:11',
  },
  {
    id: 'children',
    title: 'The Children',
    verse: 'Let the little children come to me.',
    reference: 'Matthew 19:14',
  },
  {
    id: 'door',
    title: 'The Door',
    verse: 'Behold, I stand at the door and knock.',
    reference: 'Revelation 3:20',
  },
  {
    id: 'cross',
    title: 'So Loved',
    verse: 'For God so loved the world',
    reference: 'John 3:16',
  },
  {
    id: 'tomb',
    title: 'He Has Risen',
    verse: 'He is not here. He has risen.',
    reference: 'Luke 24:6',
  },
  {
    id: 'dove',
    title: 'My Peace',
    verse: 'My peace I give you.',
    reference: 'John 14:27',
  },
  {
    id: 'lion',
    title: 'Lion of Judah',
    verse: 'The Lion of Judah has triumphed.',
    reference: 'Revelation 5:5',
  },
  {
    id: 'storm',
    title: 'Be Still (Storm)',
    verse: 'Peace. Be still.',
    reference: 'Mark 4:39',
  },
];
