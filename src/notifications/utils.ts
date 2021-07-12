import type { NotificationId } from './types';

function generateNotifId(): string {
  const mlts = require('monotonic-lexicographic-timestamp')();
  return mlts();
}

export { generateNotifId };
