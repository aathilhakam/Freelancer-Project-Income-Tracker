// Serialize a user's record operations within this local Express server.
// Payments are the source of truth: no separately stored balance needs updating.
const queues = new Map();
export async function withWorkspaceLock(userId, operation) {
  const key = String(userId);
  const previous = queues.get(key) || Promise.resolve();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => gate);
  queues.set(key, tail);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (queues.get(key) === tail) queues.delete(key);
  }
}
