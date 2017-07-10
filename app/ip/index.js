const os = require('os');

module.exports = () => {
  const ifaces = os.networkInterfaces();
  let ips = [];
  for (let iface in ifaces) {
    ips.push(...ifaces[iface]);
  }
  ips = ips.filter(ip => ip.family.toLowerCase()==='ipv4' && !ip.internal);

  const ip = ips.map(ip => ip.address).join(' / ');
  return ip;
};
