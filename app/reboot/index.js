const exec = require('child_process').exec;

module.exports = () => {
  exec('sudo reboot');
};
