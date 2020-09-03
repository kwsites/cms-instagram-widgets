const $requests = [];
const $matches = [];
const $get = (url) => jest.requireActual('bent')(200, 'GET', 'string')(url);
const $json = (url) => jest.requireActual('bent')(200, 'GET', 'json')(url);
const $reset = () => $matches.length = $requests.length = 0;
const $urlMatching = (url, data) => $requests
   .filter(r => r.url.includes(url))
   .forEach(r => r.send(data));
const $theUrl = (url) => $requests
   .filter(r => r.url.includes(url));
const $respondTo = (url) => ({
   withHtml (html) {
      $matches.push({
         test (req) {
            return req.includes(url)
         }, send () {
            return html
         }
      })
   }
});

module.exports = Object.assign(jest.fn((...options) => {
   return jest.fn(url => new Promise(send => {
      $requests.push({
         url, options, send
      });
      $matches.some(m => m.test(url) ? (send(m.send()) || true) : false);
   }));
}), {$requests, $reset, $urlMatching, $theUrl, $respondTo, $get, $json});
