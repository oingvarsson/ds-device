const config = require('../config');
const fetch = require('node-fetch');
const fs = require('fs');

const saveDevice = device => {
  return new Promise((resolve, reject) => {
    fs.writeFile(config.savePath, JSON.stringify(device), (err) => {
      if (err) reject(err);
      console.log('Registered with id: '+device.id);
      resolve(device);
    });
  });
};

module.exports = () => {
  console.log('Registering device');
  return fetch(config.serviceUrl+'/devices', {method: 'POST', body: JSON.stringify({})})
  .then(res => res.json())
  .then(json => saveDevice({id: json.id}))
  .catch(err => console.log(err));
};
