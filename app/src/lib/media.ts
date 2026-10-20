// Recorded media the app streams — real lip-synced renders of him
// preaching in his own voice. Phones stream straight from Cloudflare R2
// (bucket jireh-media behind media.jirehbible.com: free egress, proper
// video/mp4 headers, Range support) so the backend is out of the video
// path. The GitHub `media` release stays the master archive, and the
// server's /media proxy remains as a fallback for older builds.

const MEDIA_BASE = 'https://media.jirehbible.com';

export interface RecordedSermon {
  id: string;
  title: string;
  tagline: string;
  minutes: number;
  url: string;
  /** Bundled asset (require) or a remote https URL from the catalog. */
  icon: number | string;
  emoji: string;
  free?: boolean;
}

export const RECORDED_SERMONS: RecordedSermon[] = [
  {
    id: 'come-back-home',
    title: 'Come Back Home',
    tagline: 'For the one who wandered — the door is still open',
    minutes: 5,
    url: `${MEDIA_BASE}/sermon-come-back-home.mp4`,
    icon: require('../../assets/media/s-prodigal.jpg'),
    emoji: '🏡',
    free: true,
  },
];

/** Recorded story tellings — he tells it to your face. */
export const RECORDED_STORIES: RecordedSermon[] = [
  {
    id: 'david-goliath-adult',
    title: 'David & Goliath',
    tagline: 'The full telling — he was there',
    minutes: 6,
    url: `${MEDIA_BASE}/story-david-goliath-adult.mp4`,
    icon: require('../../assets/media/s-david.jpg'),
    emoji: '🪨',
    free: true,
  },
  {
    id: 'david-goliath-kids',
    title: 'David & Goliath for Kids',
    tagline: 'A cozy bedtime telling for little ones',
    minutes: 5,
    url: `${MEDIA_BASE}/story-david-goliath-kids.mp4`,
    icon: require('../../assets/media/s-david.jpg'),
    emoji: '🛏️',
  },
];
