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
  retry++;
  if (retry>3) {
    console.log('Unable to register with service');
    if (!config.isDev)
      return reboot();
  }
  console.log(device);
  fetch(device.serviceUrl+'/devices/'+device.id)
  .then(res => res.json())
  .then(json => {
    if (!json.id)
      return register().then(() => checkExistence());
    device = Object.assign({}, device, json);
    console.log(device);

    if (device.rotation)
      screenRotation.set(device.rotation);

    runPlaylist();
  })
  .catch(() => {
    console.log('Unable to connect to service. Retrying in 10 seconds...');
    setTimeout(() => checkExistence(), 10000);
  });
};

const register = () => {
  return registerDevice()
    .then(res => {
      device = res;
    });
};

function runPlaylist () {


  let uris = ['https://www.youtube.com/tv#/watch/video/idle?v=Cimp-eTe3MU', 'http://ica.se', 'http://coop.se', 'http://willys.se', 'http://www.nyhetsbolaget.se'];

  const changeUrl = (index) => {
    win.loadURL(uris[index]);
    index++;
    if (index>uris.length-1)
      index=0;
    setTimeout(() => changeUrl(index), 30000);
  };

  changeUrl(0);

  // Open the DevTools.
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', initializeApp);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});
