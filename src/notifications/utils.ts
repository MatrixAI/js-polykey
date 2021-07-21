import mlts from 'monotonic-lexicographic-timestamp';

function generateNotifId(): string {
  const timestamp = mlts();
  return timestamp();
}

export { generateNotifId };
