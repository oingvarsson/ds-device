const config = require('./config');
const fetch = require('node-fetch');
const fs = require('fs');
const ip = require('./ip');
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
let list;

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
    return reboot();
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
  list = [];

  const getPlaylist = () => {
    console.log('Getting playlist');
    return fetch(config.serviceUrl+'/playlist/'+device.playlist_id)
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
      list && list.length>0 ? changeUrl(0) : emptyPlaylist();
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

let startTimer;
const runPlaylistWithDelay = () => {
  clearTimeout(startTimer);
  startTimer = setTimeout(runPlaylist, 2000);
};

const setupSocket = () => {
  let heartbeatInterval;
  let rebootTimer;

  const socket = require('socket.io-client').connect(config.serviceUrl);

  socket.on('connect', () => {
    clearInterval(heartbeatInterval);
    clearTimeout(rebootTimer);
    // socket connected
    socket.emit('heartbeat', { id: device.id, ip: ip() });
    heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { id: device.id, ip: ip() });
    }, 10000);

    console.log('Connected to socket');
  });

  socket.on('disconnect', () => {
    clearTimeout(rebootTimer);
    clearInterval(heartbeatInterval);
    rebootTimer = setTimeout(reboot, 60000);
    console.log('Disconnected from service');
  });

  socket.on('asset', data => {
    if (list.find(li => li.asset.id==data.id)) runPlaylistWithDelay();
  });

  socket.on('deleted', data => {
    const {entity, id} = data;
    if (entity=='device' && device.id==id)
      reboot();
    if (entity=='playlist' && device.playlist_id==id) {
      device.playlist_id=null;
      runPlaylistWithDelay();
    }
    if (entity=='playlist_item' && list.find(li => li.id==id))
      runPlaylistWithDelay();
    if (entity=='asset' && list.find(li => li.asset.id==id))
      runPlaylistWithDelay();
  });

  socket.on('device', data => {
    if (data.id === device.id) {
      if (data.playlist_id !== device.playlist_id) {
        device.playlist_id = data.playlist_id;
        runPlaylistWithDelay();
      }
      if (data.rotation && data.rotation!=device.rotation) {
        screenRotation.set(data.rotation);
      }
      if (data.restart)
        reboot();
    }
  });

  socket.on('playlist_item', data => {
    if (list.find(li => li.id==data.id)) runPlaylistWithDelay();
  });

  socket.on('playlist', data => {
    if (data.id===device.playlist_id)
      runPlaylistWithDelay();
  });

  return socket;

};
