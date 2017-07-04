const config = require('./config');
const fetch = require('node-fetch');
const fs = require('fs');
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
  win.on('closed', () => {
    win = null;
  });

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
    if (!json.id)
      return register().then(() => checkExistence());
    device = Object.assign({}, device, json);
    console.log(device);

    if (device.rotation)
      screenRotation.set(device.rotation);
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
  clearTimeout(playlistTimer);
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
    list.length>0 ? changeUrl(0) : emptyPlaylist();
  } else {
    getPlaylist()
    .then(playlist => {
      list=playlist.items;
      list.length>0 ? changeUrl(0) : emptyPlaylist();
    })
    .catch(err => console.log(err));
  }
};

app.on('ready', initializeApp);

app.on('window-all-closed', () => {
  app.quit();
});

const emptyPlaylist = () => {
  clearTimeout(playlistTimer);
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'empty.html'),
    protocol: 'file:',
    slashes: true
  }));
};

let heartbeatInterval;
const setupSocket = () => {
  const socket = require('socket.io-client').connect(config.serviceUrl);

  socket.on('connect', () => {
    clearInterval(heartbeatInterval);
    // socket connected
    socket.emit('heartbeat', { id: device.id });
    heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { id: device.id });
    }, 10000);

    console.log('Connected to socket');
  });

  socket.on('device', data => {
    console.log('Got device update');
    if (data.id === device.id && data.playlist_id !== device.playlist_id) {
      device.playlist_id = data.playlist_id;
      runPlaylist();
    }
  });

  socket.on('disconnect', () => {
    //TODO: check existence make sure not to create duplicate sockets
    clearInterval(heartbeatInterval);
    console.log('Disconnected from service');
  });

  socket.on('playlist', data => {
    if (data.device_id===device.id)
      runPlaylist(data);
  });

  socket.on('reboot', data => {
    if (data.id===device.id)
      !config.isDev ? reboot() : app.quit();
  });

  return socket;

};
