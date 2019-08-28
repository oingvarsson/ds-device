const os = require('os');

const macAdress = () => { //module.exports
  const ifaces = os.networkInterfaces();
  let macs = [];
  for (let iface in ifaces) {
    macs.push(...ifaces[iface]);
  }
  macs = macs.filter(ip => ip.family.toLowerCase()==='ipv4' && !ip.internal);

  macs.forEach(console.log);

  const mac = macs.map(ip => ip.mac).join(' / ');
  return mac;
};

console.log(macAdress());
