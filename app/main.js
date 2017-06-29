const config = require('./config');
const fetch = require('node-fetch');
const fs = require('fs');
const heartbeat = require('./heartbeat');
const path = require('path');
const reboot = require('./reboot');
const registerDevice = require('./registerDevice');
const screenRotation = require('./screenRotation');
const url = require('url');
const {app, BrowserWindow} = require('electron');

let win;
let device;
let retry = 0;
let playlistTimer;
let socket;

const initializeApp = () => {
  let kiosk = !config.isDev;
  let windowOptions = {
    kiosk: kiosk,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false
    }
  };
  if (config.isDev) {
    windowOptions.height = 600;
    windowOptions.width = 900;
  }

  win = new BrowserWindow(windowOptions);

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  let fileExists = fs.existsSync(config.savePath);
  if (!fileExists) {
    register().then(() => checkExistence());
  } else {
    device = fs.readFileSync(config.savePath, 'utf8');
    device = JSON.parse(device);
    console.log('Device has id: '+device.id);
    checkExistence();
  }
};

const checkExistence = () => {
  console.log('Checking existence');
  retry++;
  if (retry>12) {
    console.log('Unable to register with service');
    if (!config.isDev)
      return reboot();
    else
      app.quit();
  }
  fetch(config.serviceUrl+'/devices/'+device.id)
  .then(res => res.json())
  .then(json => {
    console.log(json);
    if (!json.id)
      return register().then(() => checkExistence());
    device = Object.assign({}, device, json);
    console.log(device);

    if (device.rotation)
      screenRotation.set(device.rotation);
    heartbeat(device);
    socket = setupSocket();
    runPlaylist();
  })
  .catch(err => {
    console.log(err);
    console.log('Unable to connect to service. Retrying in 10 seconds...');
    setTimeout(() => checkExistence(), 10000);
  });
};

const register = () => {
  return registerDevice()
    .then(res => {
      console.log('Device registered');
      device = res;
    });
};

const runPlaylist = playlist => {
  let list = [];

  const getPlaylist = () => {
    console.log('Getting playlist');
    return fetch(config.serviceUrl+'/playlists/'+device.playlist_id)
    .then(res => res.json());
  };

  const changeUrl = (index) => {
    clearTimeout(playlistTimer);
    let item = list[index];
    socket.emit('nowplaying', {device: device, asset: item.asset});
    win.loadURL(item.asset.url);
    index++;
    if (index>list.length-1)
      index=0;
    playlistTimer = setTimeout(() => changeUrl(index), item.duration*1000);
  };

  if (playlist) {
    console.log('Changing playlist');
    list = playlist.items;
    changeUrl(0);
  } else {
    getPlaylist()
    .then(playlist => list=playlist.items)
    .then(() => changeUrl(0))
    .catch(err => console.log(err));
  }

  win.on('closed', () => {
    win = null;
  });
};

app.on('ready', initializeApp);

app.on('window-all-closed', () => {
  app.quit();
});

const setupSocket = () => {
  const socket = require('socket.io-client').connect(config.serviceUrl);
  socket.on('connect', () => {
    // socket connected
    //socket.emit('server custom event', { my: 'data' });
    console.log('Connected to socket');
  });
  socket.on('playlist', data => {
    console.log(data);
    if (data.id===device.playlist_id)
      runPlaylist(data);
  });
  return socket;
};
