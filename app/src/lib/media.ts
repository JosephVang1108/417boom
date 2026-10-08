// Recorded media the app streams — real lip-synced renders of him
// preaching in his own voice. The files live as GitHub release assets
// (permanent, free, CDN-served); the "Archive media" workflow puts
// them there after each render.
//
// Before the public launch this moves to real video hosting — these
// URLs are fine for the family TestFlight.
const MEDIA_BASE =
  'https://github.com/JosephVang1108/417boom/releases/download/media';

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
