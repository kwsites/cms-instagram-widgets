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
    '@kwsites/cms-instagram-widgets': {},
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



