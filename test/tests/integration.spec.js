import { createApos, createAposModulesConfig, pageArea, pageAreaItem, parkedPage } from "../app";
import { promiseResult } from "@kwsites/promise-result";

describe('integration', function () {

   jest.setTimeout(30000);

   let apos, bent, ig, beforeLoad, afterLoad;

   function beforePageSend () {
      return new Promise(done =>
         apos.products.on('apostrophe-pages:beforeSend', `waitForPageSend_${ Date.now() }`, done));
   }
   function moduleEvent(evt) {
      return new Promise(done =>
         apos.modules['@kwsites/cms-instagram-widgets'].on(`${evt}`, `waitFor_${evt}_${ Date.now() }`, done));
   }
   function getUrl(url) {
      return bent.$get(`${ apos.baseUrl }${ url }`);
   }

   beforeEach(async function () {
      const moduleConfig = createAposModulesConfig({}, [
         parkedPage({
            slug: '/named-user',
            body: pageArea(
               pageAreaItem()
                  .ofType('@kwsites/cms-instagram')
                  .options({
                     "columns": 4,
                     "limit": 4,
                     "_id": "w37670647317242034",
                     "username": "hello",
                  })
            )
         }),
         parkedPage({
            slug: '/single-embed',
            body: pageArea(
               pageAreaItem()
                  .ofType('@kwsites/cms-instagram')
                  .options({
                     "_id": "w37670647317242034",
                     "url": "https://www.instagram.com/p/CEmccCyB-AP/",
                  })
            )
         }),
         parkedPage({
            type: 'products-page',
            slug: '/products',
            body: pageArea(
               pageAreaItem()
                  .ofType('@kwsites/cms-instagram')
                  .options({
                     "columns": 4,
                     "limit": 4,
                     "_id": "w37670647317242034",
                  })
            )
         }),
      ]);
      const {value: _apos, error} = await promiseResult(createApos(moduleConfig));
      if (error) {
         console.error(error);
         process.exit();
      }

      apos = _apos;
      await apos.products.addProduct('first', 'first_account');
      await apos.products.addProduct('second', 'acct_second');

      beforeLoad = moduleEvent('beforeLoad');
      afterLoad = moduleEvent('afterLoad');
   });
   beforeEach(() => (bent = require('bent')).$reset());
   beforeEach(() => (ig = require('instagram-private-api')));

   afterEach(() => bent.$reset());
   afterEach(() => require('instagram-private-api').$reset());
   afterEach(() => new Promise(done => apos.destroy(done)));

   it('has a baseUrl', () => {
      expect(apos.baseUrl).toMatch(/^http:\/\/localhost:\d{4}/);
   });

   it('renders a piece index page', async () => {
      const productPage = bent.$get(`${ apos.baseUrl }/products`);
      await beforePageSend();

      expect(await productPage).not.toBeFalsy();
   });

   it('renders a gallery widget - anonymous', async () => {
      jest.spyOn(apos.modules['@kwsites/cms-instagram-widgets'], 'getAuthConfig')
         .mockImplementation(() => undefined);

      bent.$respondTo('/first_account/').withHtml(require('../__fixtures__/mock-response-anon'));

      const page = getUrl('/products/first');
      expect(await beforeLoad).toEqual(expect.objectContaining({
         username: 'first_account',
         type: 'anon',
         loader: expect.any(Function),
      }));

      const html = await page;
      expect(bent.$theUrl('/first_account/')).toHaveLength(1);
   });

   it('renders a gallery widget - auth', async () => {
      jest.spyOn(apos.modules['@kwsites/cms-instagram-widgets'], 'getAuthConfig')
         .mockImplementation(() => ({
            source: 'inline',
            user: 'hello',
            pass: 'world',
         }));

      const {user, feed} = require('../__fixtures__/mock-response-auth');
      ig.$create('ok', user, feed);

      const page = getUrl('/products/second');
      expect(await beforeLoad).toEqual(expect.objectContaining({
         username: 'acct_second',
         type: 'auth',
         loader: expect.any(Function),
      }));

      expect(await afterLoad).toEqual(expect.objectContaining({
         username: 'acct_second',
         profile: expect.objectContaining({
            userName: 'acct_second',
            id: '0000000',
            media: [
               expect.objectContaining({caption: 'Image One'}),
               expect.objectContaining({caption: 'Image Two'}),
            ]
         })
      }))

      expect(await page).not.toBeFalsy();
   });

})
