const fs = require('fs');

const set = newRotation => {
  let config = fs.readFileSync('./configWithoutRotate.txt', 'utf8');
  let rows = config.split('\n');
  let rotateFound=false;

  rows.forEach((row, index) => {
    if (row.indexOf('rotate=')===0) {
      if (rotateFound) {
        rows[index]='';
      } else {
        rows[index]='rotate='+newRotation;
        rotateFound=true;
      }
    }
  });

  if (!rotateFound) {
    rows.push('rotate='+newRotation);
  }

  rows=rows.filter(r => r!=='');
  rows=rows.join('\n');
  fs.writeFileSync('./config2.txt', rows, 'utf8');
  console.log(rows);
};

const get = () => {
  return new Promise((resolve, reject) => {
    let config = fs.readFileSync('./config.txt', 'utf8');
    console.log(config);
    let currentRotation = config.split('\n').find(row => row.indexOf('rotate=')===0);
    if (currentRotation)
      resolve(currentRotation);
    else
      reject('Rotation not found');
  });
};

get()
.then(res => console.log(res))
.catch(err => console.log(err));
