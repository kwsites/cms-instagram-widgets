(function (apos, jQuery) {

   apos.define('@kwsites/cms-instagram-widgets', {
      extend: 'apostrophe-widgets',
      construct: function(self) {
         self.play = _.throttle(play, 5000, {leading: true, trailing: true});
      }
   });

   function play () {
      if (jQuery('.instagram-media:not(.instagram-media-rendered)').length === 0) {
         return;
      }

      var script = document.createElement('script');
      script.async = true;
      script.src = '//www.instagram.com/embed.js';
      script.onload = function () {
         script.parentNode.removeChild(script);
      };

      document.body.appendChild(script);
   }

}(window.apos, window.jQuery));
