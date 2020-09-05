const fetch = require("bent")('GET', 'string');
const parse5 = require('parse5');
const {get} = require('lodash');
const {mediaItemDisplayUrl, profileUrl, userMediaItem, userProfile} = require('./profile-user-media');

module.exports = (self, options) => {

   const log = self.log.extend('anon');

   Object.assign(self, { anonymousLoadProfile });

   async function anonymousLoadProfile (req, username) {
      log(`loading %s`, username);
      const document = parse5.parse(await fetch(profileUrl(username)));

      const data = document.childNodes.reduce(sharedDataCollector, null);
      log(`sharedData located: %s`, !!data);

      const user = get(data, 'entry_data.ProfilePage[0].graphql.user', {});
      if (!user.id) {
         throw new Error(`Profile Search Failed: invalid user: "${ username }"`);
      }

      return userProfile(
         user.id,
         user.username,
         user.full_name,
         user.profile_pic_url_hd || user.profile_pic_url,
         getMedia(get(user, 'edge_owner_to_timeline_media.edges', [])),
      )
   }

   function getMedia (items) {
      return items.reduce((all, current) => {
         const thumbnailUrl = mediaImageThumbnailUrl(current);

         if (thumbnailUrl) {
            all.push(userMediaItem(
               mediaEdgeCaption(current), thumbnailUrl, mediaItemDisplayUrl(mediaEdgeShortCode(current))
            ));
         }

         return all;
      }, []);

   }

   function sharedDataCollector(sharedData, node) {
      if (sharedData) {
         return sharedData;
      }

      const name = node.name || node.tagName;
      if (name === 'script' && !node.attrs.find(isSrcAttribute)) {
         return sharedDataFromText(node.childNodes[0].value);
      }

      return (node.childNodes || []).reduce(sharedDataCollector, sharedData);
   }

   function sharedDataFromText (text) {
      const result = /^window._sharedData = (.+);$/.exec(String(text).trim());
      try {
         return result && JSON.parse(result[1]);
      }
      catch (e) {
         log(`sharedDataFromText failed: %o`, e);
         return null;
      }
   }

};

function mediaImageThumbnailUrl (mediaEdge) {
   const resources = get(mediaEdge, 'node.thumbnail_resources');
   if (Array.isArray(resources)) {
      for (let i = resources.length - 1; i >= 0; i--) {
         const {src} = resources[i];
         if (src) {
            return src;
         }
      }
   }

   return null;
}

function isSrcAttribute (attr) {
   return attr && attr.name === 'src';
}

function mediaEdgeCaption (mediaEdge) {
   return get(mediaEdge, 'node.edge_media_to_caption.edges[0].node.text', '');
}

function mediaEdgeShortCode (mediaEdge) {
   return get(mediaEdge, 'node.shortcode', '');
}
