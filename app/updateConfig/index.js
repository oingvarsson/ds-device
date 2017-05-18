const config = require('../config');
const exec = require('child_process').exec;
const fs = require('fs');
const os = require('os');
const path = require('path');
const reboot = require('../reboot');

module.exports = (param, value) => {
  let configFile = fs.readFileSync(config.configPath, 'utf8');
  let rows = configFile.split(os.EOL);
  let paramFound=false;
  let tempPath = path.join(os.tmpdir(), 'tmpconfig.txt');

  rows.forEach((row, index) => {
    if (row.indexOf(param)===0) {
      if (paramFound) {
        rows[index]='';
      } else {
        rows[index]=param+value;
        paramFound=true;
      }
    }
  });

  if (!paramFound) {
    rows.push(param+value);
  }

  rows=rows.filter(r => r!=='');
  rows=rows.join(os.EOL);
  fs.writeFileSync(tempPath, rows, 'utf8');
  exec(`${config.isDev ? '' : 'sudo '}cp ${tempPath} ${config.configPath}`, (error, stdout, stderr) => {
    if (error)
      return console.log(error);
    console.log(stdout);
    console.log(stderr);
    if (!config.isDev)
      reboot();
  });
};
