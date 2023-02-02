//
// Module used to handle http routes and return
// temperature data that had been previously stored in
// global variables
//
'use strict';

// seconds
const dataExpiration = 180;

module.exports = function (index) {
  if ((index < -1) || (index > 3)) {
    // Fall through to 404 not found
    return function (req, res, next) {
      return next();
    };
  } else if (index === -1) {
    // Index -1 will return all sensors
    return function (req, res, next) {
      const now = new Date();
      const nowSeconds = Math.floor(now.getTime() / 1000);
      // Deep copy
      const responseArray = JSON.parse(JSON.stringify(global.gv.cache));
      // Check each sensor to see if data is expired
      for (let i = 0; i < 4; i++) {
        if ((responseArray[i].error === 0) &&
          (nowSeconds - responseArray[i].timestamp >= dataExpiration)) {
          responseArray[i].data = -100;
          responseArray[i].error = 10;
          responseArray[i].errorMessage =
            'Expired timestamp for sensor ' + i.toString();
        }
      }
      return res.json(responseArray);
    }; // return function (req, res, next) {
  } else {
    // Case of index 0 to 3
    return function (req, res, next) {
      const now = new Date();
      const nowSeconds = Math.floor(now.getTime() / 1000);
      if ((global.gv.cache[index].error === 0) &&
        (nowSeconds - global.gv.cache[index].timestamp > dataExpiration)) {
        global.gv.cache[index].data = -100;
        global.gv.cache[index].error = 10;
        global.gv.cache[index].errorMessage =
          'Expired timestamp for sensor ' + index.toString();
      }
      return res.json(global.gv.cache[index]);
    };
  } // return function (req, res, next) {
}; // module.exports = function (index) {
