const config = require('../config');
const fs = require('fs');
const os = require('os');
const updateConfig = require('../updateConfig');

const set = newRotation => {
  get()
  .then(rotation => rotation!==newRotation)
  .then(shouldChange => shouldChange ? updateConfig('display_rotate=', newRotation) : null);
};

const get = () => {
  return new Promise((resolve, reject) => {
    let configFile = fs.readFileSync(config.configPath, 'utf8');
    if (!configFile)
      reject('Unable to read config file');

    let currentRotation = configFile.split(os.EOL).find(row => row.indexOf('display_rotate=')===0);

    if (currentRotation)
      resolve(currentRotation.split('=')[1]);
    else
      resolve(0);
  });
};

module.exports={
  set: set,
  get: get
};

set(0);
