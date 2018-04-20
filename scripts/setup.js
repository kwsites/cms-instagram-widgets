
const pkg = require('../package.json');
const peers = Object.keys(pkg.peerDependencies || {}).map(lib => `${ lib }@"${ pkg.peerDependencies[lib] }"`).join(' ');

console.log('Installing peer dependencies', peers);
require('child_process').execSync(`npm install --no-save ${ peers }`);
