const {config: { mongodb_port: port } } = require('./package.json');

module.exports = {
   mongodbMemoryServerOptions: {
      binary: {
         version: '4.0.3',
         skipMD5: true
      },
      autoStart: false,
      instance: {
         port
      }
   }
};
