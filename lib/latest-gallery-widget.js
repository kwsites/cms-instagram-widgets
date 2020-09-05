const {promiseResult} = require('@kwsites/promise-result');

module.exports = (self) => {

   const log = self.log.extend('latest-gallery-widget');

   Object.assign(self, {
      latestGalleryWidget,
      getLatestGalleryLoader,
   });

   async function latestGalleryWidget (req, _username) {
      const style = 'latest';
      if (!_username) {
         return {_username, style};
      }

      return {
         _username,
         _profile: await loadGallery(req, _username),
         style,
      };
   }

   async function loadGallery (req, username) {
      if (!username) {
         log('loadGallery called without a username to load');
         return null;
      }

      const {profile: fromCache} = await self.getCachedResult(username);
      if (fromCache) {
         log('loadGallery: %s: restore from cache', username);
         return fromCache;
      }

      if (self.isWorkingOffline()) {
         log('loadGallery: %s: loading gallery disabled when working offline');
         return null;
      }

      const [type, loader] = self.getLatestGalleryLoader(req);
      await self.emit('beforeLoad', {type, loader, username});
      const {error, value: profile = null} = await promiseResult(loader(req, username));

      if (error || !profile) {
         log('error: %s %o', username, cacheResult(username, error || 'resolves to an empty profile'));
      }
      else {
         log('success: %s (%s) has %d media items',
            cacheResult(username, error, profile).userName, profile.name, profile.media.length);
      }

      await self.emit('afterLoad', {profile, username});

      return profile || null;
   }

   function getLatestGalleryLoader (req) {
      const auth = self.getAuthConfig(req);
      const validationErrors = auth && self.validateAuthConfig(req);
      if (validationErrors) {
         log('auth config errors: %s', validationErrors);
      }

      if (auth && !validationErrors) {
         log('select: authenticatedLoadProfile');
         return ['auth', self.authenticatedLoadProfile];
      }

      log('select: anonymousLoadProfile');
      return ['anon', self.anonymousLoadProfile];
   }

   function cacheResult (userName, error = null, profile = null) {
      setImmediate(() => self.setCachedResult(userName, error && String(error), profile));
      return profile || error;
   }

};
