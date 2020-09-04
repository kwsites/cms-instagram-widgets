import { promiseResult } from "@kwsites/promise-result";
import { createApos, createAposModulesConfig, parkedPage } from "../app";
import { area, areaItem } from "../__fixtures__";

describe('integration', function () {

   jest.setTimeout(300000000);

   let apos, instaWidgetModule, bent, ig, beforeLoad, afterLoad, cachedResult;
   let aposEvents = {};

   function moduleEvent (evt) {
      return new Promise(done => {
         instaWidgetModule.on(evt, `waitFor_${ evt }_${ Date.now() }`,
            aposEvents[evt] = jest.fn((...args) => done(...args))
         )
      });
   }

   function getUrl (url) {
      return bent.$get(`${ apos.baseUrl }${ url }`);
   }

   function givenAnonMode () {
      jest.spyOn(instaWidgetModule, 'getAuthConfig').mockImplementation(() => undefined);
      bent.$respondTo('/first_account/').withHtml(require('../__fixtures__/mock-response-anon'));
   }

   beforeEach(async function () {
      const moduleConfig = createAposModulesConfig({}, [
         parkedPage({
            slug: '/named-user',
            body: area(
               areaItem()
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
            body: area(
               areaItem()
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
            body: area(
               areaItem()
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
      instaWidgetModule = apos.modules['@kwsites/cms-instagram-widgets'];

      await apos.products.addProduct('first', 'first_account');
      await apos.products.addProduct('second', 'acct_second');

      beforeLoad = moduleEvent('beforeLoad');
      afterLoad = moduleEvent('afterLoad');
      cachedResult = moduleEvent('cachedResult');
   });
   beforeEach(() => (bent = require('bent')).$reset());
   beforeEach(() => (ig = require('instagram-private-api')));

   afterEach(() => {
      bent.$reset();
      require('instagram-private-api').$reset();
      aposEvents = {};
   });
   afterEach(() => new Promise(done => apos.destroy(done)));

   it('has a baseUrl', () => {
      expect(apos.baseUrl).toMatch(/^http:\/\/localhost:\d{4}/);
   });

   it('renders a piece index page', async () => {
      expect(await getUrl(`/products`)).not.toBeFalsy();
   });

   it('reuses cached galleries when available', async () => {
      givenAnonMode()

      const pageA = await getUrl('/products/first');
      expect(aposEvents.beforeLoad).toHaveBeenCalledTimes(1);
      expect(bent.$theUrl('/first_account/')).toHaveLength(1);
      expect(await cachedResult).toHaveProperty('error', null);

      const pageB = await getUrl('/products/first');
      expect(aposEvents.beforeLoad).toHaveBeenCalledTimes(1);
      expect(bent.$theUrl('/first_account/')).toHaveLength(1);

      const countA = Array.from(/^ID=(\d+)/.exec(String(pageA).trim()) || []).pop();
      expect(String(pageB).trim().startsWith(`ID=${ +countA + 1 }`)).toBe(true);
   });

   it('renders a gallery widget - anonymous', async () => {
      givenAnonMode();

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
