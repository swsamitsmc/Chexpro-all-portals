// Simple error tracking utility
let errorLog = [];
const MAX_ERRORS = 100;

export const trackError = (error, context = {}) => {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
    id: Date.now().toString()
  };
  
  errorLog.unshift(errorEntry);
  
  // Keep only the last MAX_ERRORS entries
  if (errorLog.length > MAX_ERRORS) {
    errorLog = errorLog.slice(0, MAX_ERRORS);
  }
  
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error tracked:', errorEntry);
  }
};

export const getRecentErrors = (limit = 10) => {
  return errorLog.slice(0, limit);
};

export const getErrorStats = () => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  const recentErrors = errorLog.filter(error => 
    new Date(error.timestamp).getTime() > oneHourAgo
  );
  
  const dailyErrors = errorLog.filter(error => 
    new Date(error.timestamp).getTime() > oneDayAgo
  );
  
  return {
    totalErrors: errorLog.length,
    errorsLastHour: recentErrors.length,
    errorsLast24Hours: dailyErrors.length,
    mostRecentError: errorLog[0] || null
  };
};