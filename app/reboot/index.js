const exec = require('child_process').exec;
const config = require('../config');

module.exports = () => {
  if (!config.isDev)
    exec('sudo reboot');
  else
    process.exit(0);
};
