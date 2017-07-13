const download = require('download');
const exec = require('child_process').exec;
const fs = require('fs');
const github = require('./github');
const isDev = require('../config').isDev;
const path = require('path');
const reboot = require('../reboot');

const owner = 'oingvarsson';
const repo = 'ds-device';
const appDir = '/home/pi/Documents/dsstest/resources/';

const getCurrentVersion = () => {
  console.log(path.join(__dirname, 'package.json'));
  const packageJson = fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8');
  const currentVersion = JSON.parse(packageJson).version;
  return currentVersion;
};

const getServerVersion = () => {
  return github.repos.getContent({
    repo: repo,
    owner: owner,
    path: 'app/package.json',
    ref: 'master'
  })
  .then(res => {
    const repoPackageJson = Buffer.from(res.data.content, 'base64').toString('utf8');
    const repoVersion = JSON.parse(repoPackageJson).version;
    return repoVersion;
  });
};

// compare
const checkForUpdate = () => {
  const currentVersion = getCurrentVersion();
  return getServerVersion().then(serverVersion => {
    if (serverVersion!==currentVersion)
      return updateApp().then(() => reboot());
    return 'Version is up to date';
  });
};

// updateApp
const updateApp = () => {
  console.log('Updating...');
  return github.repos.getArchiveLink({
    owner: owner,
    repo: repo,
    archive_format: 'zipball',
    ref: 'master'
  })
  .then(res => {console.log(res.meta.location); return res;})
  .then(res => download(res.meta.location, '/tmp', {filename: 'ds-client-update.zip', extract: true}))
  .then(res => npmInstall('/tmp/'+res[0].path+'/app'))
  .then(dir => moveApp(dir));
};

const runCommand = command => {
  return new Promise((resolve, reject) => {
    const output = (error, stdout) => {
      if (error) reject(error);
      console.log(stdout);
      resolve(stdout);
    };
    exec(command, output);
  });
};

const npmInstall = dir => {
  return runCommand(`cd ${dir}; npm install;`)
  .then(() => dir);
};

const moveApp = dir => {
  const command = isDev ? 'ls -la' : `rm -r ${appDir}/app; mv ${dir} ${appDir}.;`;
  console.log(command);
  return runCommand(command);
};

const update = () => {
  checkForUpdate()
  .then(res => console.log(res))
  .catch(err => console.error(err));
};

module.exports = {
  update: update,
  version: getCurrentVersion
};
