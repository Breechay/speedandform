export function athleteWording(item = {}) {
  return item.delivery_state === 'delivered_externally' && item.delivered_wording
    ? item.delivered_wording
    : item.athlete_text || '';
}

export function reviewChainFor(record, completionId) {
  const reads = record?.reads || [];
  const directions = record?.directions || [];
  const read = reads.find((item) => (item.completionIds || []).includes(completionId)) || null;
  const direction = read
    ? directions.find((item) => item.based_on_read_id === read.id) || null
    : null;
  return {
    state: direction ? 'published_chain' : read ? 'review_published' : 'unreviewed',
    read,
    direction
  };
}

export function latestAthleteReviewChain(record) {
  const reads = record?.reads || [];
  const directions = record?.directions || [];
  for (const read of reads) {
    const direction = directions.find((item) => item.based_on_read_id === read.id) || null;
    if (direction) return { read, direction };
  }
  const read = reads[0] || null;
  return { read, direction: null };
}
