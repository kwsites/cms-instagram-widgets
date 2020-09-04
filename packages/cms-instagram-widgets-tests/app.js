import { promiseError, promiseResult } from "@kwsites/promise-result";
import { join } from "path";
import apostrophe from "apostrophe";

let cacheCollectionSuffix = 0;

function mockLogger () {
   const logs = new Map();
   const save = (level, ...args) => logs.set(level, add2(args, logs.get(level)));
   const add2 = (add, all = []) => {
      all[all.length] = add;
      return all;
   }

   return 'log info debug warn error'.split(' ').reduce((logger, level) => {
      logger[level] = save.bind(null, level);
      return logger;
   }, {
      $reset () {
         logs.clear()
      }
   });
}

async function minimalModuleConfig ({
                                       port = '7900',
                                       secret = '12342564'
                                    } = {}) {

   process.env.APOS_MONGODB_URI = process.env.MONGO_URL;

   return {
      'apostrophe-db': {
         connect: {
            useUnifiedTopology: true,
         }
      },
      'apostrophe-express': {alias: 'express', port, session: {secret}},
      'apostrophe-assets': {jQuery: 3},
      'apostrophe-utils': {logger: mockLogger}
   };
}

export async function createApos (moduleConfig = {}) {
   const modules = Object.entries(moduleConfig).reduce((all, [name, config]) => {
      all[name] = Object.assign(all[name] || {}, config);
      return all;
   }, await minimalModuleConfig());

   const {result, threw} = await promiseResult(new Promise((done, fail) => {
      const apos = apostrophe({
         shortName: 'test-app',
         baseUrl: `http://localhost:${ modules['apostrophe-express'].port }`,
         modules,
         root: module,
         npmRootDir: join(__dirname, '..', 'node_modules'),
         afterListen (err) {
            err ? fail(err) : done(apos);
         },
      });
   }));

   if (threw) {
      await promiseError()
      throw result;
   }

   return result;
}

export function parkedPage ({title = 'Page Title', type = 'default', slug = '/page-url', published = true, body} = {}) {
   return {
      title,
      type,
      slug,
      published,
      body,
   };
}

export function createAposModulesConfig (config = {}, parkedPages = []) {
   return Object.entries(config).reduce((modules, [key, value]) => {
      return (modules[key] = Object.assign(modules[key] || {}, value || {})) && modules;
   }, {
      ...minimalModuleConfig(),
      '@kwsites/cms-instagram-widgets': {},
      'apostrophe-override-options': {},
      'apostrophe-caches': {
         construct (self, options) {
            self.getCollection = async (callback) => {
               self.cacheCollection = await self.apos.db.collection(`aposCacheCollection${ ++cacheCollectionSuffix }`);
               callback(null);
            }
         }
      },
      'apostrophe-pages': {
         park: [
            ...parkedPages,
         ],
         types: [
            {
               name: 'default',
               label: 'Default'
            },
            {
               name: 'products',
               label: 'Products'
            }
         ]
      },
      'products': {
         overrideOptions: {
            editable: {
               'apos.@kwsites/cms-instagram-widgets.galleryUserName': 'profile'
            }
         }
      },
      'products-pages': {},
      'page-counter': {
         construct (self, options) {
            let counter = 0;
            self.pageBeforeSend = (req, callback) => {
               callback(null, req.data.counter = ++counter);
            };
         }
      }
   });
}
