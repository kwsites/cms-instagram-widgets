module.exports = {
   userProfile,
   userMediaItem,
   mediaItemDisplayUrl,
   profileUrl,
};

function profileUrl (username) {
   return `https://www.instagram.com/${ username }/`;
}

function mediaItemDisplayUrl (shortCode) {
   return `https://www.instagram.com/p/${ shortCode }/`;
}

function userProfile (id, userName, name, profilePicUrl, media = []) {
   return {
      id,
      userName,
      name,
      profilePicUrl,
      media,
   };
}

function userMediaItem (caption, thumbnailUrl, displayUrl) {
   return {
      caption, thumbnailUrl, displayUrl,
   };
}

class ProfileUserMedia {
   constructor (user) {
      this.biography = user.biography;
      this.followers = user.edge_followed_by.count;
      this.following = user.edge_follow.count;
      this.posts = user.edge_owner_to_timeline_media.count;
      this.name = user.full_name;
      this.userName = user.username;
      this.media = user.edge_owner_to_timeline_media.edges.map(edge => ({
         caption: caption(edge.node.edge_media_to_caption.edges),
         code: edge.node.shortcode,
         dimensions: edge.node.dimensions,
         id: edge.node.id,
         displayUrl: `https://www.instagram.com/p/${ edge.node.shortcode }/?taken-by=${ user.username }`,
         imageUrl: edge.node.display_url,
         thumbnailUrl: edge.node.thumbnail_resources.pop().src,
         takenAt: new Date(edge.node.taken_at_timestamp * 1000)
      }));
   }

}

module.exports.InstagramProfile = ProfileUserMedia;

function caption (edges) {
   return (edges.length && edges[0].node) ? edges[0].node.text : '';
}
