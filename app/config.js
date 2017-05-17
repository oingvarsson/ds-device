process.env.NODE_ENV = process.platform==='darwin' ? 'dev' : 'staging';

const os = require('os');
const path = require('path');

module.exports = {
  dev: {
    configPath: './boot/config.txt',
    dsConfigPath: './boot/ds_config.json',
    isDev: true,
    savePath: path.join(os.homedir(), 'serverid')
  },
  staging: {
    configPath: '/boot/config.txt',
    dsConfigPath: '/boot/ds_config.json',
    isDev: false,
    savePath: path.join(os.homedir(), 'serverid')
  },
  production: {
    configPath: '/boot/config.txt',
    dsConfigPath: '/boot/ds_config.json',
    isDev: false,
    savePath: path.join(os.homedir(), 'serverid')
  }
}[process.env.NODE_ENV || 'dev'];
