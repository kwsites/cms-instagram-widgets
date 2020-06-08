const debug = require('debug');
const {get, wrap} = require('lodash');
const {InstagramProfileLoader} = require('./lib/instagram-profile-loader');

module.exports = {
   extend: 'apostrophe-widgets',

   label: 'Instagram Widget',

   verbose: false,

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

   beforeConstruct (self, options) {
      self.log = debug(self.__meta.name);
      if (options.verbose) {
         debug.enable(`${self.__meta.name}:*`);
      }
   },

   afterConstruct (self) {

      require('./lib/instagram-oembetter')(self, self.apos.oembed.oembetter);

   },

   construct (self, options) {

      self.pushAssets = wrap(self.pushAssets, (superFn) => {
         self.pushAsset('stylesheet', 'always', { when: 'always', data: true });
         superFn();
      });

      self.load = wrap(self.load, load);
      self.sanitize = wrap(self.sanitize, sanitize);

      function sanitize (superFn, req, input, callback) {
         const log = self.log.extend('sanitize');
         superFn(req, input, async (err, data) => {

            if (err) {
               log('apostrophe-widgets error: "%s"', err);
               return callback(err, data);
            }

            if (data.style !== 'single') {
               log('early return for data.style="%s"', data.style);
               return callback(err, data);
            }

            if (!/^https?:\/\/(www\.)?instagram\.com\/p\//.test(data.url)) {
               log('url error, must be instagram.com/p, got "%s"', data.url);
               return callback(new Error('URL must be an instagram image post URL'));
            }

            try {
               data._embed = await oEmbed(req, data.url);
               log('successfully loaded "%s"', data.url);
               callback(null, data);
            }
            catch (e) {
               log('error: "%s"', e);
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
         const log = self.log.extend('singleWidget');
         try {
            log('"%s" - loading', widget.url);
            widget._embed = await oEmbed(req, widget.url);
            log('"%s" - finished', widget.url);
         }
         catch (e) {
            log('"%s" - error %s', widget.url, e);
            widget._embed = null;
         }
      }

      function oEmbed (req, url) {
         return new Promise((done, fail) => {

            self.apos.oembed.query(req, url.replace(/\?.+$/, ''), {neverOpenGraph: true}, (err, data) => {

               if (err) {
                  return fail(err);
               }

               data.html = data.html.replace(/<script[^>]*>.*<\/script[^>]*>/g, '');

               done(data);
            });
         });
      }

      async function latestWidget (widget) {
         const log = self.log.extend('latestWidget');
         log(widget.username);

         const profileLoader = new InstagramProfileLoader(widget.username);
         if (get(self, 'apos.options.locals.offline') === true) {
            log(`offline-mode: profile not loaded`);
            return widget._profile = null;
         }

         try {
            widget._profile = await profileLoader.get();
            log('%s successfully loaded', widget.username);
         }
         catch (e) {
            log('%s error %s', widget.username, e);
            widget._profile = null;
         }
      }

   }

};
