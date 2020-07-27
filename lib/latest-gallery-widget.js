const {promiseResult} = require('@kwsites/promise-result');
const {get} = require('lodash');

module.exports = (self, {auth}) => {

   const log = self.log.extend('latest-widget');

   Object.assign(self, {
      latestGalleryWidget,
      getLatestGalleryLoader,
   });

   async function latestGalleryWidget (widget) {
      const username = widget.username;
      log('load: %s', username);

      widget._profile = null;

      if (attachProfile(widget, await self.getCachedResult(username))) {
         log('cached: %s', username);
         return;
      }

      if (isWorkingOffline()) {
         log('offline: no profile loaded');
         return;
      }

      const loader = self.getLatestGalleryLoader();
      const {error, value: profile = null} = await promiseResult(loader(username));

      if (error) {
         log('error: %s %o', username, error);
         cacheResult(username, error);
      }
      else if (attachProfile(widget, {profile})) {
         cacheResult(username, error, profile);
         log('success: %s (%s) has %d media items', profile.userName, profile.name, profile.media.length);
      }
   }

   function cacheResult (userName, error = null, profile = null) {
      setImmediate(() => self.setCachedResult(userName, error && String(error), profile));
   }

   function attachProfile (widget, {error, profile}) {
      widget._profile = profile;
      return !!(error || profile);
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
