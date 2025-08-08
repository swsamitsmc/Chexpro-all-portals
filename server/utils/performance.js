// Performance monitoring utility
let requestMetrics = {
  totalRequests: 0,
  averageResponseTime: 0,
  errorCount: 0,
  slowRequests: 0
};

export const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    requestMetrics.totalRequests++;
    requestMetrics.averageResponseTime = 
      (requestMetrics.averageResponseTime * (requestMetrics.totalRequests - 1) + responseTime) / requestMetrics.totalRequests;
    
    if (res.statusCode >= 400) {
      requestMetrics.errorCount++;
    }
    
    if (responseTime > 1000) { // Slow request threshold: 1 second
      requestMetrics.slowRequests++;
    }
  });
  
  next();
};

export const getMetrics = () => ({
  ...requestMetrics,
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage(),
  timestamp: new Date().toISOString()
});

export const resetMetrics = () => {
  requestMetrics = {
    totalRequests: 0,
    averageResponseTime: 0,
    errorCount: 0,
    slowRequests: 0
  };
};