const {promiseError} = require('@kwsites/promise-result');
const debug = require('debug');
const {get, wrap} = require('lodash');

module.exports = {
   extend: 'apostrophe-widgets',

   defer: true,

   label: 'Instagram Widget',

   verbose: false,

   galleryUserName: '',

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
      self.log = debug(options.logName || self.__meta.name);
      if (options.verbose) {
         debug.enable(`${ self.__meta.name }:*`);
      }
   },

   afterConstruct (self) {

      self.enableCache();
      require('./lib/instagram-oembetter')(self, self.apos.oembed.oembetter);

   },

   construct (self, options) {

      self.isWorkingOffline = () => get(self, 'apos.options.locals.offline') === true;
      self.getAuthConfig = (req) => self.getOption(req, 'auth');

      require('./lib/instagram-profile-cache')(self, options);
      require('./lib/instagram-anon-profile-loader')(self, options);
      require('./lib/instagram-auth-profile-loader')(self, options);

      require('./lib/latest-gallery-widget')(self, options);
      require('./lib/single-embed-widget')(self, options);

      self.pushAssets = wrap(self.pushAssets, (superFn) => {
         self.pushAsset('stylesheet', 'always', {when: 'always', data: true});
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
            } catch (e) {
               log('error: "%s"', e);
               callback(e);
            }

         });
      }

      const widgetReqCache = new WeakMap();
      self.widgetReq = (widget, req) => {
         if (arguments.length === 2) {
            widgetReqCache.set(widget, req);
         }
         return widgetReqCache.get(widget);
      };

      async function load (superFn, req, widgets, callback) {
         self.log(`load widgets(%s)`, widgets.length);
         const loaders = widgets.map(async (widget) => {
            self.widgetReq(widget, req);

            if (widget.style === 'single') {
               self.log(`load single widget, %O`, widget);
               return await self.loadSingleEmbedWidget(req, widget);
            }

            let username;
            if ((username = widget.username)) {
               self.log(`load gallery widget for %s, set in widget configuration`, username);
            }
            else if ((username = self.getOption(req, 'galleryUserName'))) {
               self.log(`load gallery widget for %s, read from 'getOption("galleryUserName")`, username);
            }
            else {
               self.log(`load gallery widget unable to find username`);
               return;
            }

            Object.assign(widget, await self.latestGalleryWidget(req, username));
         });

         const err = await promiseError(Promise.all(loaders));
         if (err) {
            self.log('load:error %o', err);
            return callback(err);
         }

         self.log('load:complete %O', widgets);
         superFn(req, widgets, callback);
      }
   }

};
