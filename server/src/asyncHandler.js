// Express 4 doesn't catch rejected promises from async route handlers on its own — without
// this, a failed `await store.xxx()` (a dropped DB connection, a bad query) would just hang
// the request instead of hitting the error middleware in index.js.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
