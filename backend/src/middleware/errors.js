export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'That page could not be found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = Number(error.status) || 500;
  if (status >= 500) console.error('Request failed:', error.message);
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Something went wrong. Please try again.' : error.message,
  });
}