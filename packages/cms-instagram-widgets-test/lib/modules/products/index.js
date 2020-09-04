import { promiseResult } from "@kwsites/promise-result";

module.exports = {
   extend: 'apostrophe-pieces',
   alias: 'products',
   name: 'product',
   label: 'Product',

   addFields: [{name: 'profile', type: 'string'}],

   construct (self, options) {
      self.addProduct = async (title = 'product title', profile = title) => {
         await promiseResult(self.insert(self.apos.tasks.getReq(), Object.assign(self.newInstance(), {
            profile, title, slug: title.toLowerCase().replace(/[^a-z]+/g, '-')
         })));
      }
   }
};
