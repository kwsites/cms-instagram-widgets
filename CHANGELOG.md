
# Change History & Release Notes

## 2.1.0 - Centred Images

- To cater for non-square aspect ratio images in the grid, centres the images within the
  available space when viewing a gallery of thumbnails

## 2.0.1 - Overridable options, target apostrophe 2.111

- Switched to using `getOption` for all places the gallery profile is looked up, to allow
  altering it based on the page / piece properties where the gallery is being rendered. For
  a module that extends `apostrophe-pieces`, add an option:

  ```
   overrideOptions: {
      editable: {
         'apos.@kwsites/cms-instagram-widgets.galleryUserName': 'myPieceFieldName'
      }
   },
  ```

## 0.9.1 - logging

- Adds `debug` to handle optionally logging to the console

## 0.8.0 - remove deprecated dependencies

- Fixes an issue whereby the library relied on the container apostrophe app depending
  upon `request`. Replace the `request` and `node-fetch` dependencies with
  [bent](https://www.npmjs.com/package/bent).



