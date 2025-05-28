const sendResponse = (
  res,
  { data = null, totalCount = 0, currentPage = 0, totalPages = 0, status = 200, message = 'Success', error = false } = {}
) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Adjust the error for production if it's a server-side error
  const formattedError = isProduction && status >= 500 ? 'Internal Server Error' : message;

  // Standard Response
  return res.status(status).json({
    success: status >= 200 && status < 300,
    status,
    message,
    data,
    totalPages,
    currentPage,
    totalCount,
    error
  });
};

module.exports = sendResponse;
