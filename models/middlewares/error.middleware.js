const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
  
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
  
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err : undefined,
    });
  };
  
  module.exports = errorMiddleware;
  