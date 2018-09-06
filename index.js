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
         type: 'select',
         name: 'style',
         label: 'Widget Type',
         choices: [
            {
               label: 'Latest',
               value: 'latest',
               showFields: [
                  'username', 'columns', 'limit',
               ],
            },
            {
               label: 'Single',
               value: 'single',
               showFields: [
                  'url',
               ],
            },
         ],
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
      },
      {
         type: 'integer',
         name: 'limit',
         label: 'Max image display',
         def: -1
      },
      {
         type: 'string',
         name: 'url',
         label: 'Instagram Post URL',
         required: true,
      },
   ],

   construct (self, options) {

      self.pushAssets = _.wrap(self.pushAssets, (superFn) => {
         self.pushAsset('stylesheet', 'always', { when: 'always', data: true });
         superFn();
      });

      self.load = _.wrap(self.load, load);
      self.sanitize = _.wrap(self.sanitize, sanitize);

      async function sanitize (superFn, req, input, callback) {
         superFn(req, input, (err, data) => {

            if (err) {
               return callback(err, data);
            }

            if (data.style !== 'single') {
               return callback(err, data);
            }


            if (!/^https?:\/\/(www\.)?instagram\.com\/p\//.test(data.url)) {
               return callback(new Error('URL must be an instagram image post URL'));
            }

            try {
               data._embed = oEmbed(req, data.url);
            }
            catch (e) {
               callback(e);
            }

         });
      }

      function load (superFn, req, widgets, callback) {
         const loaders = widgets.map(async (widget) => {

            if (widget.style === 'single') {
               return await singleWidget(req, widget);
            }

            widget.style = 'latest';
            if (widget.username) {
               return await latestWidget(widget);
            }

         });

         Promise.all(loaders)
            .then(() => superFn(req, widgets, callback))
            .catch((err) => callback(err));
      }

      async function singleWidget (req, widget) {
         try {
            widget._embed = await oEmbed(req, widget.url);
         }
         catch (e) {
            widget._embed = null;
         }
      }

      function oEmbed (req, url) {
         return new Promise((done, fail) => {
            self.apos.oembed.query(req, url, {}, (err, data) => {
               if (err) {
                  return fail(err);
               }

               data.html = data.html.replace(/<script[^>]*>.*<\/script[^>]*>/g, '');

               done(data);
            });
         });
      }

      async function latestWidget (widget) {
         const profileLoader = new InstagramProfileLoader(widget.username);
         if (_.get(self, 'apos.options.locals.offline') === true) {
            return widget._profile = null;
         }

         try {
            widget._profile = await profileLoader.get();
         }
         catch (e) {
            widget._profile = null;
         }
      }

   }

};
