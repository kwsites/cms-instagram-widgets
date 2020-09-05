const {promiseResult} = require('@kwsites/promise-result');
const {IgApiClient} = require('instagram-private-api');
const {get} = require('lodash');
const {mediaItemDisplayUrl, userMediaItem, userProfile} = require('./profile-user-media');

module.exports = (self, options) => {

   const log = self.log.extend('auth');
   const clientPool = [];

   Object.assign(self, {
      authenticatedLoadProfile,
      getApiAuth,
      getApiClient,
      isSupportedAuthSource,
      validateAuthConfig,
   });

   function validateAuthConfig (req) {
      const authConfig = self.getAuthConfig(req);
      if (!authConfig) {
         return 'Authentication not configured';
      }

      const {source = 'inline', ...auth} = authConfig;
      const message = [];
      ['user', 'pass'].forEach(prop => {
         if (!auth[prop]) {
            return message.push(`Missing required property ${ prop }`);
         }
         if (source === 'env' && !process.env[auth[prop]]) {
            return message.push(`Environment variable ${ auth[prop] } must not be empty.`);
         }
      });

      if (!self.isSupportedAuthSource(source)) {
         message.push(`Unknown auth source: "${ source }"`);
      }

      return message.join('. ')
   }

   function isSupportedAuthSource (source) {
      return source === undefined || /^(env|inline)$/.test(source);
   }

   function getApiAuth (req) {
      const {source, user, pass} = {source: 'inline', ...(self.getAuthConfig(req) || {})};
      switch (source) {
         case 'env':
            return [process.env[user], process.env[pass]];
         case 'inline':
            return [user, pass];
         default:
            throw new Error(`Unknown auth source type: "${ source }"`);
      }
   }

   async function getApiClient (req) {
      log(`getApiClient`);
      const [authUser, authPass] = self.getApiAuth(req);

      const ig = new IgApiClient();
      ig.state.generateDevice(authUser);

      log(`getApiClient: authenticating`);
      const auth = await promiseResult(ig.account.login(authUser, authPass));
      if (auth.threw) {
         throw new Error(`Authorisation Failed: ${ auth.error.message }`);
      }

      log(`getApiClient: ready`);
      return ig;
   }

   async function getClient (req) {
      log(`getClient: reusing client from pool, pool-size=%s`, clientPool.length);
      return (clientPool.length) ? clientPool.shift() : await self.getApiClient(req);
   }

   function yieldClient (ig) {
      clientPool.push(ig);
      log(`yieldClient: returned client to pool, pool-size=%s`, clientPool.length);
   }

   async function getUser (ig, fetchProfile) {
      const {success, result} = await promiseResult(ig.user.searchExact(fetchProfile));

      if (!success) {
         throw new Error(`Profile Search Failed: ${ result.message }`);
      }

      if (!result.pk) {
         throw new Error(`Profile Search Failed: invalid user: "${ fetchProfile }"`);
      }

      return result;
   }

   async function getMedia (ig, userId) {
      const feed = ig.feed.user(userId)
      return profileFeedMedia(await feed.request());
   }

   async function authenticatedLoadProfile (req, username) {
      const ig = await getClient(req);

      const user = await getUser(ig, username);
      const profile = userProfile(user.pk, user.username, user.full_name, user.profile_pic_url, await getMedia(ig, user.pk));

      yieldClient(ig);

      return profile;
   }

};

function mediaImageThumbnailUrl (mediaItem) {
   let thumbnailUrl;
   [mediaItem, ...get(mediaItem, 'carousel_media', [])].some(item =>
      (thumbnailUrl = get(item, 'image_versions2.candidates[0].url'))
   );

   return thumbnailUrl || null;
}

function profileFeedMedia ({items}) {
   return items.reduce((all, current) => {
      const thumbnailUrl = mediaImageThumbnailUrl(current);

      if (thumbnailUrl) {
         all.push(userMediaItem(current.caption.text, thumbnailUrl, mediaItemDisplayUrl(current.code)));
      }

      return all;
   }, []);
}
