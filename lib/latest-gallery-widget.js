const {promiseResult} = require('@kwsites/promise-result');
const {get} = require('lodash');

module.exports = (self, {auth}) => {

   const log = self.log.extend('latest-widget');

   Object.assign(self, {
      latestGalleryWidget,
      getLatestGalleryLoader,
   });

   async function latestGalleryWidget (widget) {
      log('load: %s', widget.username);

      widget._profile = null;

      if (attachProfile(widget, await self.getCachedProfile(widget.username))) {
         log('cached: %s', widget._profile.userName);
         return;
      }

      if (isWorkingOffline()) {
         log('offline: no profile loaded');
         return;
      }

      const loader = self.getLatestGalleryLoader();
      const {error, value: profile = null} = await promiseResult(loader(widget.username));

      if (error) {
         log('error: %s %o', widget.username, error);
      }

      if (attachProfile(widget, profile)) {
         cacheProfile(profile);
         log('success: %s (%s) has %d media items', profile.userName, profile.name, profile.media.length);
      }
   }

   function cacheProfile (profile) {
      setImmediate(() => self.setCachedProfile(profile));
   }

   function attachProfile (widget, profile) {
      return (widget._profile = profile || null) !== null;
   }

   function getLatestGalleryLoader () {
      const validationErrors = auth && self.validateAuthConfig();
      if (validationErrors) {
         log('auth config errors: %s', validationErrors);
      }

      if (auth && !validationErrors) {
         log('select: authenticatedLoadProfile');
         return self.authenticatedLoadProfile;
      }

      log('select: anonymousLoadProfile');
      return self.anonymousLoadProfile;
   }

   function isWorkingOffline () {
      return get(self, 'apos.options.locals.offline') === true;
   }

};
