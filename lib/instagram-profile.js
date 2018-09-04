
class InstagramProfile {
    constructor(user) {
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
            displayUrl: `https://www.instagram.com/p/${edge.node.shortcode}/?taken-by=${user.username}`,
            id: edge.node.id,
            imageUrl: edge.node.display_url,
            takenAt: new Date(edge.node.taken_at_timestamp * 1000),
            thumbnailUrl: edge.node.thumbnail_resources.pop().src
        }));
    }
}

module.exports.InstagramProfile = InstagramProfile;

function caption (edges) {
   return (edges.length && edges[0].node) ? edges[0].node.text : '';
}
