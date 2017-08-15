const fs = require('fs');
const os = require('os');
const path = require('path');

let configFile = '/boot/ds_config.json';
if (process.platform==='darwin') {
  configFile = './boot/ds_config.json';
}

let dsConfig = fs.readFileSync(configFile, 'UTF-8');
dsConfig = JSON.parse(dsConfig);
let env = dsConfig.env;

config = {
  dev: {
    configPath: './boot/config.txt',
    dsConfigPath: './boot/ds_config.json',
    isDev: env==='dev',
    savePath: path.join(os.homedir(), 'serverid'),
    serviceUrl: dsConfig.serviceUrl
  },
  staging: {
    configPath: '/boot/config.txt',
    dsConfigPath: '/boot/ds_config.json',
    isDev: env==='dev',
    savePath: path.join(os.homedir(), 'serverid'),
    serviceUrl: dsConfig.serviceUrl
  },
  production: {
    configPath: '/boot/config.txt',
    dsConfigPath: '/boot/ds_config.json',
    isDev: env==='dev',
    savePath: path.join(os.homedir(), 'serverid'),
    serviceUrl: dsConfig.serviceUrl
  }
}[env];

config.apiToken = dsConfig.env!=='dev' ? dsConfig.apiToken : '123';

module.exports = config;
