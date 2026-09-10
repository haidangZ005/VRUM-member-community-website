export const FEEDS = ['home', 'popular', 'all'];
export const FEED_SORTS = ['hot', 'new', 'top'];

export function parseFeed(value) {
  return FEEDS.includes(value) ? value : 'home';
}

export function parseFeedSort(value, fallback) {
  return FEED_SORTS.includes(value) ? value : fallback;
}
