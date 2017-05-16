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
  let configFile = fs.readFileSync(config.dsConfigPath, 'utf8');
  let serviceUrl = JSON.parse(configFile).serviceUrl;
  return fetch(serviceUrl+'/devices', {method: 'POST', body: JSON.stringify({})})
  .then(res => res.json())
  .then(json => saveDevice({id: json.id, serviceUrl: serviceUrl}))
  .catch(err => console.log(err));
};
