const {promiseError, promiseResult} = require('@kwsites/promise-result');

module.exports = (self, {cacheTTL = 86400, errorTTL = 1200, cacheEnabled = true}) => {

   const log = self.log.extend('cache');

   Object.assign(self, {enableCache, getCachedResult, setCachedResult});

   function enableCache () {
      self.cache = self.apos.caches.get(self.__meta.name);
   }

   async function setCachedResult (userName, error, profile) {
      if (!cacheEnabled || !userName || !(error || profile)) {
         return;
      }

      log('setCachedResult[%s] "%s"  %o', error ? 'ERR' : 'OK', userName, error || profile && profile.id);

      const data = {
         userName,
         error: error || null,
         profile: profile || null,
         status: error ? 'ERR' : 'OK',
      };
      const ttl = error ? errorTTL : cacheTTL;
      const err = await promiseError(self.cache.set(userName, data, ttl));
      if (err) {
         log('setCachedResult: persistence error: "%s" %o', userName, err);
      }
      await self.emit('cachedResult', {userName, ttl, error: error || err || null});
   }

   async function getCachedResult (userName) {
      if (!cacheEnabled) {
         log('cache disabled');
         return null;
      }

      const {threw, result} = await promiseResult(self.cache.get(userName));

      if (threw) {
         log('ERR %s, %O', userName, result);
         return {userName, error: result, profile: null};
      }

      if (!result) {
         log('[%s]: MISS', userName);
         return {userName, error: null, profile: null};
      }

      log('Result [%s]: %s', userName, result.status);

      return result;
   }

};
