const sendResponse = (
  res,
  { data = null, status = 200, message = 'Success', error = null } = {}
) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Adjust the error for production if it's a server-side error
  const formattedError = isProduction && status >= 500 ? 'Internal Server Error' : error;

  // Standard Response
  return res.status(status).json({
    success: status >= 200 && status < 300,
    status,
    message,
    data,
    error: formattedError,
  });
};

module.exports = sendResponse;
