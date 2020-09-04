
let areaItemConfigs = areaItemsGroup();

module.exports = {
   area,
   areaItem,
   areaItemsGroup,
}

function area (...items) {
   return {
      type: 'area',
      items: items.map(item => areaItemConfigs.get(item)),
   };
}

function areaItem () {
   const item = Object.assign(areaItemConfigs.add(), {
      ofType (type) {
         return areaItemConfigs.and(item, 'type', type);
      },
      options (options) {
         return areaItemConfigs.merge(item, options);
      },
   });
   return item;
}

function areaItemsGroup () {
   const all = new WeakMap();

   return {
      add () {
         const builder = {};
         all.set(builder, {});
         return builder;
      },
      and (builder, key, value) {
         all.get(builder)[key] = value;
         return builder;
      },
      merge (builder, opt) {
         Object.assign(all.get(builder), opt);
         return builder;
      },
      get (builder) {
         return all.get(builder) || builder;
      }
   }
}
