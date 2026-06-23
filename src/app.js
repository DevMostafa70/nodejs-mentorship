const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const requestLogger = require('./middlewares/logger');
const { requestContext } = require('./middlewares/requestContext');
const { errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./config/rateLimit');
const { apiKeyAuth } = require('./middlewares/auth');
const routes = require('./routes');
const { fail } = require('./utils/response');

const app = express();

app.set('etag', 'strong');
app.set('trust proxy', 1);

app.use(requestContext);
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true
}));
app.use(compression());

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: process.env.URLENCODED_BODY_LIMIT || '512kb'
}));

app.use(requestLogger);

app.use('/api', apiKeyAuth);
app.use('/api', generalLimiter);
app.use('/api', routes);

app.use((req, res) => {
  fail(res, 404, 'Route not found', `Cannot ${req.method} ${req.originalUrl}`, {
    code: 'ROUTE_NOT_FOUND',
    requestId: req.context?.requestId
  });
});

app.use(errorHandler);

module.exports = app;
