
const _ = require('lodash');
const {InstagramProfileLoader} = require('./lib/instagram-profile-loader');

module.exports = {
   extend: 'apostrophe-widgets',
   label: 'Instagram Widget',
   addFields: [
      {
         type: 'string',
         name: 'title',
         label: 'Title'
      },
      {
         type: 'string',
         name: 'username',
         label: 'User name'
      },
      {
         type: 'integer',
         name: 'columns',
         label: 'Grid Column Count',
         def: 3
      }
   ],

   construct (self, options) {

      self.pushAssets = () => {
         self.pushAsset('stylesheet', 'always', {when: 'always'});
      };

      self.load = _.wrap(self.load, load);

      function load (superFn, req, widgets, callback) {
         const loaders = widgets.map(async (widget) => {
            const profileLoader = new InstagramProfileLoader(widget.username);
            try {
               widget._profile = await profileLoader.get();
            }
            catch (e) {
               widget._profile = null;
            }
         });

         Promise.all(loaders)
            .then(() => superFn(req, widgets, callback))
            .catch((err) => callback(err));
      }
   },

   afterConstruct (self) {
      self.pushAssets();
   },

};
