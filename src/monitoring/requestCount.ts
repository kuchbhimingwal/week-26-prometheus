import { NextFunction, Request, Response } from "express";
import client from "prom-client";

// Create a counter metric
const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const requestGauge = new client.Gauge({
  name: 'http_active_requests_total',
  help: 'Total number of HTTP requests active right now',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000] // Define your own buckets here
});
export const requestCountMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    requestGauge.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    });
    res.on('finish', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Increment request counter
        requestCounter.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode
        });

        httpRequestDurationMicroseconds.observe({
          method: req.method,
          route: req.route ? req.route.path : req.path,
          code: res.statusCode
        }, duration);
        
        requestGauge.dec({
          method: req.method,
          route: req.route ? req.route.path : req.path,
          status_code: res.statusCode
        });
    });

    next();
};