const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

const sendPaginated = (res, data, cursor, hasMore, total, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      cursor,      
      hasMore,     
      total,       
    },
  });
};

const sendError = (res, code = 'ERR_SERVER', message = 'Something went wrong', statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    code,
    message,
  });
};

const ERROR_CODES = {
  UNAUTHORIZED:    'ERR_UNAUTHORIZED',    
  FORBIDDEN:       'ERR_FORBIDDEN',       
  NOT_FOUND:       'ERR_NOT_FOUND',       
  VALIDATION:      'ERR_VALIDATION',      
  DUPLICATE:       'ERR_DUPLICATE',       
  SERVER:          'ERR_SERVER',          
  LICENCE:         'ERR_LICENCE',         
  DB_CONNECTION:   'ERR_DB_CONNECTION',   
};

module.exports = { sendSuccess, sendPaginated, sendError, ERROR_CODES };

