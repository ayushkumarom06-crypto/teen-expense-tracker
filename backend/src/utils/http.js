export const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export function fail(status, message) {
  return Object.assign(new Error(message), { status });
}

export function respond(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

export function databaseError(error) {
  if (error?.code === '23505') return fail(409, 'An account with this email already exists.');
  if (error?.code === '23503') return fail(400, 'This item is in use and cannot be removed.');
  throw error;
}