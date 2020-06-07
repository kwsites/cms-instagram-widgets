
const fetch = require("bent")('GET', 'string');
const parse5 = require("parse5");
const {InstagramProfile} = require("./instagram-profile");
const PromiseCache = require('@kwsites/promise-cache');

const cache = new PromiseCache(PromiseCache.FIVE_MINUTES);

class InstagramProfileLoader {

    constructor(username) {
        this.username = username;
    }

    static profileUrl(profile) {
        return `https://www.instagram.com/${profile}/`;
    }

    get() {
       return cache.get(this.username) || cache.set(this.username, loader(this.username));
    }
}

async function loader (username) {
   const document = parse5.parse(await fetch(InstagramProfileLoader.profileUrl(username)));

   const scripts = document.childNodes.reduce(collector, []);
   const script = scripts.find(s => /window._sharedData/.test(s.value));

   if (!script) {
      throw new Error(
         `No matching script tag found, total=${ scripts.length } inline=${ scripts.filter(s => !s.remote).length })`
      );
   }

   let data = script.value.trim().replace(/^window._sharedData = (.+);$/, '$1');
   try {
      data = JSON.parse(data);
   }
   catch (e) {
      throw new Error('Invalid JSON in response: ' + data);
   }

   return new InstagramProfile(data.entry_data.ProfilePage[0].graphql.user);
}

function collector(scripts, node) {
    const name = node.name || node.tagName;
    if (name === 'script') {
        const srcAttr = node.attrs.findIndex(a => a.name === 'src');
        scripts.push({
            remote: srcAttr >= 0,
            src: srcAttr === -1 ? null : node.attrs[srcAttr].value,
            value: srcAttr !== -1 ? null : node.childNodes[0].value
        });
    }
    (node.childNodes || []).reduce(collector, scripts);
    return scripts;
}

module.exports.InstagramProfileLoader = InstagramProfileLoader;
