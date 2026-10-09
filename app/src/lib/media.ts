// Recorded media the app streams — real lip-synced renders of him
// preaching in his own voice. The files live as GitHub release assets
// (permanent, free); the "Archive media" workflow puts them there.
// They stream THROUGH our server because GitHub labels the files
// application/octet-stream, which the iPhone player refuses — the
// server relays the bytes with an honest video/mp4 header.
import { BACKEND_URL } from './config';

const MEDIA_BASE = `${BACKEND_URL ?? ''}/media`;

export interface RecordedSermon {
  id: string;
  title: string;
  tagline: string;
  minutes: number;
  url: string;
  icon: number;
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
