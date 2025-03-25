export const sendResponse = (
    res,
    { data = null, status = 200, message = 'Success', error = null } = {}
  ) => {
    const isProduction = process.env.NODE_ENV === 'production';
  
    return res.status(status).json({
      data,
      status,
      message,
      error: isProduction && status >= 500 ? 'Internal Server Error' : error,
    });
  };
  