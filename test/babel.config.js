const joinPaths = require('path').join;

module.exports = {
   presets: [
      [
         '@babel/preset-env',
         {
            targets: {
               node: 'current',
            },
         },
      ],
   ],
   plugins: [
      ['module-resolver', {
         root: '.',
         alias: {
            '@kwsites/cms-instagram-widgets': joinPaths(__dirname, '..', 'src'),
         },
      }],
   ],
};
