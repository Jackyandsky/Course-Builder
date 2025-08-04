const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const publicDir = path.join(__dirname, '../public');
const logoDir = path.join(publicDir, 'logo');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir);
}

// Copy logo file
const sourcePath = path.join(__dirname, '../logo/igps_logo.png');
const destPath = path.join(logoDir, 'igps_logo.png');

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log('Logo copied successfully to public/logo/igps_logo.png');
} catch (error) {
  console.error('Error copying logo:', error);
}