const {
  notFoundHandler,
  globalErrorHandler,
} = require('./errorHandlers');

function applyCustomMiddlewares(app) {
  app.use(globalErrorHandler);
  app.use(notFoundHandler);
}

module.exports = {
  applyCustomMiddlewares,
};
