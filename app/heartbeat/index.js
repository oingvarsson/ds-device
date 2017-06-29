const config = require('../config');
const fetch = require('node-fetch');
const reboot = require('../reboot');

let heartbeatInterval;
let errorCount = 1;

module.exports = device => {
  clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    fetch(config.serviceUrl+'/heartbeat/'+device.id, {method: 'PUT'})
    .then(res => {
      if (res.status!==200) {
        throw new Error('Unable to contact service');
      }
      else {
        errorCount = 0;
      }
    })
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
