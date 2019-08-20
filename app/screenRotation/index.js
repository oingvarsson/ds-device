const { exec } = require('child_process');
const os = require('os');

const parseXrandr = input => {
  const rows = input.split(os.EOL);
  const theRow = rows.find(r => r.includes('primary'));
  const parts = theRow.split(' (')[0].split(' ');
  const thePart = parts[parts.length-1];
  switch (thePart) {
    case 'left':
      return 1;
    case 'inverted':
      return 2;
    case 'right':
      return 3;
    default:
      return 0;
  }
}

const get = () => {
  return new Promise((resolve, reject) => {
    exec('xrandr', (err, stdout, stderr) => {
      if (err)
        reject(err);
      resolve(parseXrandr(stdout));
    });
  })
};

const rotate = rotation => {
  console.log(`Setting rotation to ${rotation}`);
  exec(`xrandr -o ${rotation}`, (err, stdout, stderr) => {
    if (err) {
      console.log('Failed to set rotation');
      return;
    }
    console.log(stdout);
  })
};

const set = newRotation => {
  newRotation = parseInt(newRotation);
  get()
  .then(rotation => rotation!==newRotation)
  .then(shouldChange => shouldChange ? rotate(newRotation) : false);
};

module.exports={
  set: set,
  get: get
};
