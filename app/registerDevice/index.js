const config = require('../config');
const fetch = require('node-fetch');
const fs = require('fs');

const saveDevice = device => {
  return new Promise((resolve, reject) => {
    fs.writeFile(config.dsConfigPath, JSON.stringify(device) , 'utf8', (err) => {
      if (err) reject(err);
      resolve('Registered!');
    });
  });
};

module.exports = (device) => {
  return fetch(device.serviceUrl+'/devices', {method: 'POST', body: JSON.stringify({})})
  .then(res => res.json())
  .then(json => saveDevice(Object.assign({}, device, {id: json.id})))
  .catch(err => console.log(err));
};
