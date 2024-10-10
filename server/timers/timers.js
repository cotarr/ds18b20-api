(function () {
  'use strict';
  // ------------------------------------------
  // This module is a background task used to
  // read the sensors using a 60 second timer.
  // Errors will be retired in 10 second intervals
  // The data is added to the  global array
  // for use by the web server.
  // ------------------------------------------
  //
  const fs = require('fs');
  const config = require('../../config/');

  const nodeEnv = process.env.NODE_ENV || 'development';

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
      // this is used to build filename and must not be null
      if (config.sensors[index] == null) {
        console.log('Fatal error, attempting to read sensor ID of null');
        process.exit(1);
      }
      // Local variables
      let sensorTimestamp = 0;
      let sensorError = 0;
      let sensorErrorMessage = '';
      let sensorData = -100;

      //
      // Use the Raspberry Pi device tree overlay to access data from the
      // 1-Wire serial bus.
      //
      const fileName = '/sys/bus/w1/devices/' + config.sensors[index] + '/w1_slave';
      //
      // Attempt to read the data using a callback function
      //
      fs.readFile(fileName, 'utf8', function (err, dataString) {
        if (err) {
          const now = new Date();
          const nowSeconds = Math.floor(now.getTime() / 1000);
          // Case of directory name or file name not found
          if (err.code === 'ENOENT') {
            sensorTimestamp = nowSeconds;
            sensorData = -100;
            sensorError = 3;
            sensorErrorMessage =
              'Sensor ' + index.toString() + ' files not found in device tree';
          } else if (err.code === 'EACCES') {
            sensorTimestamp = nowSeconds;
            sensorData = -100;
            sensorError = 3;
            sensorErrorMessage =
              'Insufficient file permission to read sensor ' + index.toString();
          } else {
            // Case of other file I/O Error
            sensorTimestamp = nowSeconds;
            sensorData = -100;
            sensorError = 3;
            sensorErrorMessage =
              'Unidentified I/O error reading sensor ' + index.toString();
          }
        } else {
          // console.log(dataString);
          //
          // Expect:
          //
          // b3 ff 4b 46 7f ff 0c 10 65 : crc=65 YES
          // b3 ff 4b 46 7f ff 0c 10 65 t=-4812
          //
          const now = new Date();
          const nowSeconds = Math.floor(now.getTime() / 1000);
          sensorTimestamp = nowSeconds;
          sensorData = -100;
          sensorError = 0;
          sensorErrorMessage = '';
          if (typeof dataString !== 'string') {
            sensorError = 4;
            sensorErrorMessage = 'Wrong data type returned from sensor ' + index.toString();
          }
          // Check for sensor communication error
          if ((sensorError === 0) && (dataString.length === 0)) {
            sensorError = 5;
            sensorErrorMessage = 'Zero length string returned from sensor ' + index.toString();
          }
          // Check for sensor CRC data error from w1_bus_master1 driver, YES === no error
          if ((sensorError === 0) && (dataString.indexOf('YES') < 0)) {
            sensorError = 6;
            sensorErrorMessage = 'CRC error from sensor ' + index.toString();
          }
          if (sensorError === 0) {
            try {
              // decode the sensor response and parse data value.
              sensorData = parseInt(dataString.split('t=')[1].replace('\n', ''));
            } catch (parseError) {
              // console.log(parseError.toString() || parseError);
              sensorError = 7;
              sensorErrorMessage = 'Number conversion error for sensor ' + index.toString();
            }
          }
          if ((sensorError === 0) && (isNaN(sensorData))) {
            sensorData = -100;
            sensorError = 8;
            sensorErrorMessage = 'Type conversion produced NaN for sensor ' + index.toString();
          }
          // DS18b20 range is -55 to +125 Degrees C
          // In this case, leave the reading
          if ((sensorError === 0) &&
          ((sensorData < -55000) || (sensorData > 125000))) {
            sensorError = 9;
            sensorErrorMessage =
            'Value out of range for sensor ' + index.toString();
          }
          // Convert to degrees celsius with 3 significant decimal places
          if (sensorError === 0) {
            sensorData = sensorData / 1000;
            sensorData = parseFloat(sensorData.toFixed(3));
          }
        }
        if (sensorError === 0) {
          // Sensor read is successful, cache the value for web server to use
          global.gv.sensorRetryCount[index] = 0;
          global.gv.cache[index].timestamp = sensorTimestamp;
          global.gv.cache[index].data = sensorData;
          global.gv.cache[index].error = 0;
          global.gv.cache[index].errorMessage = '';
        } else {
          // Sensor read error, retry until count exceeded
          global.gv.sensorRetryCount[index]++;
          if (global.gv.sensorRetryCount[index] > 5) {
            global.gv.cache[index].timestamp = sensorTimestamp;
            global.gv.cache[index].data = -100;
            global.gv.cache[index].error = sensorError;
            global.gv.cache[index].errorMessage = sensorErrorMessage;
          }
          //
          // Debug code to show sensor errors
          //
          // const ts = new Date(sensorTimestamp * 1000);
          // const tsStr = ts.toISOString();
          // const rtCount = global.gv.sensorRetryCount[index];
          // console.log(rtCount, tsStr, sensorData, sensorError, sensorErrorMessage);
          // console.log(dataString);
        }
      }); // fs.readFile(fileName, 'utf8', function (err, dataString)
    } // _readSensor (index) {

    // Read Each configured Sensor
    if (config.sensors[0]) _readSensor(0);
    if (config.sensors[1]) _readSensor(1);
    if (config.sensors[2]) _readSensor(2);
    if (config.sensors[3]) _readSensor(3);
  }; // function cacheData () {

  // counter for timer callback
  let timerUpCounterSeconds = 0;

  // timer callback function 1/second
  const handleTimer = function () {
    timerUpCounterSeconds++;
    // If retry needed, use shorter interval
    let requestRetry = false;
    for (let i = 0; i < 4; i++) {
      // If not uninitialized sensor and not sensor not configured
      if (global.gv.cache[i].error > 1) {
        requestRetry = true;
      }
    }
    if (requestRetry) {
      // Error retry handler
      if (timerUpCounterSeconds >= 10) {
        timerUpCounterSeconds = 0;
        cacheData();
      }
    } else {
      // This is time normal interval for data update
      if (timerUpCounterSeconds >= updateIntervalSeconds) {
        timerUpCounterSeconds = 0;
        // update time series in global variables
        cacheData();
      }
    }
  };

  //
  // Module initialization function
  //
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
      ],
      sensorRetryCount: [0, 0, 0, 0]
    };
    // identify configured sensors. Update the initialization error message.
    for (let i = 0; i < 4; i++) {
      if (config.sensors[i] != null) {
        global.gv.cache[i].error = 2;
        global.gv.cache[i].errorMessage = 'Sensor ' + i.toString() + ' waiting to read data';
      }
    }
    //
    // Interval timer
    //
    setInterval(handleTimer.bind(this), 1000);
    // Do one time on program start
    cacheData();
  };
}());
