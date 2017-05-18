const config = require('../config');
const fetch = require('node-fetch');
const moment = require('moment');
const reboot = require('../reboot');

let heartbeatInterval;
let errorCount = 0;

module.exports = device => {
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    fetch(device.serviceUrl+'/heartbeat', {method: 'PUT', body: {id: device.id, currentTime: moment().format()}})
    .then(res => {
      if (res.status!==200) {
        throw new Error('Unable to contact service');
      }
      else {
        errorCount = 0;
        res.json();
      }
    })
    .then(json => console.log(json))
    .catch(() => {
      console.log('Unable to contact service. Attempt: '+errorCount);
      errorCount++;
      if (errorCount>10 && !config.isDev) {
        clearInterval(heartbeatInterval);
        reboot();
      }
    });
  }, 5000);
};
