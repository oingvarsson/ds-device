const config = require('./config');
const path = require('path');
const url = require('url');
const {app, BrowserWindow} = require('electron');
const fs = require('fs');
const isDev = true;
const registerDevice = require('./registerDevice');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

const initializeApp = () => {
  let kiosk = isDev ? false : true;
  let windowOptions = {
    kiosk: kiosk,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false
    }
  };
  if (isDev) {
    windowOptions.height = 600;
    windowOptions.width = 900;
  }

  win = new BrowserWindow(windowOptions);

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  let dsConfig = fs.readFileSync(config.dsConfigPath, 'utf8');
  let device = JSON.parse(dsConfig);
  if (!device.id) {
    registerDevice(device)
    .then(res => console.log(res));
  }

  runPlaylist();
};

function runPlaylist () {


  let uris = ['http://ica.se', 'http://coop.se', 'http://willys.se', 'http://www.nyhetsbolaget.se'];

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
