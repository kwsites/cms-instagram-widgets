const {promiseError, promiseResult} = require('@kwsites/promise-result');

module.exports = (self, {cacheTTL = 86400, cacheEnabled = true}) => {

   const log = self.log.extend('cache');

   Object.assign(self, {enableCache, setCachedProfile, getCachedProfile});

   function enableCache () {
      self.cache = self.apos.caches.get(self.__meta.name);
   }

   async function setCachedProfile (data) {
      if (!cacheEnabled || !data || !data.userName) {
         return;
      }

      log('set %s', data.userName);

      const err = await promiseError(self.cache.set(data.userName, data, cacheTTL));
      if (err) {
         log('set:error %o %O', data, err);
      }
   }

   async function getCachedProfile (userName) {
      if (!cacheEnabled) {
         log('cache disabled');
         return null;
      }

      const {success, result} = await promiseResult(self.cache.get(userName));
      if (!success) {
         log('ERR %s, %O', userName, result);
      }

      log('[%s]: %s', result ? 'HIT' : 'MISS', userName);
      return success && result || null;
   }

};
