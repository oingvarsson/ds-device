module.exports = {
  dev: {
    configPath: './boot/config.txt',
    dsConfigPath: './boot/ds_config.json'
  },
  staging: {
    configPath: '/boot/config.txt',
    dsConfigPath: '/boot/ds_config.json'
  },
  production: {
    configPath: '/boot/config.txt',
    dsConfigPath: '/boot/ds_config.json'
  }
}[process.env.NODE_ENV || 'dev'];
