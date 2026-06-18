function loggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] [INFO] ${req.method} ${req.path}`);

  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - startTime;
    const endTimestamp = new Date().toISOString();
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${endTimestamp}] [${level}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    return originalSend.call(this, body);
  };

  next();
}

module.exports = loggerMiddleware;
