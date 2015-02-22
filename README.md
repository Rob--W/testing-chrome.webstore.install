## Testing chrome.webstore.install without UI

In unit tests (e.g. using Selenium and ChromeDriver), one of the recurring
problems is automated testing of [inline installation](https://developers.google.com/chrome/web-store/docs/inline_installation).

The problem is that calling `chrome.webstore.install` creates a confirmation
dialog that cannot be instrumented or controlled by ChromeDriver. There exist
platform-specific hacks to click on the button (e.g. via AutoIt), but these are
not reliable.

This repository provides a helper extension and a sample to show how you *can*
achieve full test coverage.


## Usage
1. Edit `helper/background.js` and put the extension ID of your extension in the
   `extensions_to_disable` array at the top of the file.
2. Start Chrome in a *new profile* and load the two helper extensions, plus your
   extension/app that needs to be installed inline. Example:

   ```
   # Assume that you are in the directory of this repo
   chromium --user-data-dir=/tmp/profile --load-extension=helper,helper-app,test-extension
   ```
3. From the web page, call `chrome.webstore.install`. Here is an example:
   https://robwu.nl/s/chrome.webstore.install-demo.html

If you try out the demo, you will see that installation succeeds, without any
popups or dialogs!


## How does it work
1. First. edit `helper/background.js` and put the extension ID of your extension
   in the `extensions_to_disable` array at the top of the file.
2. Upon start-up, the helper extension will disable this extension as soon as
   possible.
3. Whenever `chrome.webstore.install` is called, the extension is enabled and
   reloaded via a helper app (that uses the `developerPrivate` API).

The mocked `chrome.webstore.install` closely follows the implementation of the
real API of Chrome; Input is validated according to the (undocumented) rules of
the inline installation API.


## Notes

- Make sure that the helper extension is loaded as fast as possible.
- When the helper extension does not finish loading before the test extension,
  a race condition may occur and cause the test extension to be around for a
  split second before it is disabled.


## License
Copyright 2015 Rob Wu <rob@robwu.nl> (https://robwu.nl)
Available under the [MIT license](http://opensource.org/licenses/MIT).
