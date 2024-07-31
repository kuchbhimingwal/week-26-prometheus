"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestCountMiddleware = exports.httpRequestDurationMicroseconds = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
// Create a counter metric
const requestCounter = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});
const requestGauge = new prom_client_1.default.Gauge({
    name: 'http_active_requests_total',
    help: 'Total number of HTTP requests active right now',
    labelNames: ['method', 'route', 'status_code']
});
exports.httpRequestDurationMicroseconds = new prom_client_1.default.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000] // Define your own buckets here
});
const requestCountMiddleware = (req, res, next) => {
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
        exports.httpRequestDurationMicroseconds.observe({
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
exports.requestCountMiddleware = requestCountMiddleware;
