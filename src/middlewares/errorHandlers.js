const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const globalErrorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  console.error(JSON.stringify({ message: error.message, stack: error.stack }));
  if (process.env.NODE_ENV === 'production') {
    res.json({
      message: 'Oops! Unexpected error has occurred when processing your request.',
    });
  } else {
    res.json({
      message: error.message,
      stack: error.stack,
    });
  }
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
