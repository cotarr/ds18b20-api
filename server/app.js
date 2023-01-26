'use strict';
//
// ds18b20-api API Server
//
const http = require('http');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const fs = require('fs');
const app = express();
const initializeTimers = require('./timers/timers');
const ds18b20Route = require('./routes/ds18b20-route');

const config = require('../config/');

const nodeEnv = process.env.NODE_ENV || 'development';

// Timer to read Raspberry Pi ds18b20 temperature sensors
initializeTimers();

//
// HTTP Access log
//
// For NODE_ENV === 'production', only errors are logged.
//
const logFolder = path.join(__dirname, '../logs');
const logFile = path.join(__dirname, '../logs/access.log');

try {
  if (!fs.existsSync(logFolder)) {
    console.log('Log folder not found, creating folder...');
    fs.mkdirSync(logFolder);
    fs.chmodSync(logFolder, 0o700);
  }
} catch (err) {
  console.log('Unable to create log folder');
  console.error(err);
  process.exit(1);
}

if ((nodeEnv === 'development') || (process.env.NODE_DEBUG_LOG === '1')) {
  app.use(logger(':date[iso] :remote-addr :status :method :http-version :req[host]:url'));
} else {
  const accessLogStream =
    fs.createWriteStream(logFile, { flags: 'a' });
  app.use(logger(':date[iso] :remote-addr :status :method :http-version :req[host]:url', {
    stream: accessLogStream,
    skip: function (req, res) {
      return (res.statusCode < 400);
    }
  }));
}

// Status route to confirm server is running
app.get('/status', (req, res) => res.json({ status: 'ok' }));

if (config.sensors.length < 1) {
  console.log('Error, no sensor ID has been configured');
  process.exit(1);
}

//
// Data API routes
//
app.get('/v1/alldata', ds18b20Route(-1));
app.get('/v1/data/0', ds18b20Route(0));
app.get('/v1/data/1', ds18b20Route(1));
app.get('/v1/data/2', ds18b20Route(2));
app.get('/v1/data/3', ds18b20Route(3));

// ---------------------------------
//       T E S T   E R R O R
// ---------------------------------
// app.get('/error', (req, res, next) => { throw new Error('Test error'); });

// ---------------------------------
//    E R R O R   H A N D L E R S
// ---------------------------------
//
// catch 404 Not Found
//
app.use(function (req, res, next) {
  const err = new Error(http.STATUS_CODES[404]);
  err.status = 404;
  return res.set('Content-Type', 'text/plain').status(err.status).send(err.message);
});
//
// Custom error handler
//
app.use(function (err, req, res, next) {
  // per Node docs, if response in progress, must be returned to default error handler
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  let message = http.STATUS_CODES[status] || 'Unknown Error Occurred';
  if ((err.message) && (message !== err.message)) message += ', ' + err.message;
  message = 'Status: ' + status.toString() + ', ' + message;

  if (nodeEnv === 'production') {
    console.log(message);
    return res.set('Content-Type', 'text/plain').status(status).send(message);
  } else {
    console.log(err);
    return res.set('Content-Type', 'text/plain').status(status).send(message + '\n' + err.stack);
  }
});

module.exports = app;
