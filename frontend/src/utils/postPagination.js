export function getNextPostsPage({ meta }) {
  return meta.page < meta.totalPages ? meta.page + 1 : undefined;
}
