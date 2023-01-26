'use strict';

//
// The configuration options of the server
//

const path = require('path');
const fs = require('fs');

// Import UNIX environment variables from .env file and add to process.env
require('dotenv').config();

const appVersion = JSON.parse(fs.readFileSync('package.json')).version;

// const nodeEnv = process.env.NODE_ENV || 'development';

exports.server = {
  appVersion: appVersion,
  tlsKey: process.env.SERVER_TLS_KEY ||
    path.join(__dirname, '../../../.tls/key.pem'),
  tlsCert: process.env.SERVER_TLS_CERT ||
    path.join(__dirname, '../../../.tls/cert.pem'),
  tlsCA: process.env.SERVER_TLS_CA ||
    path.join(__dirname, '../../../.tls/CA.pem'),
  tls: (process.env.SERVER_TLS === 'true') || false,
  clientAuth: (process.env.SERVER_CLIENT_AUTH === 'true' || false),
  port: parseInt(process.env.SERVER_PORT || '8000'),
  pidFilename: process.env.SERVER_PID_FILENAME || ''
};

// Import 1 to 4 sensors from ENV variables
// This assumes no sensors are missing in the middle of the sequence

const sensors = [
  null,
  null,
  null,
  null
];

// Sensor id are listed in Raspberry Pi directory /sys/bus/w1/devices/
// Example: ID_SENSOR_2=28-0115a43610ff

if (process.env.ID_SENSOR_0) sensors[0] = process.env.ID_SENSOR_0;
if (process.env.ID_SENSOR_1) sensors[1] = process.env.ID_SENSOR_1;
if (process.env.ID_SENSOR_2) sensors[2] = process.env.ID_SENSOR_2;
if (process.env.ID_SENSOR_3) sensors[3] = process.env.ID_SENSOR_3;

if (
  (sensors[0] == null) &&
  (sensors[1] == null) &&
  (sensors[2] == null) &&
  (sensors[3] == null)) {
  console.log('Fatal error, no sensors configured');
  process.exit(1);
}

exports.sensors = sensors;
