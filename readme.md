# @kwsites/cms-instagram-widgets

Instagram widget compatible with the apostrophe cms

## Getting Started

Install with `npm i @kwsites/cms-instagram-widgets` or `yarn add @kwsites/cms-instagram-widgets`.

Ensure your application also has a dependency on [@kwsites/cms-common](https://github.com/kwsites/cms-common),
which provides the less plugins used by this library to generate its theme.

Add both libraries to your `app.js`:

```javascript
// app.js
apostrophe({
  modules: {
    '@kwsites/cms-common': {},
    '@kwsites/cms-instagram-widgets': {
      auth: { /* see authentication below */ }
    },
  }
});
```

To use the widget in an `area`:

```html
<!-- in any template.html -->
{{
  apos.area(
    data.page,
    "myAreaName",
    {
      widgets: {
        "@kwsites/cms-instagram": {
        }
      }
    }
  )
}}
```

## Authentication

Periodically instagram will require that a valid Instagram account has logged into the site for the IP and "device"
to show profile data. To manage the interaction with Instagram, this library uses
[instagram-private-api](https://npmjs.com/package/instagram-private-api). Configure your account username/password
using one of the options below:

With `source=inline`, the username and password are used as-is from the module's configuration in `app.js`:

```javascript
const auth = { source: 'inline', user: 'USERNAME', pass: 'PASSWORD' };
```

With `source=env`, the username and password are read from the named environment variables:

```javascript
process.env.IG_USER = 'USERNAME';
process.env.IG_PASS = 'PASSWORD';
const auth = { source: 'env', user: 'IG_USER', pass: 'IG_PASS' };
```

```javascript
// set your auth options in the app.js configuration of the module
apostrophe({ modules: { '@kwsites/cms-instagram-widgets': { auth } } });
```

For a completely custom way to deliver your credentials, extend the module:

```javascript
apostrophe({ modules: { '@kwsites/cms-instagram-widgets': {
   construct (self, options) {
      // override the validation logic,
      // returning a non-empty string is deemed a validation failure
      self.validateAuthConfig = () => '';

      // get the username and password as a string array
      self.getApiAuth = () => ['USERNAME', 'PASSWORD'];
   }
 } } });
```

## Configuration Options

Options passed into the module configuration in your `app.js`:

- `auth: { source: 'inline' | 'env'; user: string; pass: string }`
  sets the source of your instagram authentication credentials, can be omitted entirely to fetch as a guest (note that guest access will likely not work in production due to rate limiting etc)

- `cacheTTL: number = 86400`
  sets the duration (in seconds) a profile gallery should be cached before re-fetching

- `cacheEnabled: boolean = true`
  optionally disable the ability to cache profile galleries

- `errorTTL: number = 1200`
  sets the duration (in seconds) to wait before reattempting to load a profile gallery that returned an error.

## Offline Mode

Set the global `apos.options.locals.offline` to `true` by adding `offline: true` to your `data/local.js` to prevent
attempting to fetch profiles remotely, useful when working offline to return early rather than attempt to connect to
the remote instagram server.


## Post-Install

At the time of publishing, [Apostrophe CMS](https://apostrophecms.org/) doesn't automatically support `@scoped/` dependency modules,
which causes an error when the CMS starts up and is unable to symlink the source of the modules into the `/public` folder correctly.

To resolve this, you need to manually create the directory `/public/modules/@kwsites` before starting the server. To have this run
automatically after installing dependencies, add the following to your `package.json` `scripts` block:

```json
{
  "scripts": {
    "postinstall": "mkdir -p ./public/modules/@kwsites"
  }
}
```

## Troubleshooting

This library uses [debug](https://www.npmjs.com/package/debug) to manage its logging,
enable the log by running your application with the `DEBUG` environment variable:

```
$ DEBUG=@kwsites/cms-instagram-widgets:* node app.js
```

Alternatively, set the `verbose` option for this module in your `app.js`:

```javascript
// app.js
apostrophe({
  modules: {
    '@kwsites/cms-common': {},
    '@kwsites/cms-instagram-widgets': { verbose: true },
  }
});
```



