
const request = require('request');

module.exports = function instagram (self, oembetter) {

   oembetter.addBefore((url, options, response, callback) => {

      if (!url.match(/instagram.com\/p\//)) {
         return setImmediate(callback);
      }

      request('https://api.instagram.com/oembed/?url=' + encodeURIComponent(url), (err, resp, body) => {

         if (err) {
            return callback(err);
         }

         const json = JSON.parse(body);

         callback(null, url, options, {
            type: 'instgaram',
            html: json.html.replace(/<script[^>]*>.*<\/script[^>]*>/g, ''),
            title: json.title,
            thumbnail_url: json.thumbnail_url,
            thumbnail_width: json.thumbnail_width,
            thumbnail_height: json.thumbnail_height,
         });

      });


   });

};
