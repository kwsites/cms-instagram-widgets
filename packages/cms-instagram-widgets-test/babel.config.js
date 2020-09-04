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
   ]
};
