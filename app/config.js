process.env.NODE_ENV = process.platform==='darwin' ? 'dev' : 'staging';

const os = require('os');
const path = require('path');

module.exports = {
  dev: {
    dsConfigPath: './boot/ds_config.json',
    savePath: path.join(os.homedir(), 'serverid')
  },
  staging: {
    dsConfigPath: '/boot/ds_config.json',
    savePath: path.join(os.homedir(), 'serverid')
  },
  production: {
    dsConfigPath: '/boot/ds_config.json',
    savePath: path.join(os.homedir(), 'serverid')
  }
}[process.env.NODE_ENV || 'dev'];
