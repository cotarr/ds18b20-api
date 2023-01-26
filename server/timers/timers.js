(function () {
  'use strict';
  // ------------------------------------------
  // This module is a background task used to
  // read the sensors using a 60 second timer.
  // The data is added to the  global array
  // for use by the web server.
  // ------------------------------------------
  //
  const fs = require('fs');
  const config = require('../../config/');

  const nodeEnv = process.env.NODE_ENV || 'development'; // eslint-disable-line no-unused-vars

  const updateIntervalSeconds = 60;

  //
  // Called by the 60 second timer to
  // initiate read operation on the temperature sensor(s)
  //
  function cacheData () {
    //
    // Internal function called with sensor index = 0, 1, 2, or 3
    //
    function _readSensor (index) {
      if ((index < 0) || (index > 3)) {
        console.log('Fatal error, sensor index out of range');
        process.exit(1);
      }
      if (config.sensors[index] == null) {
        console.log('Fatal error, attempting to read sensor ID of null');
        process.exit(1);
      }
      // Use the Raspberry Pi device tree overlay to access data from the
      // 1-Wire serial bus.
      //
      const fileName = '/sys/bus/w1/devices/' + config.sensors[index] + '/temperature';
      //
      // Attempt to read the data using a callback function
      //
      fs.readFile(fileName, 'utf8', function (err, dataString) {
        if (err) {
          const now = new Date();
          const nowSeconds = Math.floor(now.getTime() / 1000);
          // Case of directory name or file name out found
          if (err.code === 'ENOENT') {
            global.gv.cache[index].timestamp = nowSeconds;
            global.gv.cache[index].data = -100;
            global.gv.cache[index].error = 2;
            global.gv.cache[index].errorMessage =
              'Sensor ' + index.toString() + ' files not found in device tree';
          } else if (err.code === 'EACCES') {
            global.gv.cache[index].timestamp = nowSeconds;
            global.gv.cache[index].data = -100;
            global.gv.cache[index].error = 3;
            global.gv.cache[index].errorMessage =
              'Insufficient file permission to read sensor ' + index.toString();
          } else {
            // Case of other file I/O Error
            global.gv.cache[index].timestamp = nowSeconds;
            global.gv.cache[index].data = -100;
            global.gv.cache[index].error = 4;
            global.gv.cache[index].errorMessage =
              'Unidentified I/O error reading sensor ' + index.toString() + ' data';
          }
        } else {
          const now = new Date();
          const nowSeconds = Math.floor(now.getTime() / 1000);
          global.gv.cache[index].timestamp = nowSeconds;
          global.gv.cache[index].data = -100;
          global.gv.cache[index].error = 0;
          global.gv.cache[index].errorMessage = '';
          if (typeof dataString !== 'string') {
            global.gv.cache[index].error = 5;
            global.gv.cache[index].errorMessage = 'Wrong type error reading sensor';
          }
          if ((global.gv.cache[index].error === 0) && (dataString.length === 0)) {
            global.gv.cache[index].error = 6;
            global.gv.cache[index].errorMessage = 'Zero length string sensor ' + index.toString();
          }
          if (global.gv.cache[index].error === 0) {
            global.gv.cache[index].data = parseInt(dataString);
          }
          if ((global.gv.cache[index].error === 0) && (isNaN(global.gv.cache[index].data))) {
            global.gv.cache[index].data = -100;
            global.gv.cache[index].error = 7;
            global.gv.cache[index].errorMessage = 'Sensor type conversion produced NaN';
          }
          if (global.gv.cache[index].error === 0) {
            global.gv.cache[index].data = global.gv.cache[index].data / 1000;
            global.gv.cache[index].data = parseFloat(global.gv.cache[index].data.toFixed(3));
          }
          // DS18b20 range is -55 to +125 Degrees C
          // In this case, leave the reading
          if ((global.gv.cache[index].error === 0) &&
           ((global.gv.cache[index].data < -55) || (global.gv.cache[index].data > 125))) {
            global.gv.cache[index].error = 8;
            global.gv.cache[index].errorMessage =
              'Sensor  ' + index.toString() + ' value out of range';
          }
        }
      });
    } // _readSensor (index) {

    // Read Each configured Sensor
    if (config.sensors[0]) _readSensor(0);
    if (config.sensors[1]) _readSensor(1);
    if (config.sensors[2]) _readSensor(2);
    if (config.sensors[3]) _readSensor(3);
  }; // function cacheData () {

  // counter for timer callback
  let timerDownCounter = 0;

  // timer callback function 1/second
  const handleTimer = function () {
    timerDownCounter++;
    // This is time interval for update data
    if (timerDownCounter >= updateIntervalSeconds) {
      timerDownCounter = 0;
      // update time series in global variables
      cacheData();
    }
  };

  module.exports = function () {
    //
    // At program start, initial global data array
    //
    global.gv = {
      cache: [
        { id: 0, timestamp: 0, data: -100, error: 1, errorMessage: 'Sensor 0 not configured' },
        { id: 1, timestamp: 0, data: -100, error: 1, errorMessage: 'Sensor 1 not configured' },
        { id: 2, timestamp: 0, data: -100, error: 1, errorMessage: 'Sensor 2 not configured' },
        { id: 3, timestamp: 0, data: -100, error: 1, errorMessage: 'Sensor 3 not configured' }
      ]
    };
    //
    // Interval timer
    //
    setInterval(handleTimer.bind(this), 1000);
    // Do one time on program start
    cacheData();
  };
}());
