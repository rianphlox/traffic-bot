const fs = require('fs').promises;
const path = require('path');

const androidDevices = [
  { model: 'SM-G998B', os: '13', browser: 'Chrome/120.0.6099.230' },
  { model: 'Pixel 6 Pro', os: '12', browser: 'Chrome/119.0.6045.163' },
  { model: 'SM-A546E', os: '14', browser: 'Chrome/121.0.6167.178' },
  { model: 'OnePlus 9', os: '11', browser: 'Chrome/118.0.5993.65' },
  { model: 'Redmi Note 12 Pro', os: '13', browser: 'Chrome/120.0.6099.144' },
  // Add more models, OS versions, browsers for variety
];
const iosDevices = [
  { device: 'iPhone', os: '17_2', browser: 'Version/17.2' },
  { device: 'iPad', os: '16_6', browser: 'Version/16.6' },
  { device: 'iPhone', os: '18_0', browser: 'Version/18.0' },
  { device: 'iPhone', os: '17_1_2', browser: 'Version/17.1.2' },
  { device: 'iPad', os: '15_7', browser: 'Version/15.7' },
  // Add more devices, OS versions
];
const windowsDevices = [
  { os: 'Windows NT 10.0', browser: 'Chrome/120.0.0.0' },
  { os: 'Windows NT 10.0', browser: 'Chrome/121.0.0.0' },
  { os: 'Windows NT 11.0', browser: 'Chrome/120.0.0.0' },
  { os: 'Windows NT 10.0', browser: 'Firefox/110.0' },
  { os: 'Windows NT 10.0', browser: 'Edge/120.0.0.0' },
  // Add more OS versions, browsers
];

const generateUserAgents = () => {
  const userAgents = { android: [], ios: [], windows: [] };
  // Generate 170 Android user agents
  for (let i = 0; i < 170; i++) {
    const device = androidDevices[i % androidDevices.length];
    const osVersion = parseInt(device.os) + (i % 3);
    userAgents.android.push(
      `Mozilla/5.0 (Linux; Android ${osVersion}; ${device.model} Build/${String.fromCharCode(65 + (i % 26))}${i}A.${200000 + i}.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ${device.browser} Mobile Safari/537.36`
    );
  }
  // Generate 170 iOS user agents
  for (let i = 0; i < 170; i++) {
    const device = iosDevices[i % iosDevices.length];
    const osVersion = device.os.split('_')[0] + '_' + (parseInt(device.os.split('_')[1] || 0) + (i % 3));
    userAgents.ios.push(
      `Mozilla/5.0 (${device.device}; CPU ${device.device === 'iPhone' ? 'iPhone OS' : 'OS'} ${osVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ${device.browser} Mobile/15E148 Safari/604.1`
    );
  }
  // Generate 170 Windows user agents
  for (let i = 0; i < 170; i++) {
    const device = windowsDevices[i % windowsDevices.length];
    userAgents.windows.push(
      `Mozilla/5.0 (${device.os}; Win64; x64${device.browser.includes('Firefox') ? '; rv:' + device.browser.split('/')[1] : ''}) ${device.browser.includes('Firefox') ? 'Gecko/20100101 Firefox/' + device.browser.split('/')[1] : `AppleWebKit/537.36 (KHTML, like Gecko) ${device.browser} Safari/537.36`}`
    );
  }
  return userAgents;
};

(async () => {
  const userAgents = generateUserAgents();
  await fs.writeFile(path.join(__dirname, 'user_agents.json'), JSON.stringify(userAgents, null, 2));
  console.log('Generated user_agents.json with 510 user agents');
})();